#!/usr/bin/env bash
# Check: focus-visible
# Detects outline removal without focus-visible:ring compensation
# Rule: Any outline-none must be paired with focus-visible:ring on the same element
set -euo pipefail

violations=0
for file in "$@"; do
  [[ "$file" =~ \.(tsx?|ts)$ ]] || continue
  [[ -f "$file" ]] || continue

  prev_line=""
  line_num=0
  while IFS= read -r line; do
    line_num=$((line_num + 1))
    if [[ "$prev_line" == *"design-lint-disable focus-visible"* ]]; then
      prev_line="$line"
      continue
    fi
    # Match any outline removal variant
    if echo "$line" | grep -qE '(outline-none|focus:outline-none|focus-visible:outline-none)'; then
      # Check if same line/className has focus-visible:ring
      if ! echo "$line" | grep -qE 'focus-visible:ring'; then
        match=$(echo "$line" | grep -oE '(focus-visible:outline-none|focus:outline-none|outline-none)' | head -1)
        echo "$file:$line_num:$match"
        violations=1
      fi
    fi
    prev_line="$line"
  done < "$file"
done

exit $violations
