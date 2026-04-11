#!/usr/bin/env bash
# PreToolUse hook: block git push to main/master
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
