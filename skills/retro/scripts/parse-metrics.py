#!/usr/bin/env python3
"""Parse orchestrator artifacts and emit structured retro metrics.

Reads handoff files, plan.json, state.json, backlog.md, and git diff
to produce a JSON summary for the retro skill. Handles missing files
gracefully — every section is optional.

Usage:
    python3 scripts/parse-metrics.py [OPTIONS] [ORCHESTRATOR_DIR]

Arguments:
    ORCHESTRATOR_DIR  Path to the orchestrator directory (default: .orchestrator)

Options:
    --git-base BASE   Git ref to diff against (default: auto-detect merge-base with main)
    --output FILE     Write JSON to FILE instead of stdout
    --help            Show this help message

Output:
    JSON object with these top-level keys (all optional, present only if data exists):
      phases        - phase completion from state.json
      agents        - per-agent metrics from handoff files and agents.log
      plan_vs_outcome - plan-to-outcome file delta
      findings      - severity counts from backlog.md
      quality_loop  - iteration count and churn from backlog/state
      summary       - aggregate totals
"""

import json
import os
import re
import subprocess
import sys
from collections import Counter, defaultdict


def parse_args(argv):
    args = {"orch_dir": ".orchestrator", "git_base": None, "output": None}
    i = 1
    while i < len(argv):
        if argv[i] == "--help":
            print(__doc__.strip())
            sys.exit(0)
        elif argv[i] == "--git-base" and i + 1 < len(argv):
            args["git_base"] = argv[i + 1]
            i += 2
        elif argv[i] == "--output" and i + 1 < len(argv):
            args["output"] = argv[i + 1]
            i += 2
        elif not argv[i].startswith("-"):
            args["orch_dir"] = argv[i]
            i += 1
        else:
            print(f"Unknown option: {argv[i]}", file=sys.stderr)
            print("Run with --help for usage.", file=sys.stderr)
            sys.exit(1)
    return args


def read_json(path):
    """Read a JSON file, return None if missing or malformed."""
    try:
        with open(path) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError, PermissionError):
        return None


def parse_phases(orch_dir):
    """Extract phase completion from state.json."""
    state = read_json(os.path.join(orch_dir, "state.json"))
    if not state:
        return None
    return {
        "current_phase": state.get("phase"),
        "status": state.get("status"),
        "timestamp": state.get("timestamp"),
        "verdict": state.get("verdict"),
    }


def parse_handoffs(orch_dir):
    """Parse all handoff JSON files into per-agent metrics."""
    handoff_dir = os.path.join(orch_dir, "handoffs")
    if not os.path.isdir(handoff_dir):
        return None

    agents = []
    all_files_written = []
    file_writers = defaultdict(list)  # file → [agent_ids]

    for fname in sorted(os.listdir(handoff_dir)):
        if not fname.endswith(".json"):
            continue
        data = read_json(os.path.join(handoff_dir, fname))
        if not data:
            continue

        agent_id = fname.removesuffix(".json")
        files_written = data.get("files_written", data.get("files_modified", []))
        # Defend against integer counts (e.g. "files_written": 14) -- treat as empty list
        if isinstance(files_written, int):
            files_written = []
        all_files_written.extend(files_written)

        for f in files_written:
            file_writers[f].append(agent_id)

        agent_entry = {
            "id": agent_id,
            "mode": data.get("mode"),
            "status": data.get("status"),
            "files_written": files_written,
            "file_count": len(files_written),
        }

        # Extract optional fields
        for key in ("verdict", "iteration", "items_fixed", "items_escalated",
                     "contracts_verified", "contracts_failed", "issues",
                     "findings", "recommendations", "summary"):
            if key in data:
                agent_entry[key] = data[key]

        agents.append(agent_entry)

    # Detect ownership conflicts
    conflicts = {f: writers for f, writers in file_writers.items() if len(writers) > 1}

    result = {"agents": agents, "total_agents": len(agents)}
    if conflicts:
        result["file_conflicts"] = conflicts
    return result


def parse_agent_log(orch_dir):
    """Parse agents.log for token/turn/duration metrics.

    Expected format (one JSON object per line, or tab-separated):
        {"id": "...", "type": "...", "tokens": N, "turns": N, "duration_s": N}
    Falls back to regex parsing for other formats.

    Returns:
        (entries, diagnostic) — `entries` is a list of parsed dicts, or None
        if no usable data was found. `diagnostic` is a stable machine-readable
        diagnostic ({"status": "...", "reason": "...", "log_path": "..."})
        whenever entries is None, otherwise None. Consumers should surface
        the diagnostic verbatim rather than fabricating an error message.
    """
    log_path = os.path.join(orch_dir, "logs", "agents.log")
    if not os.path.isfile(log_path):
        return None, {
            "status": "no_token_data",
            "reason": "agents_log_missing",
            "log_path": log_path,
            "human_message": (
                "no token data in agents.log — orchestrator is not logging "
                "agent completion events"
            ),
        }

    entries = []
    try:
        with open(log_path) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                # Try JSON first
                try:
                    entry = json.loads(line)
                    entries.append(entry)
                    continue
                except json.JSONDecodeError:
                    pass
                # Fallback: extract numbers with labels
                entry = {}
                for pattern, key in [
                    (r"id[=:\s]+(\S+)", "id"),
                    (r"type[=:\s]+(\S+)", "type"),
                    (r"tokens?[=:\s]+(\d[\d,]*)", "tokens"),
                    (r"turns?[=:\s]+(\d+)", "turns"),
                    (r"duration[=:\s]+([\d.]+)", "duration_s"),
                ]:
                    m = re.search(pattern, line, re.IGNORECASE)
                    if m:
                        val = m.group(1).replace(",", "")
                        entry[key] = int(val) if key in ("tokens", "turns") else (
                            float(val) if key == "duration_s" else val
                        )
                if entry:
                    entries.append(entry)
    except (PermissionError, OSError) as exc:
        return None, {
            "status": "no_token_data",
            "reason": "agents_log_unreadable",
            "log_path": log_path,
            "human_message": f"agents.log exists but could not be read: {exc}",
        }

    if not entries:
        return None, {
            "status": "no_token_data",
            "reason": "agents_log_empty_or_no_token_fields",
            "log_path": log_path,
            "human_message": (
                "agents.log exists but contains no parseable token entries — "
                "orchestrator may be writing log lines without tokens/turns/"
                "duration fields"
            ),
        }

    has_any_tokens = any(e.get("tokens") is not None for e in entries)
    diagnostic = None
    if not has_any_tokens:
        diagnostic = {
            "status": "no_token_data",
            "reason": "log_entries_have_no_tokens_field",
            "log_path": log_path,
            "human_message": (
                "agents.log lines do not include a 'tokens' field — confirm "
                "the orchestrator is extracting tokens from the agent <usage> "
                "block before appending"
            ),
        }

    # Flag agents with concerning metrics
    for entry in entries:
        flags = []
        tokens = entry.get("tokens", 0)
        turns = entry.get("turns", 0)
        duration = entry.get("duration_s", 0)
        if tokens and tokens > 100_000:
            flags.append("context_pressure")
        if turns and turns > 40:
            flags.append("possible_loop")
        if duration and duration > 300:
            flags.append("bottleneck")
        if entry.get("file_count", 0) and tokens:
            ratio = tokens / max(entry["file_count"], 1)
            entry["tokens_per_file"] = round(ratio)
            if ratio > 20_000:
                flags.append("high_token_ratio")
        if flags:
            entry["flags"] = flags

    return entries, diagnostic


def parse_plan_vs_outcome(orch_dir, git_base):
    """Compare planned owned_files against actual git diff."""
    plan = read_json(os.path.join(orch_dir, "plan.json"))
    if not plan or "subtasks" not in plan:
        return None

    # Collect planned files
    planned = set()
    for subtask in plan["subtasks"]:
        for f in subtask.get("owned_files", []):
            planned.add(f)

    # Get actual changed files from git
    if not git_base:
        try:
            result = subprocess.run(
                ["git", "merge-base", "HEAD", "main"],
                capture_output=True, text=True, timeout=10
            )
            git_base = result.stdout.strip() if result.returncode == 0 else "HEAD~1"
        except (subprocess.TimeoutExpired, FileNotFoundError):
            git_base = "HEAD~1"

    try:
        result = subprocess.run(
            ["git", "diff", "--name-only", git_base],
            capture_output=True, text=True, timeout=10
        )
        actual = set(result.stdout.strip().split("\n")) if result.returncode == 0 else set()
        actual.discard("")
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return None

    unplanned = actual - planned
    missed = planned - actual
    overlap = planned & actual

    return {
        "planned_files": len(planned),
        "actual_files": len(actual),
        "matched": len(overlap),
        "unplanned": sorted(unplanned),
        "missed": sorted(missed),
        "unplanned_count": len(unplanned),
        "missed_count": len(missed),
    }


def parse_backlog(orch_dir):
    """Parse backlog.md for findings by severity."""
    backlog_path = os.path.join(orch_dir, "backlog.md")
    if not os.path.isfile(backlog_path):
        return None

    try:
        with open(backlog_path) as f:
            content = f.read()
    except (PermissionError, OSError):
        return None

    severity_counts = Counter()
    churn_files = Counter()

    for line in content.split("\n"):
        line_lower = line.lower()
        for sev in ("critical", "high", "medium", "low"):
            if sev in line_lower:
                severity_counts[sev] += 1
                break

        # Track files mentioned in backlog for churn analysis
        # Look for file paths (word containing / and a file extension)
        paths = re.findall(r"\b[\w./-]+\.\w{1,5}\b", line)
        for p in paths:
            if "/" in p:
                churn_files[p] += 1

    multi_touch = {f: count for f, count in churn_files.items() if count >= 2}

    result = {
        "critical": severity_counts.get("critical", 0),
        "high": severity_counts.get("high", 0),
        "medium": severity_counts.get("medium", 0),
        "low": severity_counts.get("low", 0),
        "total": sum(severity_counts.values()),
    }
    if multi_touch:
        result["churn_files"] = multi_touch
    return result


def parse_quality_iterations(orch_dir):
    """Infer quality loop iteration count from handoff files."""
    handoff_dir = os.path.join(orch_dir, "handoffs")
    if not os.path.isdir(handoff_dir):
        return None

    max_iteration = 0
    gate_verdicts = []

    for fname in sorted(os.listdir(handoff_dir)):
        if not fname.endswith(".json"):
            continue
        data = read_json(os.path.join(handoff_dir, fname))
        if not data:
            continue
        iteration = data.get("iteration", 0)
        if not isinstance(iteration, int):
            iteration = 0
        if iteration > max_iteration:
            max_iteration = iteration
        if "verdict" in data:
            gate_verdicts.append({
                "iteration": iteration,
                "verdict": data["verdict"],
            })

    if not max_iteration and not gate_verdicts:
        return None

    return {
        "iterations": max_iteration,
        "gate_verdicts": gate_verdicts,
    }


def detect_subject(orch_dir):
    """Detect the retro subject from orchestrator artifacts.

    Priority:
    1. State file 'orchestrator' field (if the orchestrator wrote its name)
    2. Plan file 'orchestrator' or source agent name
    3. Directory name convention (e.g., .orchestrator → 'orchestration', .pipeline → pipeline name)
    4. Fallback: 'orchestration'
    """
    # Check state.json for orchestrator name
    state = read_json(os.path.join(orch_dir, "state.json"))
    if state and state.get("orchestrator"):
        return state["orchestrator"].lower()

    # Check plan.json for hints
    plan = read_json(os.path.join(orch_dir, "plan.json"))
    if plan and plan.get("orchestrator"):
        return plan["orchestrator"].lower()

    # Infer from directory name
    dir_name = os.path.basename(os.path.abspath(orch_dir))
    if dir_name == ".orchestrator":
        return "orchestration"
    return dir_name.lower().replace(".", "")


def detect_project():
    """Detect project name from git remote or directory."""
    try:
        result = subprocess.run(
            ["git", "remote", "get-url", "origin"],
            capture_output=True, text=True, timeout=5,
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    return os.path.basename(os.getcwd())


def build_summary(phases, agents_data, log_data, plan_delta, findings, quality):
    """Compute aggregate summary metrics."""
    summary = {}

    if phases:
        summary["current_phase"] = phases.get("current_phase")
        summary["verdict"] = phases.get("verdict")

    if agents_data:
        summary["agents_spawned"] = agents_data["total_agents"]
        if agents_data.get("file_conflicts"):
            summary["file_conflicts"] = len(agents_data["file_conflicts"])

    if log_data:
        total_tokens = sum(e.get("tokens") for e in log_data if e.get("tokens") is not None)
        total_duration = sum(e.get("duration_s", 0) for e in log_data)
        flagged = [e.get("agent_id", e.get("id", "unknown")) for e in log_data if e.get("flags")]
        if total_tokens:
            summary["total_tokens"] = total_tokens
        if total_duration:
            summary["total_duration_s"] = round(total_duration, 1)
        if flagged:
            summary["flagged_agents"] = flagged

    if plan_delta:
        summary["plan_to_outcome"] = {
            "unplanned": plan_delta["unplanned_count"],
            "missed": plan_delta["missed_count"],
        }

    if findings:
        summary["findings"] = {
            "critical": findings["critical"],
            "high": findings["high"],
            "medium": findings["medium"],
            "low": findings["low"],
        }

    if quality:
        summary["quality_iterations"] = quality["iterations"]

    return summary


def main():
    args = parse_args(sys.argv)
    orch_dir = args["orch_dir"]

    if not os.path.isdir(orch_dir):
        print(json.dumps({"error": f"Directory not found: {orch_dir}",
                          "hint": "Pass the orchestrator directory as an argument, "
                                  "or run from the project root if using .orchestrator/"},
                         indent=2))
        sys.exit(1)

    result = {
        "subject": detect_subject(orch_dir),
        "project": detect_project(),
        "run_type": "orchestration",
    }

    phases = parse_phases(orch_dir)
    if phases:
        result["phases"] = phases

    agents_data = parse_handoffs(orch_dir)
    if agents_data:
        result["agents"] = agents_data

    log_data, log_diagnostic = parse_agent_log(orch_dir)
    if log_data:
        result["agent_logs"] = log_data
    if log_diagnostic:
        # Surface the diagnostic so the retro consumer can quote it verbatim
        # rather than fabricating an error message.
        result["agent_logs_diagnostic"] = log_diagnostic

    plan_delta = parse_plan_vs_outcome(orch_dir, args["git_base"])
    if plan_delta:
        result["plan_vs_outcome"] = plan_delta

    findings = parse_backlog(orch_dir)
    if findings:
        result["findings"] = findings

    quality = parse_quality_iterations(orch_dir)
    if quality:
        result["quality_loop"] = quality

    result["summary"] = build_summary(phases, agents_data, log_data, plan_delta, findings, quality)

    output = json.dumps(result, indent=2)

    if args["output"]:
        with open(args["output"], "w") as f:
            f.write(output + "\n")
        print(f"Wrote metrics to {args['output']}", file=sys.stderr)
    else:
        print(output)


if __name__ == "__main__":
    main()
