#!/usr/bin/env bash
# =============================================================================
# install.sh — ~/.claude/ symlink manager for agent-toolkit
#
# PURPOSE:
#   Creates or retargets the 6 live symlinks under ~/.claude/ so that Claude
#   Code resolves agents, commands, docs, hooks, rules, and skills from the
#   correct subdirectories of this repository.
#
# SYMLINK MAP:
#   ~/.claude/agents   ->  <REPO>/claude-code/agents
#   ~/.claude/commands ->  <REPO>/claude-code/commands
#   ~/.claude/docs     ->  <REPO>/claude-code/docs
#   ~/.claude/hooks    ->  <REPO>/claude-code/hooks
#   ~/.claude/rules    ->  <REPO>/claude-code/rules
#   ~/.claude/skills   ->  <REPO>/shared/skills   (shared across tools — not claude-code/skills)
#
# IDEMPOTENT: uses `ln -sfn` so re-running is always safe.
#
# REFERENCES:
#   - AGENTS.md: top-level agent roster and surface overview
#   - docs/adr/0004-per-component-changelog-tag-format.md: restructure ADR
#     that established the claude-code/ and shared/ layout
#
# USAGE:
#   ./install.sh              # apply symlinks
#   ./install.sh --dry-run    # print planned ln commands, do not execute
#   ./install.sh --check      # verify current symlinks match expected; exit 0=ok, 1=diff
#
# ENV OVERRIDES:
#   AGENT_TOOLKIT_DIR   Override the auto-detected repo root
#
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

DRY_RUN=false
CHECK_MODE=false

for arg in "$@"; do
  case "$arg" in
    --dry-run)  DRY_RUN=true ;;
    --check)    CHECK_MODE=true ;;
    --help|-h)
      sed -n '/^# ===/,/^# ===/p' "$0"
      exit 0
      ;;
    *)
      echo "ERROR: unknown argument: $arg" >&2
      echo "Usage: $0 [--dry-run|--check]" >&2
      exit 1
      ;;
  esac
done

# DRY_RUN and CHECK_MODE are mutually exclusive
if [[ "$DRY_RUN" == "true" && "$CHECK_MODE" == "true" ]]; then
  echo "ERROR: --dry-run and --check are mutually exclusive" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Resolve REPO_DIR
#
# Default: two levels up from this script's directory.
#   claude-code/scripts/install.sh -> claude-code/scripts -> claude-code -> <REPO>
# Override via AGENT_TOOLKIT_DIR env var.
# ---------------------------------------------------------------------------

_default_repo_dir="$(cd "$(dirname "$0")/../.." && pwd)"
REPO_DIR="${AGENT_TOOLKIT_DIR:-$_default_repo_dir}"

# Reject path-traversal in env-var override (sec-2)
case "$REPO_DIR" in
  *..*)
    echo "ERROR: REPO_DIR contains '..' segments — refusing for safety" >&2
    exit 1
    ;;
esac

# ---------------------------------------------------------------------------
# Validate REPO_DIR looks like the right repo (sanity check)
# ---------------------------------------------------------------------------

if [[ ! -d "${REPO_DIR}/claude-code" ]]; then
  echo "ERROR: REPO_DIR '${REPO_DIR}' does not contain claude-code/ subdirectory." >&2
  echo "       Set AGENT_TOOLKIT_DIR to the correct repo root." >&2
  exit 1
fi

if [[ ! -d "${REPO_DIR}/shared" ]]; then
  echo "ERROR: REPO_DIR '${REPO_DIR}' does not contain shared/ subdirectory." >&2
  echo "       Set AGENT_TOOLKIT_DIR to the correct repo root." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Verify ~/.claude/ exists (never create it — user owns it)
# ---------------------------------------------------------------------------

CLAUDE_HOME="${HOME}/.claude"

if [[ ! -d "${CLAUDE_HOME}" ]]; then
  echo "ERROR: ${CLAUDE_HOME} does not exist." >&2
  echo "       Create it or install Claude Code before running this script." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Symlink definitions
# Format: "link_name|target_path_relative_to_REPO_DIR"
# ---------------------------------------------------------------------------

declare -a SYMLINKS=(
  "agents|claude-code/agents"
  "commands|claude-code/commands"
  "docs|claude-code/docs"
  "hooks|claude-code/hooks"
  "rules|claude-code/rules"
  "skills|shared/skills"
)

# ---------------------------------------------------------------------------
# Helper: print a labelled line
# ---------------------------------------------------------------------------

info()  { printf '  %-12s %s\n' "$1" "$2"; }
ok()    { printf '  [OK]       %s\n' "$1"; }
warn()  { printf '  [WARN]     %s\n' "$1" >&2; }
err()   { printf 'ERROR: %s\n' "$1" >&2; }

# ---------------------------------------------------------------------------
# PRE-FLIGHT: verify all target directories exist before touching any symlinks
# ---------------------------------------------------------------------------

echo ""
echo "agent-toolkit install.sh"
echo "========================"
echo "REPO_DIR:    ${REPO_DIR}"
echo "CLAUDE_HOME: ${CLAUDE_HOME}"
echo ""

preflight_ok=true
for entry in "${SYMLINKS[@]}"; do
  name="${entry%%|*}"
  rel_target="${entry##*|}"
  abs_target="${REPO_DIR}/${rel_target}"

  if [[ ! -d "${abs_target}" ]]; then
    err "Target directory does not exist: ${abs_target}"
    preflight_ok=false
  fi
done

if [[ "$preflight_ok" != "true" ]]; then
  echo "" >&2
  echo "Pre-flight failed. Fix missing target directories before re-running." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# --check mode: compare current symlink targets to expected
# ---------------------------------------------------------------------------

if [[ "$CHECK_MODE" == "true" ]]; then
  echo "Mode: CHECK (read-only)"
  echo ""

  all_match=true
  for entry in "${SYMLINKS[@]}"; do
    name="${entry%%|*}"
    rel_target="${entry##*|}"
    abs_target="${REPO_DIR}/${rel_target}"
    link_path="${CLAUDE_HOME}/${name}"

    if [[ ! -L "${link_path}" ]]; then
      printf '  [MISS]     %-12s  (not a symlink at %s)\n' "${name}" "${link_path}"
      all_match=false
      continue
    fi

    current_target="$(readlink "${link_path}")"
    if [[ "${current_target}" == "${abs_target}" ]]; then
      printf '  [MATCH]    %-12s  -> %s\n' "${name}" "${current_target}"
    else
      printf '  [DIFF]     %-12s\n' "${name}"
      printf '               current:  %s\n' "${current_target}"
      printf '               expected: %s\n' "${abs_target}"
      all_match=false
    fi
  done

  echo ""
  if [[ "$all_match" == "true" ]]; then
    echo "All 6 symlinks match expected targets. OK."
    exit 0
  else
    echo "One or more symlinks differ from expected targets." >&2
    exit 1
  fi
fi

# ---------------------------------------------------------------------------
# --dry-run mode: print planned ln commands without executing
# ---------------------------------------------------------------------------

if [[ "$DRY_RUN" == "true" ]]; then
  echo "Mode: DRY RUN (no changes will be made)"
  echo ""
  for entry in "${SYMLINKS[@]}"; do
    name="${entry%%|*}"
    rel_target="${entry##*|}"
    abs_target="${REPO_DIR}/${rel_target}"
    link_path="${CLAUDE_HOME}/${name}"

    # Show current target if link already exists
    if [[ -L "${link_path}" ]]; then
      current="$(readlink "${link_path}")"
      printf '  would update: %s\n' "${link_path}"
      printf '    before: %s\n' "${current}"
      printf '    after:  %s\n' "${abs_target}"
    else
      printf '  would create: %s\n' "${link_path}"
      printf '    target: %s\n' "${abs_target}"
    fi
    echo "  cmd: ln -sfn \"${abs_target}\" \"${link_path}\""
    echo ""
  done
  echo "Dry run complete. No changes made."
  exit 0
fi

# ---------------------------------------------------------------------------
# APPLY mode: create or retarget each symlink with ln -sfn (idempotent)
# ---------------------------------------------------------------------------

echo "Mode: APPLY"
echo ""

for entry in "${SYMLINKS[@]}"; do
  name="${entry%%|*}"
  rel_target="${entry##*|}"
  abs_target="${REPO_DIR}/${rel_target}"
  link_path="${CLAUDE_HOME}/${name}"

  # Guard: abort if a real file/directory already occupies the link path (sre-1)
  # ln -sfn on macOS creates the symlink INSIDE an existing directory rather than
  # replacing it, silently producing wrong topology.
  if [[ -e "${link_path}" && ! -L "${link_path}" ]]; then
    err "${link_path} is a real directory/file, not a symlink."
    err "Remove it manually before running this script, or pass --force to remove and recreate."
    exit 1
  fi

  # Capture before state
  if [[ -L "${link_path}" ]]; then
    before="$(readlink "${link_path}")"
  else
    before="(none)"
  fi

  # Apply — ln -sfn is idempotent (force + no-dereference)
  ln -sfn "${abs_target}" "${link_path}"

  # Capture after state
  after="$(readlink "${link_path}")"

  printf '  %-10s\n' "${name}"
  printf '    before: %s\n' "${before}"
  printf '    after:  %s\n' "${after}"
  if [[ "${before}" == "${after}" ]]; then
    printf '    status: unchanged (already correct)\n'
  else
    printf '    status: updated\n'
  fi
  echo ""
done

# ---------------------------------------------------------------------------
# Smoke test: verify all 6 symlinks resolve to real directories with expected targets (sre-9)
# ---------------------------------------------------------------------------

echo "Smoke test..."
smoke_ok=true
for entry in "${SYMLINKS[@]}"; do
  name="${entry%%|*}"
  rel_target="${entry##*|}"
  abs_target="${REPO_DIR}/${rel_target}"
  link_path="${CLAUDE_HOME}/${name}"

  if [[ ! -L "${link_path}" ]]; then
    err "Smoke test FAILED: ${link_path} is not a symlink."
    smoke_ok=false
    continue
  fi

  actual_target="$(readlink "${link_path}")"
  if [[ "${actual_target}" != "${abs_target}" ]]; then
    err "Smoke test FAILED: ${link_path} -> ${actual_target} (expected ${abs_target})"
    smoke_ok=false
    continue
  fi

  if [[ ! -d "${link_path}" ]]; then
    err "Smoke test FAILED: ${link_path} does not resolve to a directory."
    smoke_ok=false
    continue
  fi

  entry_count="$(find "${link_path}" -maxdepth 1 -mindepth 1 | wc -l | tr -d ' ')"
  printf '  ~/.claude/%-10s  resolves OK (%s entries)\n' "${name}" "${entry_count}"
done

if [[ "$smoke_ok" != "true" ]]; then
  exit 1
fi

echo ""
echo "Done. All 6 symlinks are in place."
echo ""
echo "Next steps:"
echo "  1. Restart Claude Code to pick up any changed hook or agent definitions."
echo "  2. Run './install.sh --check' at any time to verify symlinks are current."
echo "  3. If you rename the repo directory, re-run this script or update AGENT_TOOLKIT_DIR."
echo ""
