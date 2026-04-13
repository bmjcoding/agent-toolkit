#!/usr/bin/env python3
"""Save retro summaries and analyze trends across runs.

Maintains an append-only JSONL history file. Each entry is one retro's
summary metrics. Trends analysis compares the current run against
historical data to surface patterns.

Usage:
    python3 scripts/retro-history.py save    SUMMARY_JSON [OPTIONS]
    python3 scripts/retro-history.py trends  [OPTIONS]
    python3 scripts/retro-history.py list    [OPTIONS]

Commands:
    save     Append a retro summary to history
    trends   Analyze trends across saved retros
    list     List all saved retros (most recent first)

Arguments:
    SUMMARY_JSON   JSON string or file path containing the retro summary

Options:
    --history DIR    Directory for history file (default: ~/.claude/retros)
    --subject NAME   Filter by retro subject (e.g., orchestrator, git-ship, frontend-engineer)
    --last N         For trends, compare against last N retros (default: 10)
    --output FILE    Write output to FILE instead of stdout
    --help           Show this help message

History file: {history_dir}/history.jsonl (one JSON object per line)
"""

import json
import os
import re
import statistics
import subprocess
import sys
from datetime import datetime
from pathlib import Path


def parse_args(argv):
    args = {
        "command": None,
        "summary": None,
        "history_dir": None,
        "subject": None,
        "last": 10,
        "output": None,
    }
    i = 1
    while i < len(argv):
        if argv[i] == "--help":
            print(__doc__.strip())
            sys.exit(0)
        elif argv[i] == "--history" and i + 1 < len(argv):
            args["history_dir"] = argv[i + 1]
            i += 2
        elif argv[i] == "--subject" and i + 1 < len(argv):
            args["subject"] = argv[i + 1]
            i += 2
        elif argv[i] == "--last" and i + 1 < len(argv):
            args["last"] = int(argv[i + 1])
            i += 2
        elif argv[i] == "--output" and i + 1 < len(argv):
            args["output"] = argv[i + 1]
            i += 2
        elif args["command"] is None:
            args["command"] = argv[i]
            i += 1
        elif args["command"] == "save" and args["summary"] is None:
            args["summary"] = argv[i]
            i += 1
        else:
            print(f"Unknown option: {argv[i]}", file=sys.stderr)
            sys.exit(1)

    if not args["command"]:
        print("Error: Command required (save, trends, list).", file=sys.stderr)
        sys.exit(1)

    # Default to global retros directory
    if not args["history_dir"]:
        args["history_dir"] = os.path.join(os.path.expanduser("~"), ".claude", "retros")

    return args


def history_path(history_dir):
    return os.path.join(history_dir, "history.jsonl")


def load_history(history_dir):
    """Load all retro entries from history."""
    path = history_path(history_dir)
    if not os.path.isfile(path):
        return []
    entries = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    entries.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return entries


def parse_summary_input(summary_arg):
    """Parse summary from JSON string or file path."""
    if not summary_arg:
        print("Error: SUMMARY_JSON required for save.", file=sys.stderr)
        sys.exit(1)

    # Try as file path first
    if os.path.isfile(summary_arg):
        with open(summary_arg) as f:
            return json.load(f)

    # Try as JSON string
    try:
        return json.loads(summary_arg)
    except json.JSONDecodeError:
        print(f"Error: Cannot parse as JSON: {summary_arg[:100]}...", file=sys.stderr)
        sys.exit(1)


def cmd_save(args):
    """Save a retro summary to history."""
    summary = parse_summary_input(args["summary"])

    # Add metadata
    entry = {
        "timestamp": datetime.now().isoformat(),
        "summary": summary,
    }

    # Add git context if available
    try:
        branch = subprocess.run(
            ["git", "branch", "--show-current"],
            capture_output=True, text=True, timeout=5,
        )
        if branch.returncode == 0:
            entry["branch"] = branch.stdout.strip()

        head = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True, text=True, timeout=5,
        )
        if head.returncode == 0:
            entry["commit"] = head.stdout.strip()
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass

    # Append to history
    os.makedirs(args["history_dir"], exist_ok=True)
    path = history_path(args["history_dir"])
    with open(path, "a") as f:
        f.write(json.dumps(entry) + "\n")

    count = len(load_history(args["history_dir"]))
    return {"status": "saved", "history_file": path, "total_entries": count}


def safe_stat(values, func_name):
    """Compute a statistic, returning None if insufficient data."""
    if not values:
        return None
    if func_name == "mean":
        return round(statistics.mean(values), 1)
    if func_name == "median":
        return round(statistics.median(values), 1)
    if func_name == "stdev" and len(values) >= 2:
        return round(statistics.stdev(values), 1)
    return None


def filter_by_subject(entries, subject):
    """Filter entries by subject name. Handles both record shapes:
    - Retro records: subject is in summary.subject
    - Improve records: subject is at top level
    """
    if not subject:
        return entries

    def get_subject(e):
        # Improve records have subject at top level
        if e.get("type") == "improve":
            return e.get("subject", "")
        # Retro records have it in summary
        return e.get("summary", {}).get("subject", "")

    return [e for e in entries if get_subject(e).lower() == subject.lower()]


def cmd_trends(args):
    """Analyze trends across historical retros."""
    entries = load_history(args["history_dir"])
    entries = filter_by_subject(entries, args.get("subject"))

    if len(entries) < 2:
        subject_msg = f" for subject '{args['subject']}'" if args.get("subject") else ""
        return {
            "status": "insufficient_data",
            "entries": len(entries),
            "subject": args.get("subject"),
            "message": f"Need at least 2 retros{subject_msg} to analyze trends.",
        }

    recent = entries[-args["last"]:]

    # Extract metric series
    def get_metric(entry, *keys):
        val = entry.get("summary", {})
        for k in keys:
            if isinstance(val, dict):
                val = val.get(k)
            else:
                return None
        return val

    series = {
        "total_tokens": [],
        "agents_spawned": [],
        "quality_iterations": [],
        "findings_total": [],
        "findings_critical": [],
        "model_downgrades": [],
    }

    for e in recent:
        s = e.get("summary", {})

        tok = s.get("total_tokens") or s.get("total_tokens_consumed")
        if tok:
            series["total_tokens"].append(tok)

        agents = s.get("agents_spawned")
        if agents:
            series["agents_spawned"].append(agents)

        qi = (
            s.get("quality_iterations")
            or s.get("quality_loop_iterations")
            or (s.get("quality_loop") or {}).get("iterations")
        )
        if qi:
            series["quality_iterations"].append(qi)

        findings = s.get("findings")
        if isinstance(findings, dict):
            total = sum(findings.values())
            series["findings_total"].append(total)
            series["findings_critical"].append(findings.get("critical", 0))
        elif isinstance(findings, str):
            # Parse "N/N/N/N" format
            parts = findings.split("/")
            if len(parts) == 4:
                nums = [int(p.strip()) for p in parts]
                series["findings_total"].append(sum(nums))
                series["findings_critical"].append(nums[0])

        downgrades = s.get("model_downgrades_recommended") or s.get("model_downgrades")
        if downgrades is not None:
            series["model_downgrades"].append(downgrades)

    # Compute trends
    trends = {}
    for metric, values in series.items():
        if len(values) < 2:
            continue

        trend_entry = {
            "mean": safe_stat(values, "mean"),
            "median": safe_stat(values, "median"),
            "stdev": safe_stat(values, "stdev"),
            "latest": values[-1],
            "previous": values[-2],
            "count": len(values),
        }

        # Direction
        if values[-1] > values[-2]:
            trend_entry["direction"] = "increasing"
        elif values[-1] < values[-2]:
            trend_entry["direction"] = "decreasing"
        else:
            trend_entry["direction"] = "stable"

        # Flag if latest is an outlier (>2 stdev from mean)
        if trend_entry["stdev"] and trend_entry["mean"]:
            deviation = abs(values[-1] - trend_entry["mean"])
            if deviation > 2 * trend_entry["stdev"]:
                trend_entry["outlier"] = True

        trends[metric] = trend_entry

    # Recurring root causes
    root_cause_counts = {}
    for e in recent:
        s = e.get("summary", {})
        causes = s.get("root_causes")
        if isinstance(causes, dict):
            for cause, count in causes.items():
                root_cause_counts[cause] = root_cause_counts.get(cause, 0) + count
        elif isinstance(causes, str):
            for pair in causes.split(","):
                pair = pair.strip()
                match = re.match(r"(\w[\w\s]*\w):\s*(\d+)", pair)
                if match:
                    cause = match.group(1).strip()
                    count = int(match.group(2))
                    root_cause_counts[cause] = root_cause_counts.get(cause, 0) + count

    # Build result
    result = {
        "status": "ok",
        "subject": args.get("subject"),
        "retros_analyzed": len(recent),
        "date_range": {
            "oldest": recent[0].get("timestamp"),
            "newest": recent[-1].get("timestamp"),
        },
        "trends": trends,
    }

    if root_cause_counts:
        sorted_causes = sorted(root_cause_counts.items(), key=lambda x: -x[1])
        result["recurring_root_causes"] = [
            {"cause": cause, "total_occurrences": count}
            for cause, count in sorted_causes[:5]
        ]

    # Actionable observations
    observations = []

    tokens_trend = trends.get("total_tokens", {})
    if tokens_trend.get("direction") == "increasing" and tokens_trend.get("count", 0) >= 3:
        observations.append("Token consumption is trending up across recent runs — check for context bloat or unnecessary file reads.")

    findings_trend = trends.get("findings_total", {})
    if findings_trend.get("direction") == "stable" and findings_trend.get("count", 0) >= 3:
        observations.append("Findings count is stable — the same types of issues may be recurring without being addressed by /improve.")

    critical_trend = trends.get("findings_critical", {})
    if critical_trend.get("latest", 0) > 0 and all(v > 0 for v in series.get("findings_critical", [])[-3:]):
        observations.append("Critical findings in 3+ consecutive runs — a systemic issue may need manual intervention.")

    qi_trend = trends.get("quality_iterations", {})
    if qi_trend.get("mean", 0) > 1.5:
        observations.append(f"Quality loop averages {qi_trend['mean']} iterations — first-pass quality may be improvable through better specs or contracts.")

    if observations:
        result["observations"] = observations

    return result


def cmd_list(args):
    """List all saved retros."""
    entries = load_history(args["history_dir"])
    entries = filter_by_subject(entries, args.get("subject"))
    if not entries:
        subject_msg = f" for subject '{args['subject']}'" if args.get("subject") else ""
        return {"status": "empty", "message": f"No retros saved{subject_msg}."}

    listing = []
    for i, e in enumerate(reversed(entries)):
        # Detect entry type: improve records have top-level "type": "improve"
        # Retro records have a "summary" wrapper
        entry_type = e.get("type", "retro")
        item = {
            "index": len(entries) - i,
            "type": entry_type,
            "timestamp": e.get("timestamp"),
            "branch": e.get("branch"),
            "commit": e.get("commit"),
        }

        if entry_type == "improve":
            # Improve records have fields at top level
            item["subject"] = e.get("subject")
            item["accepted"] = e.get("accepted", 0)
            item["reverted"] = e.get("reverted", 0)
            item["lines_added"] = e.get("total_lines_added", 0)
            item["lines_removed"] = e.get("total_lines_removed", 0)
            item["retro_timestamp"] = e.get("retro_timestamp")
        else:
            # Retro records have fields inside "summary"
            s = e.get("summary", {})
            item["subject"] = s.get("subject")
            item["run_type"] = s.get("run_type")
            item["project"] = s.get("project")
            item["agents"] = s.get("agents_spawned")
            item["tokens"] = s.get("total_tokens") or s.get("total_tokens_consumed")

        listing.append(item)

    return {"status": "ok", "subject": args.get("subject"), "total": len(entries), "retros": listing}


def main():
    args = parse_args(sys.argv)

    if args["command"] == "save":
        result = cmd_save(args)
    elif args["command"] == "trends":
        result = cmd_trends(args)
    elif args["command"] == "list":
        result = cmd_list(args)
    else:
        print(f"Unknown command: {args['command']}", file=sys.stderr)
        print("Commands: save, trends, list", file=sys.stderr)
        sys.exit(1)

    output = json.dumps(result, indent=2)

    if args["output"]:
        with open(args["output"], "w") as f:
            f.write(output + "\n")
        print(f"Wrote to {args['output']}", file=sys.stderr)
    else:
        print(output)


if __name__ == "__main__":
    main()
