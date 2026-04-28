#!/usr/bin/env python3
"""Classify compiler diagnostics by whether they touch files written in the session."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

PATH_RE = re.compile(r"(?P<path>(?:\.?/)?[A-Za-z0-9_./-]+\.[A-Za-z0-9]+)(?::\d+)?")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--subtask", required=True)
    parser.add_argument("--session", required=True)
    parser.add_argument("--stdin", action="store_true")
    return parser.parse_args()


def written_files(session: str) -> set[str]:
    handoff_dir = Path(".orchestrator") / "sessions" / session / "handoffs"
    files: set[str] = set()
    for path in handoff_dir.glob("*.json"):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        for file_path in data.get("files_written") or []:
            if isinstance(file_path, str):
                files.add(file_path.lstrip("./"))
    return files


def main() -> int:
    args = parse_args()
    diagnostics = sys.stdin.read() if args.stdin else ""
    written = written_files(args.session)
    buckets = {"introduced": [], "pre_existing": [], "unclassified": []}

    for line in diagnostics.splitlines():
        match = PATH_RE.search(line)
        if not match:
            buckets["unclassified"].append(line)
            continue
        file_path = match.group("path").lstrip("./")
        if file_path in written:
            buckets["introduced"].append(line)
        else:
            buckets["pre_existing"].append(line)

    print(
        json.dumps(
            {
                "subtask": args.subtask,
                "session": args.session,
                "counts": {key: len(value) for key, value in buckets.items()},
                "buckets": buckets,
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
