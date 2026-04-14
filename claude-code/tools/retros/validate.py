#!/usr/bin/env python3
"""validate.py — Structural validator for retro-v5.0 JSON files.

Uses Python stdlib only. No jsonschema dependency.

CLI: validate.py INPUT [...] [--quiet]
Exit 0 if all files pass, 1 otherwise.
"""

import json
import re
import sys

# Authoritative required fields — must match retro-v5.0.json required array exactly.
REQUIRED_FIELDS = [
    "schema_version",
    "subject",
    "session_id",
    "date",
    "run_type",
    "depth",
    "findings",
    "findings_total",
    "recommendations",
    "quality_iterations",
    "agents_spawned",
    "files_changed",
    "user_interventions",
    "root_causes",
]

RUN_TYPE_ENUM = {"single-agent", "subagent", "orchestration", "meta", "custom-pipeline"}
DEPTH_ENUM = {"lightweight", "standard", "full"}
VERDICT_ENUM = {"CLEAR_TO_SHIP", "SHIP_WITH_CAUTION", "BLOCKED", "SHIPPED_CLEAN"}

SESSION_ID_PATTERN = re.compile(r"^[0-9]{8}T[0-9]{6}$")

NON_NEGATIVE_INT_FIELDS = [
    "findings_total",
    "quality_iterations",
    "agents_spawned",
    "files_changed",
    "user_interventions",
]

FINDINGS_KEYS = {"critical", "high", "medium", "low"}


def validate_retro(data: dict) -> list:
    """Validate a single retro dict. Returns list of error strings."""
    errors = []

    # 1. Required fields present
    for field in REQUIRED_FIELDS:
        if field not in data:
            errors.append(f"missing required field: {field!r}")

    # Stop early if schema_version is missing — no point in further checks.
    if "schema_version" not in data:
        return errors

    # 2. schema_version must be "5.0"
    sv = data["schema_version"]
    if sv != "5.0":
        errors.append(f"schema_version must be '5.0', got {sv!r}")

    # 3. session_id regex
    if "session_id" in data:
        sid = data["session_id"]
        if not isinstance(sid, str):
            errors.append(f"session_id must be a string, got {type(sid).__name__}")
        elif not SESSION_ID_PATTERN.match(sid):
            errors.append(
                f"session_id {sid!r} does not match pattern ^[0-9]{{8}}T[0-9]{{6}}$"
            )

    # 4. run_type enum
    if "run_type" in data:
        rt = data["run_type"]
        if not isinstance(rt, str) or rt not in RUN_TYPE_ENUM:
            errors.append(
                f"run_type {rt!r} is not one of {sorted(RUN_TYPE_ENUM)}"
            )

    # 5. depth enum
    if "depth" in data:
        d = data["depth"]
        if not isinstance(d, str) or d not in DEPTH_ENUM:
            errors.append(f"depth {d!r} is not one of {sorted(DEPTH_ENUM)}")

    # 6. verdict enum (optional field)
    if "verdict" in data:
        v = data["verdict"]
        if v is not None and (not isinstance(v, str) or v not in VERDICT_ENUM):
            errors.append(
                f"verdict {v!r} is not one of {sorted(VERDICT_ENUM)} or null"
            )

    # 7. Non-negative integer fields
    for field in NON_NEGATIVE_INT_FIELDS:
        if field in data:
            val = data[field]
            if not isinstance(val, int) or isinstance(val, bool):
                errors.append(f"{field} must be an integer, got {type(val).__name__}")
            elif val < 0:
                errors.append(f"{field} must be >= 0, got {val}")

    # 8. findings object shape
    if "findings" in data:
        f = data["findings"]
        if not isinstance(f, dict):
            errors.append(
                f"findings must be an object, got {type(f).__name__}"
            )
        else:
            # Check allowed keys and non-negative integer values
            unexpected = set(f.keys()) - FINDINGS_KEYS
            if unexpected:
                errors.append(
                    f"findings has unexpected keys: {sorted(unexpected)}"
                )
            for k in FINDINGS_KEYS:
                if k in f:
                    fval = f[k]
                    if not isinstance(fval, int) or isinstance(fval, bool):
                        errors.append(
                            f"findings.{k} must be an integer, got {type(fval).__name__}"
                        )
                    elif fval < 0:
                        errors.append(f"findings.{k} must be >= 0, got {fval}")

    # 9. recommendations must be an object (dict)
    if "recommendations" in data:
        rec = data["recommendations"]
        if not isinstance(rec, dict):
            errors.append(
                f"recommendations must be an object, got {type(rec).__name__}"
            )

    # 10. root_causes must be an object (dict)
    if "root_causes" in data:
        rc = data["root_causes"]
        if not isinstance(rc, dict):
            errors.append(
                f"root_causes must be an object, got {type(rc).__name__}"
            )

    return errors


def validate_file(path: str) -> tuple:
    """Parse and validate a single file. Returns (passed: bool, errors: list)."""
    try:
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
    except FileNotFoundError:
        return False, [f"file not found: {path}"]
    except json.JSONDecodeError as exc:
        return False, [f"invalid JSON: {exc}"]

    if not isinstance(data, dict):
        return False, ["root element must be a JSON object"]

    errors = validate_retro(data)
    return (len(errors) == 0), errors


def main() -> int:
    args = sys.argv[1:]
    quiet = "--quiet" in args
    inputs = [a for a in args if not a.startswith("-")]

    if not inputs:
        print("Usage: validate.py INPUT [...] [--quiet]", file=sys.stderr)
        return 1

    passed = 0
    failed = 0

    for path in inputs:
        ok, errors = validate_file(path)
        if ok:
            passed += 1
            if not quiet:
                print(f"PASS: {path}")
        else:
            failed += 1
            if not quiet:
                error_list = ", ".join(errors)
                print(f"FAIL: {path} — {len(errors)} error(s): [{error_list}]")

    total = passed + failed
    print(f"Validated {total} file(s): {passed} passed, {failed} failed")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
