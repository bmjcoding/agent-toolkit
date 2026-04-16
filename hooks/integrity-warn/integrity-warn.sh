#!/usr/bin/env bash
# lifecycle: stable
# integrity-warn.sh — advisory integrity check for session-start / PreToolUse wiring
# Runs integrity-check.sh verify silently; prints a WARNING to stderr if mismatches found.
# Always exits 0 — never blocks a legitimate change.
#
# Adapters may optionally set:
#   AGENT_TOOLKIT_HOOK_TOOL       claude-code | github-copilot | openai-codex
#   AGENT_TOOLKIT_INTEGRITY_SCRIPT absolute path to the tool-specific integrity-check.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd -P)"
REPO_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd -P)"
HOOK_TOOL="${AGENT_TOOLKIT_HOOK_TOOL:-claude-code}"
INTEGRITY_SCRIPT="${AGENT_TOOLKIT_INTEGRITY_SCRIPT:-${REPO_DIR}/${HOOK_TOOL}/scripts/integrity-check.sh}"

if [ ! -x "$INTEGRITY_SCRIPT" ] && [ -x "${REPO_DIR}/claude-code/scripts/integrity-check.sh" ]; then
  INTEGRITY_SCRIPT="${REPO_DIR}/claude-code/scripts/integrity-check.sh"
fi

if [ ! -x "$INTEGRITY_SCRIPT" ]; then
  # Toolkit not found — fail silently, never block
  exit 0
fi

"$INTEGRITY_SCRIPT" warn
