#!/usr/bin/env bash
# Check: hex-colors
# Detects arbitrary hex color values in .tsx/.ts files
# Rule: Use semantic tokens, not hex values
set -euo pipefail

violations=0
for file in "$@"; do
  [[ "$file" =~ \.(tsx?|ts)$ ]] || continue
  [[ -f "$file" ]] || continue

  prev_line=""
  line_num=0
  while IFS= read -r line; do
    line_num=$((line_num + 1))
    # Skip if previous line has suppression comment
    if [[ "$prev_line" == *"design-lint-disable hex-colors"* ]]; then
      prev_line="$line"
      continue
    fi
    # Skip comments and imports (line comments, block comment lines, block comments, imports)
    if [[ "$line" =~ ^[[:space:]]*(//|\*|/\*|import) ]]; then
      prev_line="$line"
      continue
    fi
    # Match hex colors (#FFF, #FFFFFF, #FF000080, etc.)
    if echo "$line" | grep -qoE '#[0-9a-fA-F]{3,8}'; then
      match=$(echo "$line" | grep -oE '#[0-9a-fA-F]{3,8}' | head -1)
      echo "$file:$line_num:$match"
      violations=1
    fi
    prev_line="$line"
  done < "$file"
done

exit $violations
