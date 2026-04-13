#!/usr/bin/env bash
# build-agents-md.sh — Concatenate openai-codex rule bodies into an AGENTS.md block.
#
# Usage:
#   bash openai-codex/rules/build-agents-md.sh             # write to stdout
#   bash openai-codex/rules/build-agents-md.sh >> AGENTS.md # append to project AGENTS.md
#
# Exit codes:
#   0  success — block written to stdout
#   1  one or more rule files missing — partial output written; details on stderr
#   2  script directory cannot be determined — nothing written
#
# The script strips YAML frontmatter (the opening ---…--- block) from each rule
# .md file and emits the remaining body under a Markdown section header.
# Frontmatter is defined as lines between the first and second bare `---` line
# (inclusive). If a file has no frontmatter the entire file is emitted.
#
# This script must be run from any directory; it resolves paths relative to its
# own location.

set -euo pipefail

# Resolve the directory containing this script (POSIX-portable).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -z "${SCRIPT_DIR}" ]]; then
  echo "build-agents-md.sh: error: cannot determine script directory" >&2
  exit 2
fi

# ---------------------------------------------------------------------------
# strip_frontmatter <file>
#   Reads <file>, strips the leading YAML frontmatter block (---...---) if
#   present, and writes the remaining content to stdout.
#   If no frontmatter is found, the full file is written unchanged.
# ---------------------------------------------------------------------------
strip_frontmatter() {
  local file="$1"
  local in_frontmatter=0
  local frontmatter_done=0
  local line_no=0

  while IFS= read -r line; do
    line_no=$(( line_no + 1 ))

    if [[ "${line_no}" -eq 1 && "${line}" == "---" ]]; then
      in_frontmatter=1
      continue
    fi

    if [[ "${in_frontmatter}" -eq 1 && "${line}" == "---" ]]; then
      in_frontmatter=0
      frontmatter_done=1
      continue
    fi

    if [[ "${in_frontmatter}" -eq 0 ]]; then
      printf '%s\n' "${line}"
    fi
  done < "${file}"
}

# ---------------------------------------------------------------------------
# Ordered list of rules to compose.
# Each entry: "<slug>:<display_name>"
# ---------------------------------------------------------------------------
RULES=(
  "docker:Docker"
  "logging:Logging"
  "node:Node"
  "python:Python"
)

missing=0

echo "## Rules"
echo ""
echo "The following coding rules apply to all files in this project."
echo ""

for entry in "${RULES[@]}"; do
  slug="${entry%%:*}"
  display="${entry##*:}"
  rule_file="${SCRIPT_DIR}/${slug}/${slug}.md"

  if [[ ! -f "${rule_file}" ]]; then
    echo "build-agents-md.sh: warning: rule file not found: ${rule_file}" >&2
    missing=$(( missing + 1 ))
    continue
  fi

  echo "### ${display}"
  echo ""
  strip_frontmatter "${rule_file}"
  echo ""
done

if [[ "${missing}" -gt 0 ]]; then
  echo "build-agents-md.sh: error: ${missing} rule file(s) missing; AGENTS.md block is incomplete" >&2
  exit 1
fi

exit 0
