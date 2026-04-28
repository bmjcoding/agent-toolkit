#!/usr/bin/env python3
"""Validate the stable fields of a subagent handoff JSON file."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

VALID_SEVERITIES = {"critical", "high", "medium", "low"}
VALID_STATUSES = {"done", "done_with_warnings", "skipped", "needs_human", "failed"}
AGENT_ID_RE = re.compile(r"^[a-z][a-z0-9-]*(?:-[a-z0-9]+)*$")
UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE,
)


def violation(code: str, message: str, path: str = "$") -> dict[str, str]:
    return {"code": code, "path": path, "message": message}


def validate(data: Any) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if not isinstance(data, dict):
        return [violation("type", "handoff must be a JSON object")]

    agent_id = data.get("agent_id")
    if agent_id is not None:
        if not isinstance(agent_id, str) or not AGENT_ID_RE.match(agent_id) or UUID_RE.match(agent_id):
            violations.append(
                violation(
                    "agent_id",
                    "agent_id must be a stable named alias, not a raw UUID",
                    "$.agent_id",
                )
            )

    status = data.get("status")
    if status is not None and status not in VALID_STATUSES:
        violations.append(
            violation(
                "status",
                f"status must be one of {sorted(VALID_STATUSES)}",
                "$.status",
            )
        )

    files_written = data.get("files_written")
    if files_written is not None:
        if not isinstance(files_written, list) or not all(isinstance(item, str) for item in files_written):
            violations.append(violation("files_written", "files_written must be an array of strings", "$.files_written"))

    findings = data.get("findings", [])
    if findings is None:
        findings = []
    if findings and not isinstance(findings, list):
        violations.append(violation("findings", "findings must be an array when present", "$.findings"))
    elif isinstance(findings, list):
        for index, finding in enumerate(findings):
            if not isinstance(finding, dict):
                violations.append(violation("finding_type", "finding must be an object", f"$.findings[{index}]"))
                continue
            severity = finding.get("severity")
            if severity is not None and severity not in VALID_SEVERITIES:
                violations.append(
                    violation(
                        "severity",
                        f"severity must be one of {sorted(VALID_SEVERITIES)}",
                        f"$.findings[{index}].severity",
                    )
                )

    return violations


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("usage: validate-handoff.py HANDOFF_JSON", file=sys.stderr)
        return 2
    path = Path(argv[1])
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        result = {"valid": False, "violations": [violation("parse_error", str(exc))]}
        print(json.dumps(result, indent=2))
        return 1

    violations = validate(data)
    result = {"valid": not violations, "violations": violations}
    print(json.dumps(result, indent=2))
    return 1 if violations else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
