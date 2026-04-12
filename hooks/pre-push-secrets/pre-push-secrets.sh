#!/usr/bin/env bash
# PreToolUse hook: scan for secrets before git push
# Runs gitleaks if available, falls back to grep for common patterns.
# Outputs a deny response to stdout if secrets are found; exits 0 if clean.
#
# RT-MSA-004 fix: scan full git history (--log-opts=HEAD), not just working tree.
# .orchestrator/handoffs/ is excluded to avoid false positives from security
# findings text that intentionally references secret-like patterns.
set -uo pipefail

deny() {
  jq -n --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

if command -v gitleaks >/dev/null 2>&1; then
  # Build a temp ignore file for paths that produce intentional false positives.
  # handoffs/ files contain security findings text with secret-like patterns.
  GL_IGNORE=$(mktemp /tmp/gitleaks-ignore-XXXXXX)
  printf '.orchestrator/handoffs/**\n' > "$GL_IGNORE"

  # Scan full git history from HEAD. --log-opts=HEAD covers all reachable commits,
  # catching secrets that were committed and later deleted from the working tree.
  if ! gitleaks detect --source . --log-opts=HEAD --gitleaks-ignore-path "$GL_IGNORE" 2>/dev/null; then
    rm -f "$GL_IGNORE"
    deny "gitleaks detected secrets in git history. Run /git-verify for details and remediation."
  fi
  rm -f "$GL_IGNORE"
  exit 0
fi

# grep fallback: scan the diff since branch diverged from default branch, plus staged changes
DEFAULT=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's,refs/remotes/origin/,,' || echo main)
BASE=$(git merge-base HEAD "${DEFAULT}" 2>/dev/null || echo "HEAD~1")
DIFF=$(git diff "${BASE}..HEAD" -p 2>/dev/null)
STAGED=$(git diff --cached -p 2>/dev/null)

SECRET_PATTERNS='AKIA[0-9A-Z]{16}|sk-[a-zA-Z0-9]{20,}|-----BEGIN (RSA |EC |DSA |PGP |OPENSSH )?PRIVATE KEY|ghp_[a-zA-Z0-9]{36}|xox[bsp]-[a-zA-Z0-9-]{10,}|glpat-[a-zA-Z0-9-]{20}|eyJ[a-zA-Z0-9_-]{20,}\.eyJ'

if { echo "$DIFF"; echo "$STAGED"; } | grep -inE "^\+.*($SECRET_PATTERNS)" 2>/dev/null | grep -q .; then
  deny "Secrets pattern detected in diff (grep fallback). Run /git-verify for details."
fi

exit 0
