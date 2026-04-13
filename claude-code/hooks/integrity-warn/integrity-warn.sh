#!/usr/bin/env bash
# integrity-warn.sh — advisory integrity check for session-start / PreToolUse wiring
# Runs integrity-check.sh verify silently; prints a WARNING to stderr if mismatches found.
# Always exits 0 — never blocks Claude Code on a legitimate change.
#
# Wire into .zshrc or a PreToolUse hook that fires once per session:
#   source ~/.claude/hooks/integrity-warn.sh
# or call directly:
#   ~/.claude/hooks/integrity-warn.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
INTEGRITY_SCRIPT="${SCRIPT_DIR}/../../scripts/integrity-check.sh"

if [ ! -x "$INTEGRITY_SCRIPT" ]; then
  # Toolkit not found — fail silently, never block
  exit 0
fi

"$INTEGRITY_SCRIPT" warn
