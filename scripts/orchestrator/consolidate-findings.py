#!/usr/bin/env python3
"""Deduplicate findings from multiple JSON review/audit outputs."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

SEVERITY_RANK = {
    "critical": 5,
    "P0": 5,
    "high": 4,
    "P1": 4,
    "medium": 3,
    "P2": 3,
    "low": 2,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("inputs", nargs="+", help="JSON files to consolidate")
    parser.add_argument("--output", "-o", help="Output path; stdout when omitted")
    return parser.parse_args()


def normalize_text(value: Any) -> str:
    text = str(value or "").strip().lower()
    text = re.sub(r"\s+", " ", text)
    return re.sub(r"[^a-z0-9_./ -]", "", text)


def iter_findings(data: Any) -> list[dict[str, Any]]:
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    if not isinstance(data, dict):
        return []

    for key in ("findings", "required_changes", "violations", "lint_warnings", "lint_errors"):
        value = data.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]

    results = data.get("results")
    if isinstance(results, list):
        merged: list[dict[str, Any]] = []
        for result in results:
            merged.extend(iter_findings(result))
        return merged

    review = data.get("review_output")
    if isinstance(review, dict):
        return iter_findings(review)

    return []


def finding_key(item: dict[str, Any]) -> tuple[str, str]:
    file_value = item.get("file") or item.get("path") or item.get("where") or item.get("area") or ""
    text_value = (
        item.get("finding")
        or item.get("message")
        or item.get("what")
        or item.get("reason")
        or item.get("code")
        or ""
    )
    return normalize_text(file_value), normalize_text(text_value)


def severity_value(item: dict[str, Any]) -> int:
    return SEVERITY_RANK.get(str(item.get("severity") or item.get("priority") or ""), 0)


def main() -> int:
    args = parse_args()
    by_key: dict[tuple[str, str], dict[str, Any]] = {}

    for input_path in args.inputs:
        path = Path(input_path)
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            print(f"{path}: {exc}", file=sys.stderr)
            return 2

        for item in iter_findings(data):
            key = finding_key(item)
            if key == ("", ""):
                continue
            candidate = dict(item)
            candidate.setdefault("sources", [])
            candidate["sources"] = sorted(set(candidate["sources"] + [str(path)]))
            if key not in by_key or severity_value(candidate) > severity_value(by_key[key]):
                by_key[key] = candidate
            else:
                by_key[key]["sources"] = sorted(set(by_key[key].get("sources", []) + [str(path)]))

    findings = sorted(by_key.values(), key=lambda item: (finding_key(item), -severity_value(item)))
    output = json.dumps({"count": len(findings), "findings": findings}, indent=2) + "\n"
    if args.output:
        Path(args.output).write_text(output, encoding="utf-8")
    else:
        print(output, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
