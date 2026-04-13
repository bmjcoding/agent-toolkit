#!/usr/bin/env bash
# Check: oklch-gamut-accent
# Detects OKLCH values with chroma > 0.25 in any context
# Rule: Hard ceiling — no OKLCH value should exceed C=0.25
set -euo pipefail

violations=0
for file in "$@"; do
  [[ "$file" =~ \.(tsx?|ts)$ ]] || continue
  [[ -f "$file" ]] || continue

  prev_line=""
  line_num=0
  while IFS= read -r line; do
    line_num=$((line_num + 1))
    if [[ "$prev_line" == *"design-lint-disable oklch-gamut-accent"* ]]; then
      prev_line="$line"
      continue
    fi
    # Match oklch(...) with inline OKLCH values
    if echo "$line" | grep -qE 'oklch\('; then
      # Extract all chroma values using perl for macOS compat
      while IFS= read -r chroma; do
        if [[ -n "$chroma" ]]; then
          if (( $(echo "$chroma > 0.25" | bc -l 2>/dev/null || echo 0) )); then
            echo "$file:$line_num:oklch chroma $chroma > 0.25"
            violations=1
          fi
        fi
      done < <(echo "$line" | perl -ne 'while (/oklch\(\s*[\d.]+\s+([\d.]+)/g) { print "$1\n" }')
    fi
    prev_line="$line"
  done < "$file"
done

exit $violations
