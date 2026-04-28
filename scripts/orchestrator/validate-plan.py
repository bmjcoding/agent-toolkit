#!/usr/bin/env python3
"""Validate an orchestrator plan.json contract."""

from __future__ import annotations

import json
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

LOCKFILES = {
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "bun.lockb",
    "poetry.lock",
    "Pipfile.lock",
    "Cargo.lock",
}
REQUIRED_TOP = {"subtasks", "parallel_groups"}
REQUIRED_SUBTASK = {
    "id",
    "description",
    "agent",
    "owned_files",
    "parallel_group",
    "blockedBy",
    "notes",
    "completion_criteria",
}


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("usage: validate-plan.py PLAN_JSON", file=sys.stderr)
        return 2
    path = Path(argv[1])
    errors: list[str] = []
    warnings: list[str] = []
    try:
        plan: dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(json.dumps({"valid": False, "errors": [str(exc)], "warnings": []}, indent=2))
        return 1

    missing_top = sorted(REQUIRED_TOP - set(plan))
    errors.extend(f"missing top-level key: {key}" for key in missing_top)
    subtasks = plan.get("subtasks", [])
    if not isinstance(subtasks, list):
        errors.append("subtasks must be an array")
        subtasks = []

    ids = [str(task.get("id", "")) for task in subtasks if isinstance(task, dict)]
    id_set = set(ids)
    if len(ids) != len(id_set):
        duplicates = [task_id for task_id, count in Counter(ids).items() if count > 1]
        errors.append(f"duplicate subtask ids: {duplicates}")

    group_files: dict[int, list[str]] = defaultdict(list)
    group_lock_owners: dict[int, list[str]] = defaultdict(list)
    for index, task in enumerate(subtasks):
        if not isinstance(task, dict):
            errors.append(f"subtask[{index}] must be an object")
            continue

        task_id = str(task.get("id", f"index-{index}"))
        for key in sorted(REQUIRED_SUBTASK - set(task)):
            errors.append(f"subtask {task_id} missing key: {key}")

        owned = task.get("owned_files", [])
        if not isinstance(owned, list) or not all(isinstance(item, str) for item in owned):
            errors.append(f"subtask {task_id} owned_files must be an array of strings")
            owned = []
        if len(owned) > 25:
            errors.append(f"subtask {task_id} owns {len(owned)} files (max 25)")
        if len(owned) > 7:
            warnings.append(f"subtask {task_id} owns {len(owned)} files; consider splitting to reduce truncation risk")

        findings = task.get("findings", [])
        if isinstance(findings, list) and len(findings) > 5:
            warnings.append(f"subtask {task_id} has {len(findings)} findings; consider splitting")

        group = task.get("parallel_group")
        if not isinstance(group, int):
            errors.append(f"subtask {task_id} parallel_group must be an integer")
            group = -1

        group_files[group].extend(owned)
        if any(Path(file_path).name in LOCKFILES for file_path in owned):
            group_lock_owners[group].append(task_id)

        blocked_by = task.get("blockedBy", [])
        if not isinstance(blocked_by, list):
            errors.append(f"subtask {task_id} blockedBy must be an array")
        else:
            for dependency in blocked_by:
                if str(dependency) not in id_set:
                    errors.append(f"subtask {task_id} blockedBy references unknown id: {dependency}")

        to_create = set(task.get("to_create", []) or [])
        for file_path in owned:
            if file_path in to_create:
                continue
            if not Path(file_path).exists():
                warnings.append(f"subtask {task_id} owns path that does not exist and is not marked to_create: {file_path}")

    for group, files in group_files.items():
        duplicates = [file_path for file_path, count in Counter(files).items() if count > 1]
        if duplicates:
            errors.append(f"parallel_group {group} has duplicate file ownership: {sorted(duplicates)}")

    for group, owners in group_lock_owners.items():
        if len(owners) > 1:
            errors.append(f"parallel_group {group} has multiple package-manager lockfile owners: {owners}")

    result = {"valid": not errors, "errors": errors, "warnings": warnings}
    print(json.dumps(result, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
