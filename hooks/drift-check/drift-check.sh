#!/usr/bin/env bash
# lifecycle: stable
# PreToolUse hook on Agent dispatches: runs the orchestrator drift-check
# script to detect HEAD-SHA drift mid-pipeline. Non-blocking — emits stderr
# warning only.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd -P)"
# shellcheck source=../_adapter_lib.sh
source "${SCRIPT_DIR}/../_adapter_lib.sh"
read_adapter_input
TOOL=$(extract_tool_name)
case "$TOOL" in
  Agent|Task) ;;
  *) exit 0 ;;
esac
[ -f .orchestrator/session-base-sha ] || exit 0
DRIFT=$(resolve_toolkit_file "scripts/orchestrator/drift-check.sh" || true)
[ -x "$DRIFT" ] || exit 0
"$DRIFT" >/dev/null 2>&1 || echo "drift-check: HEAD-SHA changed since session start; review before dispatching" >&2
exit 0
