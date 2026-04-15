#!/usr/bin/env bash
# =============================================================================
# install.sh — OpenAI Codex CLI full installer for agent-toolkit
#
# PURPOSE:
#   Installs Codex agents, hooks, and skills config from the agent-toolkit
#   repository into the user's Codex CLI directories.
#
# INSTALL TARGETS:
#   Agents:   openai-codex/agents/*.toml   -> ~/.codex/agents/  (user-global)
#             OR .codex/agents/             (project-local with --project)
#   Hooks:    openai-codex/hooks/hooks.json -> ~/.codex/hooks.json  (sibling to config.toml)
#             hooks.json may reference thin Codex adapters under openai-codex/hooks/<slug>/<slug>.sh
#             which delegate to the canonical root hooks/<slug>/<slug>.sh implementation
#   Config:   Appends [[skills.config]] blocks from config.toml.template
#             to ~/.codex/config.toml  (with prompt — NEVER overwrites existing)
#   Feature:  Adds features.codex_hooks=true to ~/.codex/config.toml (with prompt)
#
# USAGE:
#   ./install.sh              # full interactive install (user-global)
#   ./install.sh --project    # install agents to .codex/ in current directory
#   ./install.sh --no-hooks   # skip hooks install (they're experimental)
#   ./install.sh --dry-run    # print planned actions, do not execute
#   ./install.sh --check      # verify existing install matches expected; exit 0=OK
#   ./install.sh --help       # show this message and exit
#
# OPTIONS:
#   --user        Install agents/hooks to ~/.codex/ (default)
#   --project     Install agents to .codex/ in current working directory
#   --no-hooks    Skip hooks installation
#   --dry-run     Print what would be done without making any changes
#   --check       Verify current install; exit 0 if correct, 1 otherwise
#   --help        Show this message and exit
#
# ENV OVERRIDES:
#   AGENT_TOOLKIT_DIR   Override auto-detected agent-toolkit repo root
#
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

DRY_RUN=false
CHECK_MODE=false
SKIP_HOOKS=false
SCOPE="user"   # "user" or "project"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)   DRY_RUN=true; shift ;;
    --check)     CHECK_MODE=true; shift ;;
    --no-hooks)  SKIP_HOOKS=true; shift ;;
    --user)      SCOPE="user"; shift ;;
    --project)   SCOPE="project"; shift ;;
    --help|-h)
      sed -n '/^# ===/,/^# ===/p' "$0"
      exit 0
      ;;
    *)
      echo "ERROR: unknown argument: $1" >&2
      echo "Usage: $0 [--user|--project] [--no-hooks] [--dry-run|--check]" >&2
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
# Resolve REPO_DIR
# ---------------------------------------------------------------------------

_default_repo_dir="$(cd "$(dirname "$0")/../.." && pwd)"
REPO_DIR="${AGENT_TOOLKIT_DIR:-$_default_repo_dir}"

# Reject path-traversal
case "$REPO_DIR" in
  *..*)
    echo "ERROR: REPO_DIR contains '..' segments — refusing for safety" >&2
    exit 1
    ;;
esac

if [[ ! -d "${REPO_DIR}/openai-codex" ]]; then
  echo "ERROR: REPO_DIR '${REPO_DIR}' does not contain openai-codex/ subdirectory." >&2
  echo "       Set AGENT_TOOLKIT_DIR to the correct agent-toolkit repo root." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Source and destination paths
# ---------------------------------------------------------------------------

AGENTS_SRC="${REPO_DIR}/openai-codex/agents"
HOOKS_SRC="${REPO_DIR}/openai-codex/hooks"
CONFIG_TEMPLATE="${REPO_DIR}/openai-codex/config.toml.template"

if [[ "$SCOPE" == "project" ]]; then
  AGENTS_DEST="${PWD}/.codex/agents"
  HOOKS_JSON_DEST="${HOME}/.codex/hooks.json"   # hooks.json always goes to user-global, sibling to config.toml
  CODEX_CONFIG="${HOME}/.codex/config.toml"
else
  AGENTS_DEST="${HOME}/.codex/agents"
  HOOKS_JSON_DEST="${HOME}/.codex/hooks.json"
  CODEX_CONFIG="${HOME}/.codex/config.toml"
fi

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

info()  { printf '  %-14s %s\n' "$1" "$2"; }
ok()    { printf '  [OK]         %s\n' "$1"; }
skip()  { printf '  [SKIP]       %s\n' "$1"; }
miss()  { printf '  [MISSING]    %s\n' "$1" >&2; }
err()   { printf 'ERROR: %s\n' "$1" >&2; }

run_or_dry() {
  # run_or_dry <description> <command...>
  local desc="$1"; shift
  if [[ "$DRY_RUN" == "true" ]]; then
    printf '  [dry-run] %s\n' "$desc"
  else
    "$@"
  fi
}

# ---------------------------------------------------------------------------
# Print header
# ---------------------------------------------------------------------------

echo ""
echo "agent-toolkit: openai-codex install.sh"
echo "======================================="
echo "REPO_DIR:    ${REPO_DIR}"
echo "Scope:       ${SCOPE} (agents -> ${AGENTS_DEST})"
echo "Hooks JSON:  ${HOOKS_JSON_DEST}"
echo "Config:      ${CODEX_CONFIG}"
echo ""

# ---------------------------------------------------------------------------
# --check mode
# ---------------------------------------------------------------------------

if [[ "$CHECK_MODE" == "true" ]]; then
  echo "Mode: CHECK (read-only)"
  echo ""

  all_ok=true

  # --- Agents ---
  echo "Agents (${AGENTS_DEST}):"
  if [[ ! -d "${AGENTS_DEST}" ]]; then
    miss "agents directory not found: ${AGENTS_DEST}"
    all_ok=false
  else
    for toml_src in "${AGENTS_SRC}"/*.toml; do
      fname="$(basename "$toml_src")"
      dest_path="${AGENTS_DEST}/${fname}"
      if [[ -L "${dest_path}" ]]; then
        current_target="$(readlink "${dest_path}")"
        if [[ "${current_target}" == "${toml_src}" ]]; then
          ok "${fname} -> ${current_target}"
        else
          printf '  [DIFF]       %s\n' "${fname}" >&2
          printf '                 current:  %s\n' "${current_target}" >&2
          printf '                 expected: %s\n' "${toml_src}" >&2
          all_ok=false
        fi
      elif [[ -f "${dest_path}" ]]; then
        skip "${fname} (copy — not a symlink; run install to convert)"
      else
        miss "${fname}"
        all_ok=false
      fi
    done
  fi

  echo ""

  # --- Hooks (only if not skipped) ---
  if [[ "$SKIP_HOOKS" == "false" ]]; then
    echo "Hooks JSON (${HOOKS_JSON_DEST}):"
    hooks_json_src="${HOOKS_SRC}/hooks.json"
    if [[ -L "${HOOKS_JSON_DEST}" ]]; then
      current_target="$(readlink "${HOOKS_JSON_DEST}")"
      if [[ "${current_target}" == "${hooks_json_src}" ]]; then
        ok "hooks.json -> ${current_target}"
      else
        printf '  [DIFF]       hooks.json\n' >&2
        printf '                 current:  %s\n' "${current_target}" >&2
        printf '                 expected: %s\n' "${hooks_json_src}" >&2
        all_ok=false
      fi
    elif [[ -f "${HOOKS_JSON_DEST}" ]]; then
      skip "hooks.json (copy — not a symlink; run install to convert)"
    else
      miss "hooks.json not found: ${HOOKS_JSON_DEST}"
      all_ok=false
    fi
    echo ""
  fi

  # --- Config entries ---
  echo "Config (${CODEX_CONFIG}):"
  if [[ ! -f "${CODEX_CONFIG}" ]]; then
    miss "config.toml not found — skills.config entries not installed"
    all_ok=false
  else
    skills_count="$(grep -c '^\[\[skills\.config\]\]' "${CODEX_CONFIG}" 2>/dev/null || true)"
    if [[ "${skills_count:-0}" -gt 0 ]]; then
      ok "${skills_count} [[skills.config]] entries present"
    else
      miss "no [[skills.config]] entries found in ${CODEX_CONFIG}"
      all_ok=false
    fi

    hooks_enabled="$(grep -c 'codex_hooks\s*=\s*true' "${CODEX_CONFIG}" 2>/dev/null || true)"
    if [[ "${hooks_enabled:-0}" -gt 0 ]]; then
      ok "features.codex_hooks = true"
    else
      skip "features.codex_hooks not set (optional)"
    fi
  fi

  echo ""
  if [[ "$all_ok" == "true" ]]; then
    echo "All checks passed. OK."
    exit 0
  else
    echo "One or more checks failed." >&2
    exit 1
  fi
fi

# ---------------------------------------------------------------------------
# --dry-run / APPLY mode: pre-flight checks
# ---------------------------------------------------------------------------

if [[ "$DRY_RUN" == "true" ]]; then
  echo "Mode: DRY RUN (no changes will be made)"
else
  echo "Mode: APPLY"
fi
echo ""

# Validate source directories exist
preflight_ok=true
if [[ ! -d "${AGENTS_SRC}" ]]; then
  err "Agents source directory not found: ${AGENTS_SRC}"
  preflight_ok=false
fi
if [[ "$SKIP_HOOKS" == "false" && ! -d "${HOOKS_SRC}" ]]; then
  err "Hooks source directory not found: ${HOOKS_SRC}"
  preflight_ok=false
fi
if [[ ! -f "${CONFIG_TEMPLATE}" ]]; then
  err "Config template not found: ${CONFIG_TEMPLATE}"
  preflight_ok=false
fi
if [[ "$preflight_ok" != "true" ]]; then
  echo "" >&2
  echo "Pre-flight failed. Verify REPO_DIR is set correctly." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Step 1: Install agents
# ---------------------------------------------------------------------------

echo "=== Step 1: Agents ==="
echo ""

if [[ "$DRY_RUN" == "false" && ! -d "${AGENTS_DEST}" ]]; then
  mkdir -p "${AGENTS_DEST}"
  echo "  created: ${AGENTS_DEST}"
fi

for toml_src in "${AGENTS_SRC}"/*.toml; do
  fname="$(basename "$toml_src")"
  dest_path="${AGENTS_DEST}/${fname}"

  if [[ "$DRY_RUN" == "true" ]]; then
    if [[ -L "${dest_path}" ]]; then
      current="$(readlink "${dest_path}")"
      if [[ "$current" == "$toml_src" ]]; then
        printf '  unchanged:   %s (already symlinked)\n' "${fname}"
      else
        printf '  would update: %s\n' "${fname}"
        printf '    before: %s\n' "${current}"
        printf '    after:  %s\n' "${toml_src}"
      fi
    else
      printf '  would create symlink: %s -> %s\n' "${dest_path}" "${toml_src}"
    fi
    continue
  fi

  # Guard: abort if a real file occupies the link path
  if [[ -e "${dest_path}" && ! -L "${dest_path}" ]]; then
    echo "  SKIP (real file exists — not overwriting): ${dest_path}" >&2
    continue
  fi

  before="(none)"
  [[ -L "${dest_path}" ]] && before="$(readlink "${dest_path}")"

  ln -sfn "${toml_src}" "${dest_path}"
  after="$(readlink "${dest_path}")"

  if [[ "$before" == "$after" ]]; then
    printf '  unchanged:   %s\n' "${fname}"
  else
    printf '  installed:   %s -> %s\n' "${fname}" "${after}"
  fi
done

echo ""

# ---------------------------------------------------------------------------
# Step 2: Install hooks
# ---------------------------------------------------------------------------

echo "=== Step 2: Hooks ==="
echo ""

if [[ "$SKIP_HOOKS" == "true" ]]; then
  echo "  Skipped (--no-hooks passed)."
  echo ""
else
  echo "  NOTE: Codex hooks are experimental. They require Codex CLI v0.120.0+."
  echo "        You will be prompted before enabling features.codex_hooks in config."
  echo "        hooks.json stays symlinked to ~/.codex/hooks.json (sibling to config.toml)"
  echo "        per the official spec; any remaining Codex shell files are thin adapters"
  echo "        that delegate to the canonical root hooks/ implementations."
  echo ""

  hooks_json_src="${HOOKS_SRC}/hooks.json"
  dest_path="${HOOKS_JSON_DEST}"

  if [[ "$DRY_RUN" == "true" ]]; then
    if [[ -L "${dest_path}" ]]; then
      current="$(readlink "${dest_path}")"
      if [[ "$current" == "$hooks_json_src" ]]; then
        printf '  unchanged:   hooks.json (already symlinked)\n'
      else
        printf '  would update: hooks.json\n'
        printf '    before: %s\n' "${current}"
        printf '    after:  %s\n' "${hooks_json_src}"
      fi
    else
      printf '  would create symlink: %s -> %s\n' "${dest_path}" "${hooks_json_src}"
    fi
  else
    # Ensure ~/.codex/ directory exists
    mkdir -p "$(dirname "${dest_path}")"

    # Guard: abort if a real file occupies the link path (hooks are sensitive — skip, don't overwrite)
    if [[ -e "${dest_path}" && ! -L "${dest_path}" ]]; then
      echo "  SKIP (real file exists — not overwriting): ${dest_path}" >&2
    else
      before="(none)"
      [[ -L "${dest_path}" ]] && before="$(readlink "${dest_path}")"

      ln -sfn "${hooks_json_src}" "${dest_path}"
      after="$(readlink "${dest_path}")"

      if [[ "$before" == "$after" ]]; then
        printf '  unchanged:   hooks.json\n'
      else
        printf '  installed:   hooks.json -> %s\n' "${after}"
      fi
    fi
  fi

  echo ""
fi

# ---------------------------------------------------------------------------
# Step 3: Append [[skills.config]] entries to ~/.codex/config.toml
# ---------------------------------------------------------------------------

echo "=== Step 3: Skills config entries ==="
echo ""

# Extract just the [[skills.config]] blocks from the template
# (lines from first [[skills.config]] up to the MCP section comment)
_skills_block="$(awk '/^\[\[skills\.config\]\]/{found=1} found && /^# -+$/{if(found>1){exit}} found{found++;print}' "${CONFIG_TEMPLATE}")"
_skills_entry_count="$(echo "${_skills_block}" | grep -c '^\[\[skills\.config\]\]' || true)"

if [[ "$DRY_RUN" == "true" ]]; then
  echo "  Would append ${_skills_entry_count} [[skills.config]] entries to ${CODEX_CONFIG}"
  echo "  (after prompting for confirmation)"
  echo ""
else
  # Check if already installed
  if [[ -f "${CODEX_CONFIG}" ]]; then
    existing_count="$(grep -c '^\[\[skills\.config\]\]' "${CODEX_CONFIG}" 2>/dev/null || true)"
  else
    existing_count=0
  fi

  if [[ "${existing_count:-0}" -gt 0 ]]; then
    echo "  ${existing_count} [[skills.config]] entries already present in ${CODEX_CONFIG}."
    echo "  Skipping to avoid duplicates. Remove existing entries first if you want to reinstall."
    echo ""
  else
    # Count entries in template for the prompt
    _template_count="$(grep -c '^\[\[skills\.config\]\]' "${CONFIG_TEMPLATE}" || true)"
    echo "  This will append ${_template_count} [[skills.config]] entries to ${CODEX_CONFIG}."
    echo "  The file will NOT be overwritten — entries are appended."
    echo ""
    printf '  Append %s [[skills.config]] entries? [y/N] ' "${_template_count}"
    read -r _confirm

    if [[ "${_confirm}" =~ ^[Yy]$ ]]; then
      # Ensure config file and directory exist
      mkdir -p "$(dirname "${CODEX_CONFIG}")"
      if [[ ! -f "${CODEX_CONFIG}" ]]; then
        touch "${CODEX_CONFIG}"
        echo "  created: ${CODEX_CONFIG}"
      fi

      # Escape sed metacharacters in REPO_DIR before interpolation.
      # Characters |, \, and & have special meaning in sed replacement strings.
      REPO_DIR_ESCAPED=$(printf '%s' "$REPO_DIR" | sed 's|[\\&|]|\\&|g')

      # Replace ${AGENT_TOOLKIT_DIR} placeholder with actual REPO_DIR
      _skills_to_append="$(sed "s|\${AGENT_TOOLKIT_DIR}|${REPO_DIR_ESCAPED}|g" "${CONFIG_TEMPLATE}" \
        | awk '/^\[\[skills\.config\]\]/{found=1} found && /^# -+$/{found=0} found{print}')"

      printf '\n# ---- agent-toolkit skills (added by install.sh) ----\n' >> "${CODEX_CONFIG}"
      printf '%s\n' "${_skills_to_append}" >> "${CODEX_CONFIG}"
      echo "  Appended ${_template_count} [[skills.config]] entries to ${CODEX_CONFIG}."
    else
      echo "  Skipped. Run with --dry-run to preview, or re-run and confirm to apply."
    fi
    echo ""
  fi
fi

# ---------------------------------------------------------------------------
# Step 4: Enable features.codex_hooks
# ---------------------------------------------------------------------------

if [[ "$SKIP_HOOKS" == "false" ]]; then
  echo "=== Step 4: Enable codex_hooks feature ==="
  echo ""

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "  Would prompt: Add features.codex_hooks=true to ${CODEX_CONFIG}? [y/N]"
    echo ""
  else
    _hooks_enabled=false
    if [[ -f "${CODEX_CONFIG}" ]]; then
      grep -q 'codex_hooks\s*=\s*true' "${CODEX_CONFIG}" 2>/dev/null && _hooks_enabled=true || true
    fi

    if [[ "$_hooks_enabled" == "true" ]]; then
      echo "  features.codex_hooks = true already set. Skipping."
      echo ""
    else
      echo "  Codex hooks enable pre/post-tool callbacks for audit and protection."
      echo "  This adds [features] / codex_hooks = true to ${CODEX_CONFIG}."
      echo ""
      printf '  Add features.codex_hooks = true to %s? [y/N] ' "${CODEX_CONFIG}"
      read -r _confirm_hooks

      if [[ "${_confirm_hooks}" =~ ^[Yy]$ ]]; then
        mkdir -p "$(dirname "${CODEX_CONFIG}")"
        if [[ ! -f "${CODEX_CONFIG}" ]]; then
          touch "${CODEX_CONFIG}"
        fi
        printf '\n[features]\ncodex_hooks = true\n' >> "${CODEX_CONFIG}"
        echo "  Added features.codex_hooks = true to ${CODEX_CONFIG}."
      else
        echo "  Skipped. You can add it manually to ${CODEX_CONFIG}:"
        echo "    [features]"
        echo "    codex_hooks = true"
      fi
      echo ""
    fi
  fi
fi

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

echo "======================================="
echo "Done."
echo ""
echo "Next steps:"
echo "  1. Run './install.sh --check' to verify all components are in place."
echo "  2. Restart Codex CLI to pick up the new agents and skills."
echo "  3. If skills are not discovered, verify your config.toml paths are correct."
echo "  4. Re-run this script after updating the toolkit to pick up new agents."
echo ""
