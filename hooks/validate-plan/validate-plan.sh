#!/usr/bin/env bash
# lifecycle: stable
# SubagentStop hook for the planner: validates the produced plan.json.
# Non-blocking — emits a warning and lets the dispatcher decide on revision.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd -P)"
# shellcheck source=../_adapter_lib.sh
source "${SCRIPT_DIR}/../_adapter_lib.sh"
read_adapter_input
AGENT_ID=$(json_value '.agent_id // .agent_type // .subagent_type // empty')
[ "$AGENT_ID" = "planner" ] || exit 0
SID=$(cat .orchestrator/session.id 2>/dev/null)
if [[ -n "$SID" && "$SID" =~ ^[0-9]{8}T[0-9]{6}$ ]]; then
  PLAN=".orchestrator/sessions/$SID/plan.json"
else
  PLAN=".orchestrator/plan.json"
fi
[ -f "$PLAN" ] || exit 0
VALIDATOR=$(resolve_toolkit_file "scripts/orchestrator/validate-plan.py" || true)
[ -f "$VALIDATOR" ] || exit 0
if ! OUT=$(python3 "$VALIDATOR" "$PLAN" 2>/dev/null); then
  echo "validate-plan: plan.json failed validation" >&2
  echo "$OUT" | jq -r '.errors[]?, .warnings[]?' 2>/dev/null >&2 || true
fi
exit 0
