#!/usr/bin/env bash
# =============================================================================
# install.sh — GitHub Copilot for VS Code project-scoped symlink installer
#
# PURPOSE:
#   Symlinks GitHub Copilot discovery paths inside a target project's `.github/`
#   directory into the agent-toolkit repository.
#
# SYMLINK MAP:
#   .github/agents       -> <REPO>/github-copilot/agents
#   .github/hooks/*.json -> <REPO>/github-copilot/hooks/<slug>/<slug>.json
#   .github/instructions -> <REPO>/github-copilot/instructions
#   .github/prompts      -> <REPO>/github-copilot/prompts
# USAGE:
#   ./install.sh --target <dir>
#   ./install.sh --target <dir> --dry-run
#   ./install.sh --target <dir> --check
# =============================================================================

set -euo pipefail

DRY_RUN=false
CHECK_MODE=false
TARGET_DIR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --check) CHECK_MODE=true; shift ;;
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
      exit 1
      ;;
  esac
done

if [[ "$DRY_RUN" == "true" && "$CHECK_MODE" == "true" ]]; then
  echo "ERROR: --dry-run and --check are mutually exclusive" >&2
  exit 1
fi

_default_repo_dir="$(cd "$(dirname "$0")/../.." && pwd)"
REPO_DIR="${AGENT_TOOLKIT_DIR:-$_default_repo_dir}"

if [[ ! -d "${REPO_DIR}/github-copilot" ]]; then
  echo "ERROR: REPO_DIR '${REPO_DIR}' does not contain github-copilot/." >&2
  exit 1
fi

if [[ -z "$TARGET_DIR" ]]; then
  _cwd_git_root="$(git rev-parse --show-toplevel 2>/dev/null)" || {
    echo "ERROR: --target is required when not inside a git repository." >&2
    exit 1
  }
  if [[ "$_cwd_git_root" == "$REPO_DIR" ]]; then
    echo "ERROR: --target is required when run from the toolkit repo itself." >&2
    exit 1
  fi
  TARGET_DIR="$_cwd_git_root"
fi

TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"
GITHUB_DIR="${TARGET_DIR}/.github"

declare -a GITHUB_SYMLINKS=(
  "agents|${REPO_DIR}/github-copilot/agents"
  "instructions|${REPO_DIR}/github-copilot/instructions"
  "prompts|${REPO_DIR}/github-copilot/prompts"
)

declare -a HOOK_MANIFESTS=(
  "branch-guard|${REPO_DIR}/github-copilot/hooks/branch-guard/branch-guard.json"
  "changelog-check|${REPO_DIR}/github-copilot/hooks/changelog-check/changelog-check.json"
  "extract-handoff|${REPO_DIR}/github-copilot/hooks/extract-handoff/extract-handoff.json"
  "inject-context|${REPO_DIR}/github-copilot/hooks/inject-context/inject-context.json"
  "integrity-warn|${REPO_DIR}/github-copilot/hooks/integrity-warn/integrity-warn.json"
  "pre-push-secrets|${REPO_DIR}/github-copilot/hooks/pre-push-secrets/pre-push-secrets.json"
  "protect-config|${REPO_DIR}/github-copilot/hooks/protect-config/protect-config.json"
)

print_header() {
  echo ""
  echo "github-copilot install.sh (project-scoped)"
  echo "==========================================="
  echo "REPO_DIR:   ${REPO_DIR}"
  echo "TARGET:     ${TARGET_DIR}"
  echo "GITHUB_DIR: ${GITHUB_DIR}"
  echo ""
}

check_link_set() {
  local prefix_dir="$1"
  local label_prefix="$2"
  shift 2
  local entry
  for entry in "$@"; do
    local name="${entry%%|*}"
    local abs_target="${entry##*|}"
    local link_path="${prefix_dir}/${name}"
    local display="${label_prefix}${name}"

    if [[ ! -d "${abs_target}" ]]; then
      printf '  [SKIP]     %-18s (source missing: %s)\n' "${display}" "${abs_target}"
      continue
    fi
    if [[ ! -L "${link_path}" ]]; then
      printf '  [MISS]     %-18s (%s)\n' "${display}" "${link_path}"
      return 1
    fi
    local current_target
    current_target="$(readlink "${link_path}")"
    if [[ "${current_target}" == "${abs_target}" ]]; then
      printf '  [MATCH]    %-18s -> %s\n' "${display}" "${current_target}"
    else
      printf '  [DIFF]     %-18s current=%s expected=%s\n' "${display}" "${current_target}" "${abs_target}"
      return 1
    fi
  done
  return 0
}

dry_run_link_set() {
  local prefix_dir="$1"
  shift
  local entry
  for entry in "$@"; do
    local name="${entry%%|*}"
    local abs_target="${entry##*|}"
    local link_path="${prefix_dir}/${name}"

    if [[ ! -d "${abs_target}" ]]; then
      printf '  would skip: %s (missing source %s)\n' "${link_path}" "${abs_target}"
      continue
    fi
    if [[ -L "${link_path}" ]]; then
      printf '  would update: %s -> %s\n' "${link_path}" "${abs_target}"
    else
      printf '  would create: %s -> %s\n' "${link_path}" "${abs_target}"
    fi
  done
}

check_hook_manifests() {
  local hooks_dir="$1"
  shift

  if [[ -L "${hooks_dir}" ]]; then
    printf '  [DIFF]     %-18s current=%s expected=directory with manifest symlinks\n' ".github/hooks" "$(readlink "${hooks_dir}")"
    return 1
  fi
  if [[ -e "${hooks_dir}" && ! -d "${hooks_dir}" ]]; then
    printf '  [DIFF]     %-18s existing path is not a directory\n' ".github/hooks"
    return 1
  fi
  if [[ ! -d "${hooks_dir}" ]]; then
    printf '  [MISS]     %-18s (%s)\n' ".github/hooks" "${hooks_dir}"
    return 1
  fi

  local all_ok=true
  local entry
  for entry in "$@"; do
    local slug="${entry%%|*}"
    local abs_target="${entry##*|}"
    local link_path="${hooks_dir}/${slug}.json"

    if [[ ! -L "${link_path}" ]]; then
      printf '  [MISS]     %-18s (%s)\n' ".github/hooks/${slug}.json" "${link_path}"
      all_ok=false
      continue
    fi

    local current_target
    current_target="$(readlink "${link_path}")"
    if [[ "${current_target}" == "${abs_target}" ]]; then
      printf '  [MATCH]    %-18s -> %s\n' ".github/hooks/${slug}.json" "${current_target}"
    else
      printf '  [DIFF]     %-18s current=%s expected=%s\n' ".github/hooks/${slug}.json" "${current_target}" "${abs_target}"
      all_ok=false
    fi
  done

  [[ "${all_ok}" == "true" ]]
}

dry_run_hook_manifests() {
  local hooks_dir="$1"
  shift

  if [[ -L "${hooks_dir}" ]]; then
    printf '  would replace symlink: %s -> %s\n' "${hooks_dir}" "$(readlink "${hooks_dir}")"
    printf '    with directory: %s\n' "${hooks_dir}"
  elif [[ ! -d "${hooks_dir}" ]]; then
    printf '  would create directory: %s\n' "${hooks_dir}"
  fi

  local entry
  for entry in "$@"; do
    local slug="${entry%%|*}"
    local abs_target="${entry##*|}"
    local link_path="${hooks_dir}/${slug}.json"

    if [[ -L "${link_path}" ]]; then
      printf '  would update: %s -> %s\n' "${link_path}" "${abs_target}"
    else
      printf '  would create: %s -> %s\n' "${link_path}" "${abs_target}"
    fi
  done
}

apply_link_set() {
  local prefix_dir="$1"
  shift
  mkdir -p "${prefix_dir}"
  local entry
  for entry in "$@"; do
    local name="${entry%%|*}"
    local abs_target="${entry##*|}"
    local link_path="${prefix_dir}/${name}"

    if [[ ! -d "${abs_target}" ]]; then
      printf '  [SKIP]     %s (missing source %s)\n' "${link_path}" "${abs_target}"
      continue
    fi
    if [[ -e "${link_path}" && ! -L "${link_path}" ]]; then
      echo "ERROR: ${link_path} exists and is not a symlink." >&2
      exit 1
    fi
    ln -sfn "${abs_target}" "${link_path}"
    printf '  [OK]       %s -> %s\n' "${link_path}" "${abs_target}"
  done
}

apply_hook_manifests() {
  local hooks_dir="$1"
  shift

  if [[ -L "${hooks_dir}" ]]; then
    local current_target
    current_target="$(readlink "${hooks_dir}")"
    rm "${hooks_dir}"
    printf '  [OK]       %s (replaced symlink to %s with directory)\n' "${hooks_dir}" "${current_target}"
  elif [[ -e "${hooks_dir}" && ! -d "${hooks_dir}" ]]; then
    echo "ERROR: ${hooks_dir} exists and is not a directory." >&2
    exit 1
  fi

  mkdir -p "${hooks_dir}"

  local entry
  for entry in "$@"; do
    local slug="${entry%%|*}"
    local abs_target="${entry##*|}"
    local link_path="${hooks_dir}/${slug}.json"

    if [[ ! -f "${abs_target}" ]]; then
      printf '  [SKIP]     %s (missing source %s)\n' "${link_path}" "${abs_target}"
      continue
    fi
    if [[ -e "${link_path}" && ! -L "${link_path}" ]]; then
      echo "ERROR: ${link_path} exists and is not a symlink." >&2
      exit 1
    fi
    ln -sfn "${abs_target}" "${link_path}"
    printf '  [OK]       %s -> %s\n' "${link_path}" "${abs_target}"
  done
}

print_header

if [[ "$CHECK_MODE" == "true" ]]; then
  echo "Mode: CHECK"
  echo ""
  all_ok=true
  check_link_set "${GITHUB_DIR}" ".github/" "${GITHUB_SYMLINKS[@]}" || all_ok=false
  check_hook_manifests "${GITHUB_DIR}/hooks" "${HOOK_MANIFESTS[@]}" || all_ok=false
  echo ""
  if [[ "$all_ok" == "true" ]]; then
    echo "All symlinks match expected targets."
    exit 0
  fi
  echo "One or more symlinks differ from expected targets." >&2
  exit 1
fi

if [[ "$DRY_RUN" == "true" ]]; then
  echo "Mode: DRY RUN"
  echo ""
  dry_run_link_set "${GITHUB_DIR}" "${GITHUB_SYMLINKS[@]}"
  dry_run_hook_manifests "${GITHUB_DIR}/hooks" "${HOOK_MANIFESTS[@]}"
  exit 0
fi

echo "Mode: APPLY"
echo ""
apply_link_set "${GITHUB_DIR}" "${GITHUB_SYMLINKS[@]}"
apply_hook_manifests "${GITHUB_DIR}/hooks" "${HOOK_MANIFESTS[@]}"
echo ""
echo "Done."
