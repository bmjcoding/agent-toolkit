#!/usr/bin/env bash
# integrity-check.sh — SHA-256 integrity monitor for Claude Code control-plane files
# Usage: ./integrity-check.sh [baseline|verify|auto]
set -uo pipefail

CLAUDE_HOME="${HOME}/.claude"
SECURITY_DIR="${CLAUDE_HOME}/.security"
BASELINE_FILE="${SECURITY_DIR}/integrity-baseline.sha256"

# ── Color helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

ok()     { printf "${GREEN}OK${RESET}      %s\n" "$1"; }
fail()   { printf "${RED}MODIFIED${RESET} %s\n" "$1"; }
added()  { printf "${YELLOW}ADDED${RESET}    %s\n" "$1"; }
deleted(){ printf "${YELLOW}DELETED${RESET}  %s\n" "$1"; }
info()   { printf "${CYAN}%s${RESET}\n" "$1"; }
header() { printf "\n${BOLD}%s${RESET}\n" "$1"; }

# ── Resolve control-plane file list ─────────────────────────────────────────
# Follow symlinks so we hash real content, not the symlink target path.
# Uses -H to follow the initial symlink in the path but not beyond.
collect_files() {
  local files=()

  # Core config files (directly in ~/.claude)
  local core=(
    "${CLAUDE_HOME}/settings.json"
    "${CLAUDE_HOME}/CLAUDE.md"
  )
  for f in "${core[@]}"; do
    [ -f "$f" ] && files+=("$f")
  done

  # Hook scripts — follow the hooks symlink -> toolkit/hooks/<name>/<name>.sh
  if [ -d "${CLAUDE_HOME}/hooks" ]; then
    while IFS= read -r -d '' f; do
      files+=("$f")
    done < <(find -L "${CLAUDE_HOME}/hooks" -maxdepth 2 -name "*.sh" -type f -print0 2>/dev/null | sort -z)
  fi

  # Agent definitions — follow agents symlink -> toolkit/claude-code/agents/<name>.md
  if [ -d "${CLAUDE_HOME}/agents" ]; then
    while IFS= read -r -d '' f; do
      files+=("$f")
    done < <(find -L "${CLAUDE_HOME}/agents" -maxdepth 1 -name "*.md" ! -name "CHANGELOG.md" -type f -print0 2>/dev/null | sort -z)
  fi

  # Skill definitions — follow skills symlink -> skills/<name>/SKILL.md
  if [ -d "${CLAUDE_HOME}/skills" ]; then
    while IFS= read -r -d '' f; do
      files+=("$f")
    done < <(find -L "${CLAUDE_HOME}/skills" -maxdepth 2 -name "SKILL.md" -type f -print0 2>/dev/null | sort -z)
  fi

  # Command definitions — follow commands symlink -> toolkit/commands/<name>/<name>.md
  if [ -d "${CLAUDE_HOME}/commands" ]; then
    while IFS= read -r -d '' f; do
      files+=("$f")
    done < <(find -L "${CLAUDE_HOME}/commands" -maxdepth 2 -name "*.md" ! -name "CHANGELOG.md" -type f -print0 2>/dev/null | sort -z)
  fi

  # Rule definitions — follow rules symlink -> claude-code/rules/<name>/<name>.md
  if [ -d "${CLAUDE_HOME}/rules" ]; then
    while IFS= read -r -d '' f; do
      files+=("$f")
    done < <(find -L "${CLAUDE_HOME}/rules" -maxdepth 2 -name "*.md" ! -name "CHANGELOG.md" -type f -print0 2>/dev/null | sort -z)
  fi

  printf '%s\n' "${files[@]}"
}

# ── Hash a single file ───────────────────────────────────────────────────────
hash_file() {
  local path="$1"
  # macOS: shasum -a 256; Linux: sha256sum — both output "hash  path"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$path" 2>/dev/null | awk '{print $1}'
  else
    shasum -a 256 "$path" 2>/dev/null | awk '{print $1}'
  fi
}

# ── BASELINE mode ────────────────────────────────────────────────────────────
cmd_baseline() {
  header "Computing integrity baseline..."

  mkdir -p "${SECURITY_DIR}"
  chmod 700 "${SECURITY_DIR}"

  local tmpfile=""
  tmpfile="$(mktemp)"
  trap 'rm -f "${tmpfile:-}"' EXIT

  local count=0
  while IFS= read -r filepath; do
    [ -z "$filepath" ] && continue
    local hash
    hash="$(hash_file "$filepath")"
    if [ -n "$hash" ]; then
      printf '%s  %s\n' "$hash" "$filepath" >> "$tmpfile"
      printf "  hashed: %s\n" "$filepath"
      (( count++ )) || true
    else
      printf "  ${YELLOW}skip (unreadable):${RESET} %s\n" "$filepath"
    fi
  done < <(collect_files)

  # Write header + hashes atomically
  {
    printf '# Claude Code control-plane integrity baseline\n'
    printf '# Generated: %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    printf '# Files: %d\n' "$count"
    printf '#\n'
    cat "$tmpfile"
  } > "${BASELINE_FILE}"

  chmod 600 "${BASELINE_FILE}"
  info "\nBaseline written: ${BASELINE_FILE}"
  info "Files hashed: ${count}"
}

# ── VERIFY mode ──────────────────────────────────────────────────────────────
# Returns:
#   0  — all clean
#   1  — mismatches found
cmd_verify() {
  if [ ! -f "${BASELINE_FILE}" ]; then
    printf "${RED}ERROR:${RESET} No baseline found at %s\n" "${BASELINE_FILE}" >&2
    printf "Run: %s baseline\n" "$0" >&2
    return 2
  fi

  header "Verifying control-plane integrity..."

  local mismatches=0
  declare -A baseline_hashes  # path -> hash from baseline
  declare -A baseline_seen    # path -> 1, for ADDED detection

  # Load baseline into associative array (skip comment lines)
  while IFS= read -r line; do
    [[ "$line" =~ ^# ]] && continue
    [ -z "$line" ] && continue
    local b_hash b_path
    b_hash="${line%% *}"
    b_path="${line#* }"
    # Strip leading spaces that appear between hash and path
    b_path="${b_path## }"
    baseline_hashes["$b_path"]="$b_hash"
    baseline_seen["$b_path"]=0
  done < "${BASELINE_FILE}"

  # Check current files against baseline
  while IFS= read -r filepath; do
    [ -z "$filepath" ] && continue

    if [ ! -f "$filepath" ]; then
      # File was in our scan set but doesn't exist — shouldn't happen here
      continue
    fi

    if [[ -v baseline_hashes["$filepath"] ]]; then
      # Known file — verify hash
      baseline_seen["$filepath"]=1
      local current_hash
      current_hash="$(hash_file "$filepath")"
      if [ "${baseline_hashes[$filepath]}" = "$current_hash" ]; then
        ok "$filepath"
      else
        fail "$filepath"
        (( mismatches++ )) || true
      fi
    else
      # File not in baseline — ADDED
      added "$filepath"
      (( mismatches++ )) || true
    fi
  done < <(collect_files)

  # Check for DELETED files (in baseline but not seen during scan)
  for b_path in "${!baseline_hashes[@]}"; do
    if [ "${baseline_seen[$b_path]:-0}" -eq 0 ]; then
      deleted "$b_path"
      (( mismatches++ )) || true
    fi
  done

  if [ "$mismatches" -eq 0 ]; then
    printf "\n${GREEN}All control-plane files are clean.${RESET}\n"
    return 0
  else
    printf "\n${RED}%d mismatch(es) detected.${RESET}\n" "$mismatches"
    return 1
  fi
}

# ── AUTO mode ────────────────────────────────────────────────────────────────
cmd_auto() {
  if cmd_verify; then
    return 0
  fi

  printf "\n"
  read -r -p "Accept changes and update baseline? (y/n): " answer
  case "$answer" in
    y|Y|yes|YES)
      cmd_baseline
      printf "${GREEN}Baseline updated.${RESET}\n"
      return 0
      ;;
    *)
      printf "${RED}Changes not accepted. Baseline unchanged.${RESET}\n"
      return 1
      ;;
  esac
}

# ── WARN wrapper (advisory, non-blocking) ────────────────────────────────────
# For use in shell init / hooks — prints to stderr, exits 0.
cmd_warn() {
  if [ ! -f "${BASELINE_FILE}" ]; then
    return 0  # No baseline yet — advisory only, don't block
  fi

  # Capture verify output without printing it
  local output exit_code
  output="$(cmd_verify 2>&1)" || exit_code=$?
  exit_code="${exit_code:-0}"

  if [ "$exit_code" -ne 0 ]; then
    printf "${YELLOW}[integrity-check] WARNING: Control-plane file changes detected:${RESET}\n" >&2
    # Filter to only mismatch lines for brevity
    printf '%s\n' "$output" | grep -E '^(MODIFIED|ADDED|DELETED)' >&2 || true
    printf "${YELLOW}[integrity-check] Run: %s auto  — to review and accept/reject${RESET}\n" "$0" >&2
  fi
  return 0  # Advisory only — never block
}

# ── Entry point ──────────────────────────────────────────────────────────────
MODE="${1:-}"

case "$MODE" in
  baseline) cmd_baseline ;;
  verify)   cmd_verify ;;
  auto)     cmd_auto ;;
  warn)     cmd_warn ;;
  *)
    printf "${BOLD}Usage:${RESET} %s [baseline|verify|auto|warn]\n\n" "$(basename "$0")"
    printf "  ${BOLD}baseline${RESET}  — Hash all control-plane files and write ~/.claude/.security/integrity-baseline.sha256\n"
    printf "  ${BOLD}verify${RESET}    — Compare current files to baseline; exit 0=clean, 1=mismatch\n"
    printf "  ${BOLD}auto${RESET}      — Verify, then interactively offer to update baseline on mismatch\n"
    printf "  ${BOLD}warn${RESET}      — Advisory verify: prints WARNING to stderr, always exits 0 (safe for hooks)\n"
    printf "\n"
    printf "${BOLD}Suggested aliases:${RESET}\n"
    printf "  alias cc-baseline='%s baseline'\n" "$0"
    printf "  alias cc-verify='%s verify'\n" "$0"
    exit 1
    ;;
esac
