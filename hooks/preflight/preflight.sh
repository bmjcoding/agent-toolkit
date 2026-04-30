#!/usr/bin/env bash
# lifecycle: stable
# SessionStart hook: runs the orchestrator preflight check, emitting a JSON
# summary into the session log.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd -P)"
# shellcheck source=../_adapter_lib.sh
source "${SCRIPT_DIR}/../_adapter_lib.sh"
PREFLIGHT=$(resolve_toolkit_file "scripts/orchestrator/preflight-check.sh" || true)
[ -x "$PREFLIGHT" ] || exit 0
SID=$(cat .orchestrator/session.id 2>/dev/null || true)
"$PREFLIGHT" "$SID" >/dev/null 2>&1 || true
exit 0
