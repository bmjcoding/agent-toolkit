#!/usr/bin/env bash
# =============================================================================
# install.sh — GitHub Copilot project-scoped symlink installer
#
# PURPOSE:
#   Symlinks GitHub Copilot discovery paths inside a target project's .github/
#   directory into the agent-toolkit repository. This is PROJECT-SCOPED, not
#   user-global — each project that wants Copilot support needs this run once.
#
# SYMLINK MAP (inside <project>/.github/):
#   .github/agents       -> <REPO>/github-copilot/agents
#   .github/bundles      -> <REPO>/github-copilot/bundles
#   .github/hooks        -> <REPO>/github-copilot/hooks
#   .github/instructions -> <REPO>/github-copilot/instructions
#   .github/prompts      -> <REPO>/github-copilot/prompts
#   .github/rules        -> <REPO>/github-copilot/rules
#   .github/skills       -> <REPO>/github-copilot/skills   (13 skills, Copilot wrappers)
#
# SCOPE NOTE:
#   Unlike claude-code/scripts/install.sh (which installs to ~/.claude/ — user-
#   global), this script installs to a specific project's .github/ directory.
#   Run it once per project that should use GitHub Copilot with these skills.
#
# USAGE:
#   ./install.sh --target <dir>    # <dir> = project root containing .github/
#   ./install.sh --target <dir> --dry-run
#   ./install.sh --target <dir> --check
#   ./install.sh --help
#
# OPTIONS:
#   --target <dir>   Path to the project root whose .github/ should receive
#                    the symlinks. Required (unless --help). If omitted and
#                    the current directory is a git repo that is NOT the
#                    agent-toolkit repo itself, it will be auto-detected.
#   --dry-run        Print planned symlink commands without executing them.
#   --check          Verify existing symlinks match expected; exit 0=OK, 1=diff.
#   --help           Show this message and exit.
#
# ENV OVERRIDES:
#   AGENT_TOOLKIT_DIR   Override auto-detected agent-toolkit repo root.
#
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

DRY_RUN=false
CHECK_MODE=false
TARGET_DIR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --check)
      CHECK_MODE=true
      shift
      ;;
    --target)
      if [[ $# -lt 2 || -z "$2" ]]; then
        echo "ERROR: --target requires a directory argument" >&2
        exit 1
      fi
      TARGET_DIR="$2"
      shift 2
      ;;
    --help|-h)
      sed -n '/^# ===/,/^# ===/p' "$0"
      exit 0
      ;;
    *)
      echo "ERROR: unknown argument: $1" >&2
      echo "Usage: $0 --target <project-dir> [--dry-run|--check]" >&2
      exit 1
      ;;
  esac
done

# Mutually exclusive flags
if [[ "$DRY_RUN" == "true" && "$CHECK_MODE" == "true" ]]; then
  echo "ERROR: --dry-run and --check are mutually exclusive" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Resolve REPO_DIR (agent-toolkit repo root)
# ---------------------------------------------------------------------------

_default_repo_dir="$(cd "$(dirname "$0")/../.." && pwd)"
REPO_DIR="${AGENT_TOOLKIT_DIR:-$_default_repo_dir}"

# Reject path-traversal in env-var override
case "$REPO_DIR" in
  *..*)
    echo "ERROR: REPO_DIR contains '..' segments — refusing for safety" >&2
    exit 1
    ;;
esac

# Validate it looks like the right repo
if [[ ! -d "${REPO_DIR}/github-copilot" ]]; then
  echo "ERROR: REPO_DIR '${REPO_DIR}' does not contain github-copilot/ subdirectory." >&2
  echo "       Set AGENT_TOOLKIT_DIR to the correct agent-toolkit repo root." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Resolve TARGET_DIR (the project whose .github/ will receive symlinks)
# ---------------------------------------------------------------------------

if [[ -z "$TARGET_DIR" ]]; then
  # Auto-detect: must be in a git repo that is NOT the agent-toolkit repo
  _cwd_git_root="$(git rev-parse --show-toplevel 2>/dev/null)" || {
    echo "ERROR: --target is required when not inside a git repository." >&2
    echo "       Usage: $0 --target <project-root>" >&2
    exit 1
  }

  if [[ "$_cwd_git_root" == "$REPO_DIR" ]]; then
    echo "ERROR: --target is required. Current directory is the agent-toolkit repo itself." >&2
    echo "       Specify the project you want to install Copilot support into:" >&2
    echo "       $0 --target /path/to/your-project" >&2
    exit 1
  fi

  TARGET_DIR="$_cwd_git_root"
  echo "Auto-detected target project: ${TARGET_DIR}"
fi

# Resolve to absolute path
TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"

# Reject path-traversal
case "$TARGET_DIR" in
  *..*)
    echo "ERROR: TARGET_DIR contains '..' segments — refusing for safety" >&2
    exit 1
    ;;
esac

if [[ ! -d "$TARGET_DIR" ]]; then
  echo "ERROR: target directory does not exist: ${TARGET_DIR}" >&2
  exit 1
fi

GITHUB_DIR="${TARGET_DIR}/.github"

# ---------------------------------------------------------------------------
# Symlink definitions
# Format: "link_name_relative_to_GITHUB_DIR|source_path_absolute"
# ---------------------------------------------------------------------------

declare -a SYMLINKS=(
  "agents|${REPO_DIR}/github-copilot/agents"
  "bundles|${REPO_DIR}/github-copilot/bundles"
  "hooks|${REPO_DIR}/github-copilot/hooks"
  "instructions|${REPO_DIR}/github-copilot/instructions"
  "prompts|${REPO_DIR}/github-copilot/prompts"
  "rules|${REPO_DIR}/github-copilot/rules"
  "skills|${REPO_DIR}/github-copilot/skills"
)

# ---------------------------------------------------------------------------
# Print header
# ---------------------------------------------------------------------------

echo ""
echo "github-copilot install.sh (project-scoped)"
echo "==========================================="
echo "REPO_DIR:   ${REPO_DIR}"
echo "TARGET:     ${TARGET_DIR}"
echo "GITHUB_DIR: ${GITHUB_DIR}"
echo ""
echo "NOTE: This script installs into a specific project's .github/ directory."
echo "      It is NOT user-global. Run once per project that needs Copilot support."
echo ""

# ---------------------------------------------------------------------------
# --check mode
# ---------------------------------------------------------------------------

if [[ "$CHECK_MODE" == "true" ]]; then
  echo "Mode: CHECK (read-only)"
  echo ""

  all_match=true
  for entry in "${SYMLINKS[@]}"; do
    name="${entry%%|*}"
    abs_target="${entry##*|}"
    link_path="${GITHUB_DIR}/${name}"

    # Skip entries whose source does not yet exist
    if [[ ! -d "${abs_target}" ]]; then
      printf '  [SKIP]     %-14s  (source not yet present: %s)\n' "${name}" "${abs_target}"
      continue
    fi

    if [[ ! -L "${link_path}" ]]; then
      printf '  [MISS]     %-14s  (not a symlink at %s)\n' "${name}" "${link_path}"
      all_match=false
      continue
    fi

    current_target="$(readlink "${link_path}")"
    if [[ "${current_target}" == "${abs_target}" ]]; then
      printf '  [MATCH]    %-14s  -> %s\n' "${name}" "${current_target}"
    else
      printf '  [DIFF]     %-14s\n' "${name}"
      printf '               current:  %s\n' "${current_target}"
      printf '               expected: %s\n' "${abs_target}"
      all_match=false
    fi
  done

  echo ""
  if [[ "$all_match" == "true" ]]; then
    echo "All present symlinks match expected targets. OK."
    exit 0
  else
    echo "One or more symlinks differ from expected targets." >&2
    exit 1
  fi
fi

# ---------------------------------------------------------------------------
# --dry-run mode
# ---------------------------------------------------------------------------

if [[ "$DRY_RUN" == "true" ]]; then
  echo "Mode: DRY RUN (no changes will be made)"
  echo ""

  for entry in "${SYMLINKS[@]}"; do
    name="${entry%%|*}"
    abs_target="${entry##*|}"
    link_path="${GITHUB_DIR}/${name}"

    if [[ ! -d "${abs_target}" ]]; then
      printf '  would skip: %s/%s  (source not yet present)\n' "${GITHUB_DIR}" "${name}"
      continue
    fi

    if [[ -L "${link_path}" ]]; then
      current="$(readlink "${link_path}")"
      if [[ "${current}" == "${abs_target}" ]]; then
        printf '  unchanged:  %s  (already correct)\n' "${link_path}"
      else
        printf '  would update: %s\n' "${link_path}"
        printf '    before: %s\n' "${current}"
        printf '    after:  %s\n' "${abs_target}"
        printf '    cmd: ln -sfn "%s" "%s"\n' "${abs_target}" "${link_path}"
      fi
    else
      printf '  would create: %s\n' "${link_path}"
      printf '    target: %s\n' "${abs_target}"
      printf '    cmd: ln -s "%s" "%s"\n' "${abs_target}" "${link_path}"
    fi
    echo ""
  done

  echo "Dry run complete. No changes made."
  exit 0
fi

# ---------------------------------------------------------------------------
# APPLY mode
# ---------------------------------------------------------------------------

echo "Mode: APPLY"
echo ""

# Ensure .github/ exists in target project
if [[ ! -d "${GITHUB_DIR}" ]]; then
  mkdir -p "${GITHUB_DIR}"
  echo "  created: ${GITHUB_DIR}"
fi

for entry in "${SYMLINKS[@]}"; do
  name="${entry%%|*}"
  abs_target="${entry##*|}"
  link_path="${GITHUB_DIR}/${name}"

  # Skip entries whose source does not yet exist (graceful — populated later)
  if [[ ! -d "${abs_target}" ]]; then
    printf '  %-14s  SKIP (source not yet present — re-run after directory is added)\n' "${name}"
    continue
  fi

  # Guard: abort if a real file/dir occupies the link path
  if [[ -e "${link_path}" && ! -L "${link_path}" ]]; then
    echo "ERROR: ${link_path} is a real directory/file, not a symlink." >&2
    echo "       Remove it manually before re-running." >&2
    exit 1
  fi

  # Capture before state
  if [[ -L "${link_path}" ]]; then
    before="$(readlink "${link_path}")"
  else
    before="(none)"
  fi

  ln -sfn "${abs_target}" "${link_path}"
  after="$(readlink "${link_path}")"

  printf '  %-14s\n' "${name}"
  printf '    before: %s\n' "${before}"
  printf '    after:  %s\n' "${after}"
  if [[ "${before}" == "${after}" ]]; then
    printf '    status: unchanged (already correct)\n'
  else
    printf '    status: updated\n'
  fi
  echo ""
done

echo "Done."
echo ""
echo "Next steps:"
echo "  1. Commit or .gitignore the .github/ symlinks as appropriate for your project."
echo "  2. Run '$0 --target ${TARGET_DIR} --check' to verify symlinks remain current."
echo "  3. Re-run this script after new github-copilot/ directories are added to the toolkit."
echo ""
