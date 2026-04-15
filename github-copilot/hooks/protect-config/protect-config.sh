#!/usr/bin/env bash
# VS Code Copilot adapter: normalize Bash payloads for root protect-config and block protected file edits directly.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd -P)"
# shellcheck source=../../../hooks/_adapter_lib.sh
source "${SCRIPT_DIR}/../../../hooks/_adapter_lib.sh"

read_adapter_input
COMMAND=$(extract_command)
if [[ -n "${COMMAND}" ]]; then
  run_root_hook_with_input "protect-config" "$(normalize_command_payload "${COMMAND}")"
  exit 0
fi

RAW_TOOL=$(extract_tool_name)
TOOL=$(normalize_edit_tool_name "${RAW_TOOL}")
FILE=$(extract_file_path)
[[ -n "${TOOL}" && -n "${FILE}" ]] || exit 0

if is_protected_file_path "${FILE}"; then
  emit_deny "Write to control-plane files is blocked. Protected paths (settings.json, hooks/, CLAUDE.md, agents/, statusline-command.sh, orchestrator logs, orchestrator session.id, hookify rules) require direct user action to modify."
fi

exit 0
