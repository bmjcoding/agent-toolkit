#!/usr/bin/env bash
# Check: dark-mode-pairs
# Detects color utilities missing dark: counterparts
# Rule: Every bg-, text-, border-, divide-, and ring- color class needs a dark: pair
set -euo pipefail

COLOR_NAMES='gray|red|green|blue|amber|orange|yellow|purple|pink|indigo|slate|zinc|neutral|stone'
PREFIXES='bg|text|border|divide|ring'

violations=0
for file in "$@"; do
  [[ "$file" =~ \.(tsx?|ts)$ ]] || continue
  [[ -f "$file" ]] || continue

  prev_line=""
  line_num=0
  while IFS= read -r line; do
    line_num=$((line_num + 1))
    if [[ "$prev_line" == *"design-lint-disable dark-mode-pairs"* ]]; then
      prev_line="$line"
      continue
    fi
    # Look for className strings containing bg-, text-, border-, divide-, or ring- color classes
    if echo "$line" | grep -qE "(${PREFIXES})-(${COLOR_NAMES})-[0-9]"; then
      # Check if the same line has a dark: counterpart for each prefix found
      for prefix in bg text border divide ring; do
        if echo "$line" | grep -qE "${prefix}-(${COLOR_NAMES})-[0-9]"; then
          if ! echo "$line" | grep -qE "dark:${prefix}-"; then
            match=$(echo "$line" | grep -oE "${prefix}-(${COLOR_NAMES})-[0-9]+" | head -1)
            if [[ -n "$match" ]]; then
              echo "$file:$line_num:$match"
              violations=1
            fi
          fi
        fi
      done
    fi
    prev_line="$line"
  done < "$file"
done

exit $violations
