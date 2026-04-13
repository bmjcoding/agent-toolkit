#!/usr/bin/env bash
# Check: border-radius
# Detects wrong border radius values (rounded-md, rounded-sm)
# Rule: Use rounded-2xl, rounded-xl, rounded-lg, or rounded-full only
set -euo pipefail

violations=0
for file in "$@"; do
  [[ "$file" =~ \.(tsx?|ts)$ ]] || continue
  [[ -f "$file" ]] || continue

  prev_line=""
  line_num=0
  while IFS= read -r line; do
    line_num=$((line_num + 1))
    if [[ "$prev_line" == *"design-lint-disable border-radius"* ]]; then
      prev_line="$line"
      continue
    fi
    # Match rounded-md or rounded-sm (word boundary)
    if echo "$line" | grep -qE '\brounded-(md|sm)\b'; then
      match=$(echo "$line" | grep -oE '\brounded-(md|sm)\b' | head -1)
      echo "$file:$line_num:$match"
      violations=1
    fi
    prev_line="$line"
  done < "$file"
done

exit $violations
