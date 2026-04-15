#!/usr/bin/env bash
# index.sh — Build JSONL + Markdown indexes from *.normalized.json retro files.
# Usage: index.sh RETROS_DIR OUTPUT_DIR [--agents-log PATH]
set -euo pipefail

# ---------------------------------------------------------------------------
# Startup checks
# ---------------------------------------------------------------------------
if ! command -v jq &>/dev/null; then
  echo "ERROR: jq is required but not found in PATH." >&2
  exit 1
fi

usage() {
  cat >&2 <<'EOF'
Usage: index.sh RETROS_DIR OUTPUT_DIR [--agents-log PATH]

Arguments:
  RETROS_DIR     Directory containing *.normalized.json retro files (searched recursively)
  OUTPUT_DIR     Directory where index files will be written (created if absent)

Options:
  --agents-log PATH   Optional path to agents.log for enrichment

Output files produced in OUTPUT_DIR:
  all.jsonl                      One line per normalized retro discovered
  by-agent/<slug>.jsonl          Per-agent JSONL (15 agent slugs)
  by-skill/<slug>.jsonl          Per-skill JSONL (13 skill slugs)
  frankenstein-timeline.jsonl    subject=frankenstein OR subject=orchestrator

Each .jsonl file is paired with a .md summary table.

Agent slugs (15):
  autoresearch-analyst, backend-engineer, design-architect, doc-writer,
  frankenstein, frontend-engineer, integration-verifier, plan-reviewer,
  planner, quality-engineer, release-engineer, release-gate,
  security-engineer, site-reliability-engineer, staff-engineer

Skill slugs (13):
  backend, changelog, design-authority, design-lint, frontend, git-ship,
  improve, infra, observability-patterns, owasp-reference, prod-readiness,
  retro, review-skill
EOF
  exit 1
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
if [[ $# -lt 2 ]]; then
  usage
fi

RETROS_DIR="${1}"
OUTPUT_DIR="${2}"
AGENTS_LOG=""

shift 2
while [[ $# -gt 0 ]]; do
  case "$1" in
    --agents-log)
      if [[ $# -lt 2 ]]; then
        echo "ERROR: --agents-log requires a PATH argument." >&2
        exit 1
      fi
      AGENTS_LOG="${2}"
      shift 2
      ;;
    --help|-h)
      usage
      ;;
    *)
      echo "ERROR: Unknown argument: $1" >&2
      usage
      ;;
  esac
done

if [[ ! -d "${RETROS_DIR}" ]]; then
  echo "ERROR: RETROS_DIR '${RETROS_DIR}' does not exist or is not a directory." >&2
  exit 1
fi

if [[ -n "${AGENTS_LOG}" && ! -f "${AGENTS_LOG}" ]]; then
  echo "ERROR: --agents-log '${AGENTS_LOG}' does not exist." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Canonical slug lists
# ---------------------------------------------------------------------------
AGENT_SLUGS=(
  autoresearch-analyst
  backend-engineer
  design-architect
  doc-writer
  frankenstein
  frontend-engineer
  integration-verifier
  plan-reviewer
  planner
  quality-engineer
  release-engineer
  release-gate
  security-engineer
  site-reliability-engineer
  staff-engineer
)

SKILL_SLUGS=(
  backend
  changelog
  design-authority
  design-lint
  frontend
  git-ship
  improve
  infra
  observability-patterns
  owasp-reference
  prod-readiness
  retro
  review-skill
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Extract canonical table fields from a normalized JSON file, emit as one JSON line.
# Fields: session_id, date, subject, run_type, verdict, findings_total,
#         total_tokens, total_cost_usd, wall_clock_min
normalize_line() {
  local file="$1"
  jq -c '{
    session_id:      (.session_id    // null),
    date:            (.date          // null),
    subject:         (.subject       // null),
    run_type:        (.run_type      // null),
    verdict:         (.verdict       // null),
    findings_total:  (.findings_total // null),
    total_tokens:    (.total_tokens  // null),
    total_cost_usd:  (.total_cost_usd // null),
    wall_clock_min:  (.wall_clock_min // null),
    _source_file:    $src
  }' --arg src "${file}" "${file}" 2>/dev/null || true
}

# Write a Markdown summary table for a given .jsonl file.
# $1 = path to .jsonl file
# $2 = path to .md output file
# $3 = title string
write_md() {
  local jsonl_path="$1"
  local md_path="$2"
  local title="$3"

  {
    echo "# ${title}"
    echo ""
    echo "Generated: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    echo ""
    echo "| session_id | date | subject | run_type | verdict | findings_total | total_tokens | total_cost_usd | wall_clock_min |"
    echo "|---|---|---|---|---|---|---|---|---|"

    if [[ -s "${jsonl_path}" ]]; then
      while IFS= read -r line; do
        local session_id date subject run_type verdict findings_total total_tokens total_cost_usd wall_clock_min
        session_id=$(echo "${line}"    | jq -r '.session_id    // "N/A"')
        date=$(echo "${line}"          | jq -r '.date          // "N/A"')
        subject=$(echo "${line}"       | jq -r '.subject       // "N/A"')
        run_type=$(echo "${line}"      | jq -r '.run_type      // "N/A"')
        verdict=$(echo "${line}"       | jq -r '.verdict       // "N/A"')
        findings_total=$(echo "${line}" | jq -r '.findings_total // "N/A"')
        total_tokens=$(echo "${line}"  | jq -r '.total_tokens  // "N/A"')
        total_cost_usd=$(echo "${line}" | jq -r '.total_cost_usd // "N/A"')
        wall_clock_min=$(echo "${line}" | jq -r '.wall_clock_min // "N/A"')
        echo "| ${session_id} | ${date} | ${subject} | ${run_type} | ${verdict} | ${findings_total} | ${total_tokens} | ${total_cost_usd} | ${wall_clock_min} |"
      done < "${jsonl_path}"
    fi
  } > "${md_path}"
}

# ---------------------------------------------------------------------------
# Setup output directories
# ---------------------------------------------------------------------------
mkdir -p "${OUTPUT_DIR}/by-agent"
mkdir -p "${OUTPUT_DIR}/by-skill"

# Clear existing index files so we start fresh
rm -f "${OUTPUT_DIR}/all.jsonl"
rm -f "${OUTPUT_DIR}/frankenstein-timeline.jsonl"
for slug in "${AGENT_SLUGS[@]}"; do
  rm -f "${OUTPUT_DIR}/by-agent/${slug}.jsonl"
done
for slug in "${SKILL_SLUGS[@]}"; do
  rm -f "${OUTPUT_DIR}/by-skill/${slug}.jsonl"
done

# ---------------------------------------------------------------------------
# Discovery and indexing
# ---------------------------------------------------------------------------
echo "Scanning '${RETROS_DIR}' for *.normalized.json files..." >&2

file_count=0
skipped=0

while IFS= read -r -d '' src_file; do
  line=$(normalize_line "${src_file}")
  if [[ -z "${line}" ]]; then
    echo "WARN: Could not parse '${src_file}', skipping." >&2
    (( skipped++ )) || true
    continue
  fi

  # all.jsonl — every record
  echo "${line}" >> "${OUTPUT_DIR}/all.jsonl"

  subject=$(echo "${line}" | jq -r '.subject // ""')
  subject_lower=$(echo "${subject}" | tr '[:upper:]' '[:lower:]')

  # frankenstein-timeline: subject=frankenstein OR subject=orchestrator
  if [[ "${subject_lower}" == "frankenstein" || "${subject_lower}" == "orchestrator" ]]; then
    echo "${line}" >> "${OUTPUT_DIR}/frankenstein-timeline.jsonl"
  fi

  # by-agent — match subject against agent slug list
  for slug in "${AGENT_SLUGS[@]}"; do
    if [[ "${subject_lower}" == "${slug}" ]]; then
      echo "${line}" >> "${OUTPUT_DIR}/by-agent/${slug}.jsonl"
    fi
  done

  # by-skill — match subject against skill slug list
  for slug in "${SKILL_SLUGS[@]}"; do
    if [[ "${subject_lower}" == "${slug}" ]]; then
      echo "${line}" >> "${OUTPUT_DIR}/by-skill/${slug}.jsonl"
    fi
  done

  (( file_count++ )) || true
done < <(find "${RETROS_DIR}" -name '*.normalized.json' -not -path '*/index/*' -print0 | sort -z)

echo "Indexed ${file_count} files (${skipped} skipped)." >&2

# Sort frankenstein-timeline.jsonl by session_id
if [[ -s "${OUTPUT_DIR}/frankenstein-timeline.jsonl" ]]; then
  sort_tmp=$(mktemp)
  jq -s 'sort_by(.session_id // "")[]' "${OUTPUT_DIR}/frankenstein-timeline.jsonl" \
    | jq -c '.' > "${sort_tmp}"
  mv "${sort_tmp}" "${OUTPUT_DIR}/frankenstein-timeline.jsonl"
fi

# ---------------------------------------------------------------------------
# Generate paired .md files
# ---------------------------------------------------------------------------

# all.md
write_md \
  "${OUTPUT_DIR}/all.jsonl" \
  "${OUTPUT_DIR}/all.md" \
  "All Retros"

# frankenstein-timeline.md
write_md \
  "${OUTPUT_DIR}/frankenstein-timeline.jsonl" \
  "${OUTPUT_DIR}/frankenstein-timeline.md" \
  "Frankenstein Timeline"

# by-agent/*.md
for slug in "${AGENT_SLUGS[@]}"; do
  jsonl="${OUTPUT_DIR}/by-agent/${slug}.jsonl"
  md="${OUTPUT_DIR}/by-agent/${slug}.md"
  if [[ ! -f "${jsonl}" ]]; then
    # Create empty file so the paired .md is still produced
    touch "${jsonl}"
  fi
  write_md "${jsonl}" "${md}" "Agent: ${slug}"
done

# by-skill/*.md
for slug in "${SKILL_SLUGS[@]}"; do
  jsonl="${OUTPUT_DIR}/by-skill/${slug}.jsonl"
  md="${OUTPUT_DIR}/by-skill/${slug}.md"
  if [[ ! -f "${jsonl}" ]]; then
    touch "${jsonl}"
  fi
  write_md "${jsonl}" "${md}" "Skill: ${slug}"
done

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo "Output written to '${OUTPUT_DIR}':" >&2
echo "  all.jsonl ($(wc -l < "${OUTPUT_DIR}/all.jsonl" 2>/dev/null || echo 0) entries)" >&2
echo "  frankenstein-timeline.jsonl" >&2
echo "  by-agent/ (${#AGENT_SLUGS[@]} slugs)" >&2
echo "  by-skill/ (${#SKILL_SLUGS[@]} slugs)" >&2
echo "Done." >&2
