#!/usr/bin/env bash
# SubagentStop hook: warn when agent-toolkit component files were edited without a paired CHANGELOG.md update
# version: 1.0.1
set -uo pipefail

# ---------------------------------------------------------------------------
# Per-session dedup: warn at most once per Claude Code session to avoid
# flooding output when multiple subagents stop in sequence.
# ---------------------------------------------------------------------------
# Sanitize SESSION_KEY: strip non-alphanumeric characters to prevent path
# traversal or injection via a malformed CLAUDE_SESSION_ID value.
SESSION_KEY=$(printf '%s' "${CLAUDE_SESSION_ID:-}" | tr -dc 'a-zA-Z0-9' | head -c 64)
# Fall back to a PID-based key if SESSION_KEY is empty after sanitization.
if [[ -z "$SESSION_KEY" ]]; then
  SESSION_KEY=$(printf '%s' "${PPID:-0}${BASHPID:-$$}" | md5 2>/dev/null || printf '%s' "$$")
  SESSION_KEY=$(printf '%s' "$SESSION_KEY" | tr -dc 'a-zA-Z0-9' | head -c 64)
fi
FLAG="/tmp/toolkit-drift-warned-${SESSION_KEY}"

if [[ -f "$FLAG" ]]; then
  exit 0
fi

# ---------------------------------------------------------------------------
# Locate the agent-toolkit root.
# Honour $TOOLKIT_PATH override; fall back to the canonical install location.
# ---------------------------------------------------------------------------
TOOLKIT="${TOOLKIT_PATH:-/Users/bmj/Developer/git/agent-toolkit}"

if [[ ! -d "$TOOLKIT" ]]; then
  exit 0
fi

# ---------------------------------------------------------------------------
# Read the SubagentStop event JSON from stdin (required by the hook protocol)
# but this hook does not use the payload — detection is done via git status.
# ---------------------------------------------------------------------------
INPUT=$(cat)
# INPUT is consumed but not used; the hook checks the working tree directly.
# shellcheck disable=SC2034
_INPUT_CONSUMED="$INPUT"

# ---------------------------------------------------------------------------
# Detect modified component files in the toolkit working tree.
# Component paths match: (agents|skills|hooks|commands|rules)/<name>/<file>
# ---------------------------------------------------------------------------
# Pattern matching component paths: (TYPE)/(name)/(file) — used for both
# filtering modified paths and as documentation of what counts as a component.
COMPONENT_PATTERN='^(claude-code/(agents|hooks|commands|rules)|shared/skills|shared/rules)/[^/]+/[^/]+'

# Capture git status output; gracefully handle non-git directories.
GIT_STATUS="$(git -C "$TOOLKIT" status --porcelain 2>/dev/null)" || exit 0

if [[ -z "$GIT_STATUS" ]]; then
  exit 0
fi

# Build a list of modified component file paths (relative to toolkit root).
MODIFIED_PATHS=()
while IFS= read -r line; do
  # git --porcelain output: "XY path" where XY is 2-char status code + space
  path="${line:3}"
  if echo "$path" | grep -qE "$COMPONENT_PATTERN"; then
    MODIFIED_PATHS+=("$path")
  fi
done <<< "$GIT_STATUS"

if [[ ${#MODIFIED_PATHS[@]} -eq 0 ]]; then
  exit 0
fi

# ---------------------------------------------------------------------------
# For each unique component directory (type/name), check whether its
# CHANGELOG.md appears in the modified file list.
# ---------------------------------------------------------------------------
declare -A COMPONENT_HAS_CHANGELOG

# First pass: record which components have a modified CHANGELOG.md
for path in "${MODIFIED_PATHS[@]}"; do
  # Extract component dir: first two path segments
  component_dir="$(echo "$path" | cut -d'/' -f1-2)"
  filename="$(basename "$path")"
  if [[ "$filename" == "CHANGELOG.md" ]]; then
    COMPONENT_HAS_CHANGELOG["$component_dir"]=1
  fi
done

# Second pass: collect components whose CHANGELOG.md was NOT updated
DRIFTED=()
for path in "${MODIFIED_PATHS[@]}"; do
  component_dir="$(echo "$path" | cut -d'/' -f1-2)"
  filename="$(basename "$path")"
  # Skip CHANGELOG.md itself
  [[ "$filename" == "CHANGELOG.md" ]] && continue
  if [[ -z "${COMPONENT_HAS_CHANGELOG[$component_dir]+_}" ]]; then
    # Mark this component as drifted (avoid duplicates)
    already_listed=0
    for d in "${DRIFTED[@]+"${DRIFTED[@]}"}"; do
      [[ "$d" == "$component_dir" ]] && already_listed=1 && break
    done
    if [[ "$already_listed" -eq 0 ]]; then
      DRIFTED+=("$component_dir")
    fi
  fi
done

# ---------------------------------------------------------------------------
# Emit advisory warning to stderr if any components are missing CHANGELOG updates.
# Never block (always exit 0).
# ---------------------------------------------------------------------------
if [[ ${#DRIFTED[@]} -gt 0 ]]; then
  touch "$FLAG"
  {
    echo ""
    echo "WARNING [toolkit-drift-check]: The following toolkit components were modified without a CHANGELOG.md update:"
    for component in "${DRIFTED[@]}"; do
      echo "  - $component"
    done
    echo ""
    echo "Run /sync-toolkit to generate CHANGELOG entries, or update each component's CHANGELOG.md manually per KaC 1.1.0."
    echo ""
  } >&2
fi

exit 0
