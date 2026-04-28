#!/usr/bin/env bash
# Detect printf patterns that commonly mishandle untrusted escape sequences.
set -euo pipefail

if [[ "$#" -eq 0 ]]; then
  echo "usage: lint-printf-newlines.sh FILE..." >&2
  exit 2
fi

status=0
for file in "$@"; do
  [[ -f "$file" ]] || continue

  if grep -nE "printf[[:space:]]+['\"]%b" "$file"; then
    echo "printf-lint: $file uses printf '%b'; use printf '%s' with pre-sanitized input instead." >&2
    status=1
  fi

  if grep -nE "[A-Za-z_][A-Za-z0-9_]*=.*\\\\n" "$file" >/dev/null &&
     grep -nE "printf[[:space:]]+['\"]%s['\"]" "$file" >/dev/null; then
    echo "printf-lint: $file combines literal \\n accumulation with printf '%s'; verify real newlines are emitted intentionally." >&2
    status=1
  fi
done

exit "$status"
