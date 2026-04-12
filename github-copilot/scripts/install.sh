#!/usr/bin/env bash
# github-copilot/scripts/install.sh
#
# Install GitHub Copilot skills and agents into VS Code discovery paths.
#
# TARGET SURFACE: VS Code GitHub Copilot extension only.
#
# Copilot skill discovery paths (VS Code):
#   .github/skills/<name>/SKILL.md   (repo-level, highest priority)
#   .agents/skills/<name>/SKILL.md   (repo-level)
#   .claude/skills/<name>/SKILL.md   (repo-level, cross-tool compat)
#
# Copilot agent discovery path (VS Code):
#   .github/agents/<name>.agent.md
#
# This script symlinks from the above discovery paths into github-copilot/.
# Agents already in claude-code/ that are shared across surfaces are NOT
# symlinked by this script — use claude-code/scripts/install.sh for those.
#
# Usage:
#   ./github-copilot/scripts/install.sh [--dry-run] [--check] [--help]
#
# Options:
#   --dry-run   Print what would be done without making any changes.
#   --check     Verify all expected symlinks exist and point to correct targets.
#               Exit 0 if OK, 1 if any symlink is missing or broken.
#   --help      Show this message and exit.
#
# Environment:
#   AGENT_TOOLKIT_DIR   Override repo root detection (default: git rev-parse --show-toplevel)

set -euo pipefail

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
DRY_RUN=false
CHECK_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --check)   CHECK_ONLY=true ;;
    --help)
      sed -n '/^# Usage:/,/^[^#]/{ /^[^#]/d; s/^# \{0,1\}//p }' "$0"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      echo "Run with --help for usage." >&2
      exit 1
      ;;
  esac
done

# Mutex: --dry-run and --check are mutually exclusive (da-10)
if [[ "$DRY_RUN" == "true" && "$CHECK_ONLY" == "true" ]]; then
  echo "ERROR: --dry-run and --check are mutually exclusive" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Repo root resolution
# ---------------------------------------------------------------------------
REPO_ROOT="${AGENT_TOOLKIT_DIR:-}"
if [[ -z "$REPO_ROOT" ]]; then
  REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
    echo "ERROR: Not inside a git repository and AGENT_TOOLKIT_DIR is not set." >&2
    exit 1
  }
fi

# Reject paths with .. segments (security guard)
case "$REPO_ROOT" in
  *..*)
    echo "ERROR: AGENT_TOOLKIT_DIR contains '..' segments — rejected." >&2
    exit 1
    ;;
esac

COPILOT_DIR="$REPO_ROOT/github-copilot"
GITHUB_DIR="$REPO_ROOT/.github"

# ---------------------------------------------------------------------------
# Symlink map: target (source) -> link (destination)
# Each entry: LINK_PATH SOURCE_PATH
# ---------------------------------------------------------------------------
declare -a SYMLINKS=(
  # Skills
  "$GITHUB_DIR/skills/changelog/SKILL.md"  "$COPILOT_DIR/skills/changelog/SKILL.md"
  # Agents
  "$GITHUB_DIR/agents/planner.agent.md"    "$COPILOT_DIR/agents/planner.agent.md"
)

# ---------------------------------------------------------------------------
# Helper: log_action
# ---------------------------------------------------------------------------
log_action() {
  local action="$1" link="$2" target="$3"
  if [[ "$DRY_RUN" == "true" ]]; then
    echo "[dry-run] $action: $link -> $target"
  else
    echo "$action: $link -> $target"
  fi
}

# ---------------------------------------------------------------------------
# Check mode
# ---------------------------------------------------------------------------
if [[ "$CHECK_ONLY" == "true" ]]; then
  ERRORS=0
  for (( i=0; i<${#SYMLINKS[@]}; i+=2 )); do
    link="${SYMLINKS[$i]}"
    target="${SYMLINKS[$((i+1))]}"
    # sre-7: correct order — (1) not a symlink, (2) wrong target, (3) broken symlink
    if [[ ! -L "$link" ]]; then
      echo "MISSING symlink: $link" >&2
      (( ERRORS++ )) || true
    elif [[ "$(readlink "$link")" != "$target" ]]; then
      echo "WRONG target: $link -> $(readlink "$link") (expected $target)" >&2
      (( ERRORS++ )) || true
    elif [[ ! -e "$link" ]]; then
      echo "BROKEN symlink: $link (target does not exist)" >&2
      (( ERRORS++ )) || true
    else
      echo "OK: $link -> $target"
    fi
  done
  if (( ERRORS > 0 )); then
    echo "$ERRORS error(s) found." >&2
    exit 1
  fi
  echo "All symlinks OK."
  exit 0
fi

# ---------------------------------------------------------------------------
# Install mode
# ---------------------------------------------------------------------------
for (( i=0; i<${#SYMLINKS[@]}; i+=2 )); do
  link="${SYMLINKS[$i]}"
  target="${SYMLINKS[$((i+1))]}"
  link_dir="$(dirname "$link")"

  # Verify source exists
  if [[ ! -f "$target" ]]; then
    echo "ERROR: Source file does not exist: $target" >&2
    exit 1
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    log_action "symlink" "$link" "$target"
    continue
  fi

  # Create parent directory if needed
  if [[ ! -d "$link_dir" ]]; then
    mkdir -p "$link_dir"
    echo "created: $link_dir"
  fi

  # Create or update symlink
  if [[ -L "$link" ]]; then
    existing="$(readlink "$link")"
    if [[ "$existing" == "$target" ]]; then
      echo "unchanged: $link"
      continue
    fi
    echo "updating: $link (was $existing)"
    rm "$link"
  elif [[ -e "$link" ]]; then
    echo "ERROR: $link exists and is not a symlink — refusing to overwrite." >&2
    exit 1
  fi

  ln -s "$target" "$link"
  log_action "symlink" "$link" "$target"
done

echo "Done."
