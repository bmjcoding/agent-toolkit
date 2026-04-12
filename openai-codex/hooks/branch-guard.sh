#!/usr/bin/env bash
# Ported from claude-code/hooks/branch-guard/branch-guard.sh for Codex CLI hooks (experimental)
# Requires: features.codex_hooks=true in ~/.codex/config.toml
# Note: Codex hooks stdin payload schema may differ from Claude Code's; validate in your environment.
#
# Claude Code env vars used: none directly — reads git HEAD.
# Codex mapping: PreToolUse / matcher: Bash (git push/commit commands)
#
# Original purpose: PreToolUse hook — block git push to main/master.
set -uo pipefail

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

if [[ "$BRANCH" == "main" || "$BRANCH" == "master" ]]; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "Pushing directly to '"$BRANCH"' is blocked. Create a feature branch first: git switch -c <branch-name>"
    }
  }'
fi

exit 0
