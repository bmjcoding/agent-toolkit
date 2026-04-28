#!/usr/bin/env bash
# monochromatic.sh — count distinct non-gray Tailwind color families and flag
#                    when more than the allowed number are present in scope.
#
# Monochromatic discipline: a UI should be predominantly grayscale with the
# accent used sparingly. A "non-gray" family is any Tailwind color prefix NOT
# in {gray, zinc, stone, neutral, slate}. Status colors (red, yellow, green
# used for error/warning/success) each count as one family — they are
# legitimate signal colors, but the cumulative limit still applies.
#
# Allowed limit: 3 distinct non-gray families across the file set. The limit
# can be overridden with --max-families N for projects with different visual
# vocabularies.
#
# Usage:
#   monochromatic.sh [--max-families N] <file> [<file> ...]
#
# Exits non-zero on violation; prints the offending classes to stdout.
set -uo pipefail

MAX_FAMILIES=3
GRAY_FAMILIES="gray|zinc|stone|neutral|slate"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --max-families)
      MAX_FAMILIES="$2"
      shift 2
      ;;
    --)
      shift
      break
      ;;
    -*)
      echo "unknown flag: $1" >&2
      exit 2
      ;;
    *)
      break
      ;;
  esac
done

if [ "$#" -lt 1 ]; then
  echo "usage: $0 [--max-families N] <file> [<file> ...]" >&2
  exit 2
fi

# Tailwind color prefixes. The list of base color families is canonical from
# Tailwind itself — embedding it here is acceptable because it changes only
# when Tailwind adds a family, at which point this script is the single
# update site (not every agent definition).
ALL_FAMILIES="slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose"

# Extract families from utility classes like text-red-500, bg-blue-300/50,
# border-emerald-700, ring-pink-400. We look for "<prefix>-<family>-<shade>"
# in HTML/JSX/CSS context.
FAMILY_RE="(text|bg|border|ring|fill|stroke|from|to|via|outline|divide|placeholder|caret|accent|decoration|shadow)-(${ALL_FAMILIES})-[0-9]+"

FOUND=$(grep -hoE "$FAMILY_RE" "$@" 2>/dev/null \
  | sed -E "s/^[^-]+-(${ALL_FAMILIES})-[0-9]+$/\1/" \
  | grep -vE "^(${GRAY_FAMILIES})$" \
  | sort -u)

COUNT=0
[ -n "$FOUND" ] && COUNT=$(echo "$FOUND" | wc -l | tr -d ' ')

if [ "$COUNT" -gt "$MAX_FAMILIES" ]; then
  echo "monochromatic: $COUNT non-gray color families exceeds limit of $MAX_FAMILIES"
  echo "  families: $(echo "$FOUND" | tr '\n' ' ')"
  exit 1
fi

# Informational success line so callers can see what was scanned.
echo "monochromatic: $COUNT non-gray color families (limit $MAX_FAMILIES) ok"
exit 0
