#!/usr/bin/env bash
# Print the next zero-padded ADR number for a directory.
set -euo pipefail

ADR_DIR="${1:-docs/adr}"
mkdir -p "$ADR_DIR"

LOCKDIR="$ADR_DIR/.adr-number.lock"
while ! mkdir "$LOCKDIR" 2>/dev/null; do
  sleep 0.1
done
trap 'rm -rf "$LOCKDIR"' EXIT

max=0
while IFS= read -r file; do
  base="$(basename "$file")"
  if [[ "$base" =~ ^([0-9]{4})[-_] ]]; then
    num="${BASH_REMATCH[1]}"
    if ((10#$num > max)); then
      max=$((10#$num))
    fi
  fi
done < <(find "$ADR_DIR" -maxdepth 1 -type f -name '[0-9][0-9][0-9][0-9]*.md' | sort)

printf '%04d\n' "$((max + 1))"
