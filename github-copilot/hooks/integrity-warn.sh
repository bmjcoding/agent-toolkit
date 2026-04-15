#!/usr/bin/env bash
# Integrity warning hook for the VS Code Copilot surface
# Requires: VS Code Copilot hooks enabled in your VS Code environment
# Note: VS Code Copilot hook stdin payload schema may differ from Claude Code's; validate in your environment.
#
# Claude Code env vars used: none directly — delegates to integrity-check.sh.
# VS Code Copilot mapping: PostToolUse / matcher: Bash|Edit|Write
# Note: This script delegates to integrity-check.sh which must exist in the same hooks directory
# or at the path referenced by SCRIPT_DIR. Adjust the INTEGRITY_SCRIPT path for your VS Code Copilot install
# install if hooks live in a non-default hooks directory for your VS Code Copilot setup.
#
# Original purpose: advisory integrity check — runs integrity-check.sh silently;
# prints a WARNING to stderr if mismatches found. Always exits 0, never blocks.
#
# Wire into .zshrc or a PostToolUse hook that fires once per session:
#   source .github/hooks/integrity-warn.sh
# or call directly:
#   .github/hooks/integrity-warn.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
INTEGRITY_SCRIPT="${SCRIPT_DIR}/../scripts/integrity-check.sh"

if [ ! -x "$INTEGRITY_SCRIPT" ]; then
  # Toolkit not found — fail silently, never block
  exit 0
fi

"$INTEGRITY_SCRIPT" warn
