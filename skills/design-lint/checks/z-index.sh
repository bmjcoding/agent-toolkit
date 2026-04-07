#!/usr/bin/env bash
# Check: z-index
# Detects arbitrary z-index values (z-[...])
# Rule: Use only z-10, z-20, z-30, z-40, z-50 from the defined scale
set -euo pipefail

violations=0
for file in "$@"; do
  [[ "$file" =~ \.(tsx?|ts)$ ]] || continue
  [[ -f "$file" ]] || continue

  prev_line=""
  line_num=0
  while IFS= read -r line; do
    line_num=$((line_num + 1))
    if [[ "$prev_line" == *"design-lint-disable z-index"* ]]; then
      prev_line="$line"
      continue
    fi
    # Match arbitrary z-index: z-[999], z-[9999], etc.
    if echo "$line" | grep -qE 'z-\[[0-9]+\]'; then
      match=$(echo "$line" | grep -oE 'z-\[[0-9]+\]' | head -1)
      echo "$file:$line_num:$match"
      violations=1
    fi
    prev_line="$line"
  done < "$file"
done

exit $violations
