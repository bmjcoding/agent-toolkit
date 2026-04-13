#!/usr/bin/env bash
# Check: oklch-gamut-surface
# Detects OKLCH values with chroma > 0.15 in bg-* contexts
# Rule: UI surfaces must have chroma <= 0.15
set -euo pipefail

violations=0
for file in "$@"; do
  [[ "$file" =~ \.(tsx?|ts)$ ]] || continue
  [[ -f "$file" ]] || continue

  prev_line=""
  line_num=0
  while IFS= read -r line; do
    line_num=$((line_num + 1))
    if [[ "$prev_line" == *"design-lint-disable oklch-gamut-surface"* ]]; then
      prev_line="$line"
      continue
    fi
    # Match bg-[oklch(...)] with inline OKLCH values
    if echo "$line" | grep -qE 'bg-\[oklch\('; then
      # Extract chroma value (second number in oklch) using perl for macOS compat
      chroma=$(echo "$line" | perl -ne 'print "$1\n" if /bg-\[oklch\(\s*[\d.]+\s+([\d.]+)/' | head -1)
      if [[ -n "$chroma" ]]; then
        if (( $(echo "$chroma > 0.15" | bc -l 2>/dev/null || echo 0) )); then
          echo "$file:$line_num:oklch chroma $chroma > 0.15 in bg context"
          violations=1
        fi
      fi
    fi
    prev_line="$line"
  done < "$file"
done

exit $violations
