#!/usr/bin/env python3
"""Validate a retro summary JSON file against the v5.0 contract.

Usage:
    python3 scripts/validate.py RETRO_JSON

Exit codes:
    0  JSON is valid
    1  JSON failed validation or could not be read
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

RUN_TYPES = {"single-agent", "subagent", "orchestration", "custom-pipeline", "meta"}
DEPTHS = {"lightweight", "standard", "full"}
VERDICTS = {"CLEAR_TO_SHIP", "SHIP_WITH_CAUTION", "BLOCKED", "SHIPPED_CLEAN"}
FINDING_KEYS = ("critical", "high", "medium", "low")
RECOMMENDATION_KEYS = ("total", "p0", "p1", "p2", "fix", "pattern")
OPTIONAL_FIELDS = {
    "version": str,
    "project": str,
    "total_tokens": int,
    "total_cost_usd": (int, float),
    "wall_clock_min": int,
    "model_downgrades_recommended": int,
    "fix_churn": int,
    "frankenstein_line_count": int,
    "dispatcher_tokens_estimated": int,
    "dispatch_count": int,
    "avg_dispatch_prompt_tokens": int,
    "net_line_delta": int,
    "net_growth_flag": bool,
    "pre_verified_skipped": int,
}


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def require_int_map(data: dict, keys: tuple[str, ...], field_name: str) -> None:
    require(isinstance(data, dict), f"{field_name} must be an object")
    for key in keys:
        require(key in data, f"{field_name}.{key} is required")
        require(isinstance(data[key], int), f"{field_name}.{key} must be an integer")
        require(data[key] >= 0, f"{field_name}.{key} must be >= 0")


def validate(path: Path) -> None:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        fail(f"file not found: {path}")
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path}: {exc}")

    require(isinstance(payload, dict), "top-level JSON value must be an object")
    require(payload.get("schema_version") == "5.0", "schema_version must equal '5.0'")

    require(isinstance(payload.get("subject"), str) and payload["subject"].strip(), "subject must be a non-empty string")
    require(re.fullmatch(r"\d{8}T\d{6}", str(payload.get("session_id", ""))) is not None, "session_id must match YYYYMMDDTHHMMSS")
    require(re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(payload.get("date", ""))) is not None, "date must match YYYY-MM-DD")
    require(payload.get("run_type") in RUN_TYPES, f"run_type must be one of: {', '.join(sorted(RUN_TYPES))}")
    require(payload.get("depth") in DEPTHS, f"depth must be one of: {', '.join(sorted(DEPTHS))}")

    findings = payload.get("findings")
    require_int_map(findings, FINDING_KEYS, "findings")
    findings_total = payload.get("findings_total")
    require(isinstance(findings_total, int), "findings_total must be an integer")
    require(findings_total == sum(findings[key] for key in FINDING_KEYS), "findings_total must equal the sum of findings severities")

    recommendations = payload.get("recommendations")
    require_int_map(recommendations, RECOMMENDATION_KEYS, "recommendations")
    require(recommendations["total"] == recommendations["p0"] + recommendations["p1"] + recommendations["p2"], "recommendations.total must equal p0 + p1 + p2")
    require(recommendations["total"] == recommendations["fix"] + recommendations["pattern"], "recommendations.total must equal fix + pattern")

    for key in ("quality_iterations", "agents_spawned", "files_changed", "user_interventions"):
        require(isinstance(payload.get(key), int), f"{key} must be an integer")
        require(payload[key] >= 0, f"{key} must be >= 0")

    root_causes = payload.get("root_causes")
    require(isinstance(root_causes, dict), "root_causes must be an object")
    for cause, count in root_causes.items():
        require(isinstance(cause, str) and cause, "root_causes keys must be non-empty strings")
        require(isinstance(count, int), f"root_causes.{cause} must be an integer")
        require(count >= 0, f"root_causes.{cause} must be >= 0")

    verdict = payload.get("verdict")
    require(verdict is None or verdict in VERDICTS, f"verdict must be null or one of: {', '.join(sorted(VERDICTS))}")

    for field_name, expected_type in OPTIONAL_FIELDS.items():
        if field_name not in payload or payload[field_name] is None:
            continue
        require(isinstance(payload[field_name], expected_type), f"{field_name} must be of type {expected_type}")

    print(f"OK: {path}")


def main(argv: list[str]) -> None:
    if len(argv) != 2 or argv[1] in {"-h", "--help"}:
        print(__doc__.strip())
        raise SystemExit(0 if len(argv) == 2 else 1)

    validate(Path(argv[1]))


if __name__ == "__main__":
    main(sys.argv)
