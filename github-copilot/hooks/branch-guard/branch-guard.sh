#!/usr/bin/env bash
# VS Code Copilot adapter: self-filter PreToolUse payloads, then delegate to root hooks/branch-guard.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd -P)"
# shellcheck source=../../../hooks/_adapter_lib.sh
source "${SCRIPT_DIR}/../../../hooks/_adapter_lib.sh"

read_adapter_input
COMMAND=$(extract_command)
[[ -n "${COMMAND}" ]] || exit 0
is_git_commit_or_push_command "${COMMAND}" || exit 0

run_root_hook_with_input "branch-guard" "$(normalize_command_payload "${COMMAND}")"
