#!/usr/bin/env bash
# Check: shadow-weight
# Detects heavy shadow utilities
# Rule: Max shadow-sm allowed. No shadow-md, shadow-lg, shadow-xl, shadow-2xl
set -euo pipefail

violations=0
for file in "$@"; do
  [[ "$file" =~ \.(tsx?|ts)$ ]] || continue
  [[ -f "$file" ]] || continue

  prev_line=""
  line_num=0
  while IFS= read -r line; do
    line_num=$((line_num + 1))
    if [[ "$prev_line" == *"design-lint-disable shadow-weight"* ]]; then
      prev_line="$line"
      continue
    fi
    # Match shadow-md, shadow-lg, shadow-xl, shadow-2xl
    if echo "$line" | grep -qE '\bshadow-(md|lg|xl|2xl)\b'; then
      match=$(echo "$line" | grep -oE '\bshadow-(md|lg|xl|2xl)\b' | head -1)
      echo "$file:$line_num:$match"
      violations=1
    fi
    prev_line="$line"
  done < "$file"
done

exit $violations
