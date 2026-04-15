#!/usr/bin/env bash
# Branch guard hook for the VS Code Copilot surface
# Requires: VS Code Copilot hooks enabled in your VS Code environment
# Note: VS Code Copilot hook stdin payload schema may differ from Claude Code's; validate in your environment.
#
# Claude Code env vars used: none directly — reads git HEAD.
# VS Code Copilot mapping: PreToolUse / matcher: Bash (git push/commit commands)
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
