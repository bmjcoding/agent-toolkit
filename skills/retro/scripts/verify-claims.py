#!/usr/bin/env python3
"""Verify retro claims against actual artifacts.

Reads a retro output file and checks that cited references actually exist:
file paths, agent/handoff IDs, git commits, and severity counts. Run this
after drafting the retro and before finalizing.

Usage:
    python3 scripts/verify-claims.py RETRO_FILE [OPTIONS]

Arguments:
    RETRO_FILE        Path to the markdown retro output to verify

Options:
    --orch-dir DIR    Orchestrator directory (default: .orchestrator)
    --output FILE     Write JSON results to FILE instead of stdout
    --help            Show this help message

Output:
    JSON with pass/fail per claim type and specific failures listed.
"""

import json
import os
import re
import subprocess
import sys


def parse_args(argv):
    args = {"retro_file": None, "orch_dir": ".orchestrator", "output": None}
    i = 1
    while i < len(argv):
        if argv[i] == "--help":
            print(__doc__.strip())
            sys.exit(0)
        elif argv[i] == "--orch-dir" and i + 1 < len(argv):
            args["orch_dir"] = argv[i + 1]
            i += 2
        elif argv[i] == "--output" and i + 1 < len(argv):
            args["output"] = argv[i + 1]
            i += 2
        elif not argv[i].startswith("-") and args["retro_file"] is None:
            args["retro_file"] = argv[i]
            i += 1
        else:
            print(f"Unknown option: {argv[i]}", file=sys.stderr)
            sys.exit(1)
    if not args["retro_file"]:
        print("Error: RETRO_FILE is required.", file=sys.stderr)
        print("Usage: python3 scripts/verify-claims.py RETRO_FILE [--orch-dir DIR]",
              file=sys.stderr)
        sys.exit(1)
    return args


def read_retro(path):
    """Read the retro markdown file."""
    try:
        with open(path) as f:
            return f.read()
    except FileNotFoundError:
        print(f"Error: File not found: {path}", file=sys.stderr)
        sys.exit(1)


def extract_file_paths(content):
    """Extract file paths cited in the retro.

    Looks for patterns like `src/foo/bar.ts`, `agents/planner/AGENT.md`,
    paths in backticks, and paths in table cells.
    """
    paths = set()

    # Backtick-wrapped paths (most common in retros)
    for match in re.finditer(r"`([^`]+\.[a-zA-Z]{1,5})`", content):
        candidate = match.group(1)
        # Filter out things that look like paths but aren't
        if "/" in candidate and not candidate.startswith("http"):
            # Strip leading ./ only — do not use lstrip which would also eat
            # the leading / from absolute paths like /Users/...
            candidate = candidate[2:] if candidate.startswith("./") else candidate
            paths.add(candidate)

    # Bare paths in table cells (between |)
    for match in re.finditer(r"\|\s*([^\|`]+\.[a-zA-Z]{1,5})\s*\|", content):
        candidate = match.group(1).strip()
        if "/" in candidate and not candidate.startswith("http"):
            candidate = candidate[2:] if candidate.startswith("./") else candidate
            paths.add(candidate)

    return paths


def extract_agent_ids(content, orch_dir):
    """Extract agent IDs cited in the retro and check against handoff files."""
    if not os.path.isdir(os.path.join(orch_dir, "handoffs")):
        return None

    # Collect actual handoff IDs
    actual_ids = set()
    handoff_dir = os.path.join(orch_dir, "handoffs")
    for fname in os.listdir(handoff_dir):
        if fname.endswith(".json"):
            actual_ids.add(fname.removesuffix(".json"))

    # Extract IDs mentioned in the retro (patterns like impl-g1-s1, security-1, etc.)
    cited_ids = set()
    for match in re.finditer(r"\b(impl-[a-z0-9-]+|integration-[a-z0-9-]+|security-[a-z0-9-]+|sre-[a-z0-9-]+|design-[a-z0-9-]+|quality-[a-z0-9-]+|release-[a-z0-9-]+|doc-[a-z0-9-]+)\b", content):
        cited_ids.add(match.group(1))

    if not cited_ids:
        return None

    missing = cited_ids - actual_ids
    matched = cited_ids & actual_ids

    return {
        "cited": sorted(cited_ids),
        "matched": sorted(matched),
        "missing": sorted(missing),
        "pass": len(missing) == 0,
    }


def extract_severity_counts(content):
    """Extract severity counts from the summary table and compare to backlog."""
    # Look for the findings row in the summary table
    match = re.search(
        r"Findings\s*\(critical/high/medium/low\)\s*\|\s*(\d+)/(\d+)/(\d+)/(\d+)",
        content
    )
    if not match:
        return None

    return {
        "critical": int(match.group(1)),
        "high": int(match.group(2)),
        "medium": int(match.group(3)),
        "low": int(match.group(4)),
    }


def is_likely_sha(candidate, source_line):
    """Filter CSS hex colors and non-SHA hex strings from commit SHA candidates.

    Returns True if the candidate looks like a real git commit SHA,
    False if it appears to be a CSS hex color or other non-SHA hex value.

    Rules applied (in order):
    1. Pure digit strings are not SHAs (already pre-filtered, but guard here too).
    2. If the character immediately before the candidate in the source line is '#',
       it is a CSS/markdown color literal (e.g. #f2f2f2, #0ea5e9).
    3. Six-character hex strings (exact CSS color length) in lines that contain
       CSS property keywords are treated as CSS colors, not SHAs. Git short SHAs
       are typically 7+ characters; 6-char is exclusively CSS hex color territory.
    """
    if candidate.isdigit():
        return False

    # Check for '#' immediately before the candidate in the line
    idx = source_line.find(candidate)
    if idx > 0 and source_line[idx - 1] == '#':
        return False

    # 6-character hex strings in CSS contexts are colors, not SHAs
    if len(candidate) == 6:
        css_ctx = ('color:', 'background:', 'border:', 'fill:', 'stroke:', '#')
        if any(c in source_line.lower() for c in css_ctx):
            return False

    return True


def verify_file_paths(paths):
    """Check which cited file paths exist on disk."""
    existing = []
    missing = []

    for p in sorted(paths):
        # Try the path as-is, and with common prefixes
        found = False
        candidates = [p]

        # Also check relative to home/.claude for agent/skill paths
        if p.startswith("agents/") or p.startswith("skills/"):
            home = os.path.expanduser("~")
            candidates.append(os.path.join(home, ".claude", p))

        for candidate in candidates:
            if os.path.exists(os.path.expanduser(candidate)):
                existing.append(p)
                found = True
                break

        if not found:
            missing.append(p)

    return {
        "total": len(paths),
        "existing": existing,
        "missing": missing,
        "pass": len(missing) == 0,
    }


def verify_git_commits(content):
    """Check that any cited git SHAs actually exist.

    Uses is_likely_sha() to filter CSS hex color strings (e.g. f2f2f2, 1e293b,
    0ea5e9) from candidates before making any subprocess calls. The filter checks
    per-line context so that '#'-preceded hex and 6-char hex in CSS property lines
    are excluded without running git cat-file on them.
    """
    sha_re = re.compile(r"\b([0-9a-f]{7,40})\b")
    cited_shas = set()

    for line in content.splitlines():
        for match in sha_re.finditer(line):
            candidate = match.group(1)
            # Pre-filter: pure digits are not SHAs
            if candidate.isdigit():
                continue
            # Apply CSS/context filter using the full source line
            if not is_likely_sha(candidate, line):
                continue
            cited_shas.add(candidate)

    if not cited_shas:
        return None

    existing = []
    missing = []

    for sha in sorted(cited_shas):
        try:
            result = subprocess.run(
                ["git", "cat-file", "-t", sha],
                capture_output=True, text=True, timeout=5
            )
            if result.returncode == 0:
                existing.append(sha)
            else:
                missing.append(sha)
        except (subprocess.TimeoutExpired, FileNotFoundError):
            missing.append(sha)

    return {
        "cited": sorted(cited_shas),
        "existing": existing,
        "missing": missing,
        "pass": len(missing) == 0,
    }


def verify_severity_counts(claimed, orch_dir):
    """Compare claimed severity counts against backlog if available."""
    backlog_path = os.path.join(orch_dir, "backlog.md")
    if not os.path.isfile(backlog_path):
        return {"note": "No backlog file found — cannot verify severity counts", "pass": None}

    try:
        with open(backlog_path) as f:
            backlog = f.read().lower()
    except (PermissionError, OSError):
        return {"note": "Cannot read backlog", "pass": None}

    actual = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for line in backlog.split("\n"):
        for sev in actual:
            if sev in line:
                actual[sev] += 1
                break

    mismatches = {}
    for sev in ("critical", "high", "medium", "low"):
        if claimed.get(sev, 0) != actual.get(sev, 0):
            mismatches[sev] = {"claimed": claimed[sev], "actual": actual[sev]}

    return {
        "claimed": claimed,
        "actual": actual,
        "mismatches": mismatches if mismatches else None,
        "pass": len(mismatches) == 0,
    }


def main():
    args = parse_args(sys.argv)
    content = read_retro(args["retro_file"])
    orch_dir = args["orch_dir"]

    result = {"checks": {}}
    all_pass = True

    # 1. Verify file paths
    paths = extract_file_paths(content)
    if paths:
        file_check = verify_file_paths(paths)
        result["checks"]["file_paths"] = file_check
        if not file_check["pass"]:
            all_pass = False

    # 2. Verify agent IDs
    agent_check = extract_agent_ids(content, orch_dir)
    if agent_check is not None:
        result["checks"]["agent_ids"] = agent_check
        if not agent_check["pass"]:
            all_pass = False

    # 3. Verify git commits
    git_check = verify_git_commits(content)
    if git_check is not None:
        result["checks"]["git_commits"] = git_check
        if not git_check["pass"]:
            all_pass = False

    # 4. Verify severity counts
    severity = extract_severity_counts(content)
    if severity:
        sev_check = verify_severity_counts(severity, orch_dir)
        result["checks"]["severity_counts"] = sev_check
        if sev_check.get("pass") is False:
            all_pass = False

    # Summary
    checks_run = len(result["checks"])
    checks_passed = sum(
        1 for c in result["checks"].values()
        if c.get("pass") is True
    )
    checks_failed = sum(
        1 for c in result["checks"].values()
        if c.get("pass") is False
    )
    checks_skipped = checks_run - checks_passed - checks_failed

    result["summary"] = {
        "pass": all_pass,
        "checks_run": checks_run,
        "checks_passed": checks_passed,
        "checks_failed": checks_failed,
        "checks_skipped": checks_skipped,
    }

    output = json.dumps(result, indent=2)

    if args["output"]:
        with open(args["output"], "w") as f:
            f.write(output + "\n")
        print(f"Wrote verification results to {args['output']}", file=sys.stderr)
    else:
        print(output)

    sys.exit(0 if all_pass else 1)


if __name__ == "__main__":
    main()
