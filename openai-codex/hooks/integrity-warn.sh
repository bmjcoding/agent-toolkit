#!/usr/bin/env bash
# Integrity warning hook for the Codex CLI surface (experimental)
# Requires: features.codex_hooks=true in ~/.codex/config.toml
# Note: Codex hooks stdin payload schema may differ from Claude Code's; validate in your environment.
#
# Claude Code env vars used: none directly — delegates to integrity-check.sh.
# Codex mapping: PostToolUse / matcher: Bash|Edit|Write
# Note: This script delegates to integrity-check.sh which must exist in the same hooks directory
# or at the path referenced by SCRIPT_DIR. Adjust the INTEGRITY_SCRIPT path for your Codex
# install if hooks land in ~/.codex/hooks/ rather than ~/.claude/hooks/.
#
# Original purpose: advisory integrity check — runs integrity-check.sh silently;
# prints a WARNING to stderr if mismatches found. Always exits 0, never blocks.
#
# Wire into .zshrc or a PostToolUse hook that fires once per session:
#   source ~/.codex/hooks/integrity-warn.sh
# or call directly:
#   ~/.codex/hooks/integrity-warn.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
INTEGRITY_SCRIPT="${SCRIPT_DIR}/../scripts/integrity-check.sh"

if [ ! -x "$INTEGRITY_SCRIPT" ]; then
  # Toolkit not found — fail silently, never block
  exit 0
fi

"$INTEGRITY_SCRIPT" warn
