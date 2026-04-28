#!/usr/bin/env python3
"""Compute a bounded improve-dispatch partition from live file and turn counts."""

from __future__ import annotations

import argparse
import json
import math


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--files", type=int, required=True, help="Number of files in scope")
    parser.add_argument("--max-turns", type=int, required=True, help="Agent maxTurns/num_turns budget")
    parser.add_argument("--max-files-per-agent", type=int, default=20)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    file_count = max(args.files, 0)
    turn_budget = max(args.max_turns, 1)
    base_file_ceiling = max(1, min(args.max_files_per_agent, turn_budget // 4 or 1))
    partitions = max(1, math.ceil(file_count / base_file_ceiling)) if file_count else 1

    result = {
        "file_count": file_count,
        "max_turns": turn_budget,
        "max_files_per_agent": base_file_ceiling,
        "split": partitions > 1,
        "recommended_partition_count": partitions,
    }
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
