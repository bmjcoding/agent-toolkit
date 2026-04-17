#!/usr/bin/env bash
# VS Code Copilot adapter: derive a pre-push-style ref payload from git push, then delegate to root hooks/changelog-check.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd -P)"
# shellcheck source=../../../hooks/_adapter_lib.sh
source "${SCRIPT_DIR}/../../../hooks/_adapter_lib.sh"

read_adapter_input
COMMAND=$(extract_command)
[[ -n "${COMMAND}" ]] || exit 0
is_git_push_command "${COMMAND}" || exit 0

PUSH_CONTEXT=$(derive_push_context "${COMMAND}") || exit 0
IFS=$'\t' read -r REMOTE REMOTE_URL LOCAL_REF LOCAL_SHA REMOTE_REF REMOTE_SHA <<< "${PUSH_CONTEXT}"

CHANGELOG_OUTPUT="$(printf '%s %s %s %s\n' "${LOCAL_REF}" "${LOCAL_SHA}" "${REMOTE_REF}" "${REMOTE_SHA}" | run_root_hook "changelog-check" "${REMOTE}" "${REMOTE_URL}" 2>&1)" || CHANGELOG_STATUS=$?
CHANGELOG_STATUS="${CHANGELOG_STATUS:-0}"

if [[ "${CHANGELOG_STATUS}" -eq 0 ]]; then
  exit 0
fi

REASON="$(printf '%s\n' "${CHANGELOG_OUTPUT}" | awk 'NF { gsub(/[[:space:]]+/, " "); print; exit }')"
[[ -n "${REASON}" ]] || REASON="CHANGELOG.md checks failed for the pending git push. Update the relevant changelog entry before retrying."
emit_deny "${REASON}"
