#!/usr/bin/env bash
# Enforce per-subtask targeted edit budgets from plan.json notes.
set -euo pipefail

SUBTASK_ID="${1:-}"
SID="${2:-}"
if [[ -z "$SUBTASK_ID" || -z "$SID" ]]; then
  echo "usage: check-diff-budget.sh SUBTASK_ID SID" >&2
  exit 2
fi

PLAN=".orchestrator/sessions/$SID/plan.json"
if [[ ! -f "$PLAN" ]]; then
  jq -n --arg plan "$PLAN" '{ok: false, error: "plan not found", plan: $plan}'
  exit 2
fi

python3 - "$PLAN" "$SUBTASK_ID" <<'PY'
from __future__ import annotations

import json
import re
import subprocess
import sys

plan_path, subtask_id = sys.argv[1:3]
plan = json.load(open(plan_path, encoding="utf-8"))
task = next((item for item in plan.get("subtasks", []) if str(item.get("id")) == subtask_id), None)
if not task:
    print(json.dumps({"ok": False, "error": "subtask not found", "subtask_id": subtask_id}, indent=2))
    sys.exit(2)

budget = None
for note in task.get("notes", []):
    match = re.search(r"\bbudget:\s*(\d+)\b", str(note))
    if match:
        budget = int(match.group(1))
        break

if budget is None:
    print(json.dumps({"ok": True, "skipped": True, "reason": "no budget note"}, indent=2))
    sys.exit(0)

files = task.get("owned_files", [])
cmd = ["git", "diff", "--numstat", "HEAD", "--", *files]
proc = subprocess.run(cmd, text=True, capture_output=True, check=False)
over = []
for line in proc.stdout.splitlines():
    parts = line.split("\t")
    if len(parts) < 3 or "-" in parts[:2]:
        continue
    changed = int(parts[0]) + int(parts[1])
    if changed > budget:
        over.append({"file": parts[2], "changed_lines": changed, "budget": budget})

print(json.dumps({"ok": not over, "budget": budget, "over_budget": over}, indent=2))
sys.exit(1 if over else 0)
PY
