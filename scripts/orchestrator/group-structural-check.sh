#!/usr/bin/env bash
# Lightweight structural verification between orchestrator implementation groups.
set -euo pipefail

SID="${1:-}"
GROUP="${2:-}"
if [[ -z "$SID" || -z "$GROUP" ]]; then
  echo "usage: group-structural-check.sh SID GROUP" >&2
  exit 2
fi

ORCH_BASE=".orchestrator/sessions/$SID"
PLAN="$ORCH_BASE/plan.json"
if [[ ! -f "$PLAN" ]]; then
  jq -n --arg plan "$PLAN" '{valid: false, checks: {plan: {failed: [$plan]}}}'
  exit 1
fi

python3 - "$PLAN" "$GROUP" <<'PY'
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

plan_path = Path(sys.argv[1])
group = int(sys.argv[2])
plan = json.loads(plan_path.read_text())
checks = {"owned_files": {"failed": []}, "typescript": {"failed": [], "skipped": []}}

for task in plan.get("subtasks", []):
    if task.get("parallel_group") != group:
        continue
    to_create = set(task.get("to_create") or [])
    for owned in task.get("owned_files", []):
        if owned in to_create:
            continue
        if not Path(owned).exists():
            checks["owned_files"]["failed"].append(owned)

tsconfigs = sorted(Path(".").glob("**/tsconfig.json"))
tsconfigs = [p for p in tsconfigs if "node_modules" not in p.parts and ".git" not in p.parts]
tsc = Path("node_modules/.bin/tsc")
if tsc.exists():
    for config in tsconfigs:
        proc = subprocess.run(
            [str(tsc), "--noEmit", "--project", str(config)],
            text=True,
            capture_output=True,
            timeout=120,
            check=False,
        )
        if proc.returncode != 0:
            checks["typescript"]["failed"].append({"config": str(config), "stderr": proc.stderr[-2000:]})
else:
    checks["typescript"]["skipped"].append("node_modules/.bin/tsc not found")

failed = bool(checks["owned_files"]["failed"] or checks["typescript"]["failed"])
print(json.dumps({"valid": not failed, "checks": checks}, indent=2))
sys.exit(1 if failed else 0)
PY
