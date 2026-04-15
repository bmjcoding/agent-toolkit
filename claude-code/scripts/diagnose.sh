#!/usr/bin/env bash
# diagnose.sh — Control-plane security posture report
# Read-only. Writes nothing. Safe to run at any time.
# Addresses SRE finding #6: no way to verify hardening is active.
set -uo pipefail

# ---------------------------------------------------------------------------
# Color helpers (fall back to plain text if tput unavailable)
# ---------------------------------------------------------------------------
if command -v tput >/dev/null 2>&1 && tput colors >/dev/null 2>&1; then
  BOLD=$(tput bold)
  RED=$(tput setaf 1)
  YLW=$(tput setaf 3)
  GRN=$(tput setaf 2)
  CYN=$(tput setaf 6)
  RST=$(tput sgr0)
else
  BOLD='' RED='' YLW='' GRN='' CYN='' RST=''
fi

PASS="${GRN}PASS${RST}"
WARN="${YLW}WARN${RST}"
FAIL="${RED}FAIL${RST}"
INFO="${CYN}INFO${RST}"

# ---------------------------------------------------------------------------
# Dependency check — jq required
# ---------------------------------------------------------------------------
if ! command -v jq >/dev/null 2>&1; then
  echo "${RED}FATAL: jq is not installed. Install via: brew install jq${RST}" >&2
  exit 1
fi

SETTINGS="$HOME/.claude/settings.json"
PROTECT="$HOME/.claude/hooks/protect-config/protect-config.sh"
INTEGRITY_SCRIPT="$HOME/.claude/integrity-check.sh"
DESKTOP_CFG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
AGENTS_LOG="$HOME/.claude/.orchestrator/logs/agents.log"
AGENTS_DIR="$HOME/.claude/agents"
LOCK_DIR="$HOME/.claude/.orchestrator/lock.d"

# Width for the label column
W=40

row() {
  local label="$1" status="$2" detail="${3:-}"
  printf "  %-${W}s %s" "$label" "$status"
  [[ -n "$detail" ]] && printf "  %s" "$detail"
  printf "\n"
}

header() {
  echo ""
  echo "${BOLD}${CYN}== $1 ==${RST}"
}

# ---------------------------------------------------------------------------
# Header
# ---------------------------------------------------------------------------
echo ""
echo "${BOLD}Claude Code Control-Plane Diagnostics${RST}"
echo "  Generated: $(date -Iseconds 2>/dev/null || date)"
echo "  Host:      $(hostname -s 2>/dev/null || hostname)"

# ---------------------------------------------------------------------------
# 1. Sandbox status
# ---------------------------------------------------------------------------
header "1. Sandbox Status"
if [[ -f "$SETTINGS" ]]; then
  SANDBOX_VAL=$(jq -r 'if has("sandbox") then (.sandbox.enabled | tostring) else "absent" end' "$SETTINGS" 2>/dev/null)
  case "$SANDBOX_VAL" in
    true)   row "sandbox.enabled" "$PASS" "value=true" ;;
    false)  row "sandbox.enabled" "$FAIL" "value=false (hardening gap!)" ;;
    absent) row "sandbox.enabled" "$WARN" "key absent in settings.json" ;;
    *)      row "sandbox.enabled" "$WARN" "unexpected value: $SANDBOX_VAL" ;;
  esac
else
  row "sandbox.enabled" "$FAIL" "settings.json not found at $SETTINGS"
fi

# ---------------------------------------------------------------------------
# 2. Deny list size
# ---------------------------------------------------------------------------
header "2. Deny List Coverage"
if [[ -f "$SETTINGS" ]]; then
  DENY_COUNT=$(jq '.permissions.deny | length' "$SETTINGS" 2>/dev/null || echo 0)
  if [[ "$DENY_COUNT" -ge 38 ]]; then
    row "permissions.deny count" "$PASS" "count=$DENY_COUNT (expected>=38)"
  elif [[ "$DENY_COUNT" -gt 0 ]]; then
    row "permissions.deny count" "$WARN" "count=$DENY_COUNT (expected>=38, may be incomplete)"
  else
    row "permissions.deny count" "$FAIL" "count=$DENY_COUNT (deny list missing or empty)"
  fi
else
  row "permissions.deny count" "$FAIL" "settings.json not found"
fi

# ---------------------------------------------------------------------------
# 3. protect-config.sh status
# ---------------------------------------------------------------------------
header "3. Protect-Config Hook"
if [[ -f "$PROTECT" ]]; then
  row "file exists" "$PASS" "$PROTECT"

  # Executable bit
  if [[ -x "$PROTECT" ]]; then
    row "executable bit" "$PASS" ""
  else
    row "executable bit" "$WARN" "not executable (hook may not fire)"
  fi

  # Version line
  VERSION_LINE=$(grep -m1 '^# version:' "$PROTECT" 2>/dev/null || true)
  if [[ -n "$VERSION_LINE" ]]; then
    row "version line" "$PASS" "$VERSION_LINE"
  else
    row "version line" "$WARN" "no '# version:' line found"
  fi

  # SHA256
  if command -v shasum >/dev/null 2>&1; then
    HASH=$(shasum -a 256 "$PROTECT" 2>/dev/null | awk '{print $1}')
  elif command -v sha256sum >/dev/null 2>&1; then
    HASH=$(sha256sum "$PROTECT" 2>/dev/null | awk '{print $1}')
  else
    HASH="(sha256 tool not available)"
  fi
  row "SHA256" "$INFO" "$HASH"
else
  row "protect-config.sh" "$FAIL" "not found at $PROTECT"
fi

# ---------------------------------------------------------------------------
# 4. PROTECTED regex coverage — key tokens
# ---------------------------------------------------------------------------
header "4. PROTECTED Regex Coverage (protect-config.sh)"
if [[ -f "$PROTECT" ]]; then
  for token in 'settings\.json' 'hooks/' 'CLAUDE\.md' 'agents/'; do
    if grep -q "$token" "$PROTECT" 2>/dev/null; then
      row "token: $token" "$PASS" "found in protect-config.sh"
    else
      row "token: $token" "$FAIL" "MISSING from protect-config.sh"
    fi
  done
else
  row "PROTECTED regex check" "$FAIL" "protect-config.sh not found — skipping"
fi

# ---------------------------------------------------------------------------
# 5. Bypass mode state
# ---------------------------------------------------------------------------
header "5. Bypass Permission Mode"
if [[ -f "$DESKTOP_CFG" ]]; then
  BYPASS_VAL=$(jq -r 'if .preferences | has("bypassPermissionsModeEnabled") then (.preferences.bypassPermissionsModeEnabled | tostring) else "absent" end' "$DESKTOP_CFG" 2>/dev/null)
  case "$BYPASS_VAL" in
    false)  row "bypassPermissionsModeEnabled" "$PASS" "value=false" ;;
    true)   row "bypassPermissionsModeEnabled" "$FAIL" "value=true — ALL .claude hardening defeatable in Desktop sessions" ;;
    absent) row "bypassPermissionsModeEnabled" "$PASS" "key absent (defaults to disabled)" ;;
    *)      row "bypassPermissionsModeEnabled" "$WARN" "unexpected value: $BYPASS_VAL" ;;
  esac
else
  row "bypassPermissionsModeEnabled" "$INFO" "claude_desktop_config.json not found (Desktop not installed?)"
fi

# ---------------------------------------------------------------------------
# 6. autoDreamEnabled state
# ---------------------------------------------------------------------------
header "6. autoDreamEnabled"
if [[ -f "$SETTINGS" ]]; then
  DREAM_VAL=$(jq -r 'if has("autoDreamEnabled") then (.autoDreamEnabled | tostring) else "absent" end' "$SETTINGS" 2>/dev/null)
  case "$DREAM_VAL" in
    false) row "autoDreamEnabled" "$PASS" "value=false (expected)" ;;
    true)  row "autoDreamEnabled" "$WARN" "value=true (unexpected — review settings)" ;;
    absent) row "autoDreamEnabled" "$INFO" "key absent in settings.json" ;;
    *)     row "autoDreamEnabled" "$INFO" "value=$DREAM_VAL" ;;
  esac
else
  row "autoDreamEnabled" "$FAIL" "settings.json not found"
fi

# ---------------------------------------------------------------------------
# 7. Recent agent log tail
# ---------------------------------------------------------------------------
header "7. Recent Agent Activity (agents.log)"
if [[ -f "$AGENTS_LOG" ]]; then
  echo ""
  tail -5 "$AGENTS_LOG" 2>/dev/null | while IFS= read -r line; do
    printf "    %s\n" "$line"
  done
  echo ""
  row "agents.log" "$PASS" "found — last 5 lines shown above"
else
  row "agents.log" "$INFO" "not found at $AGENTS_LOG (no orchestration runs yet?)"
fi

# ---------------------------------------------------------------------------
# 8. Integrity check script presence
# ---------------------------------------------------------------------------
header "8. Integrity Check Script"
if [[ -f "$INTEGRITY_SCRIPT" ]]; then
  if [[ -x "$INTEGRITY_SCRIPT" ]]; then
    row "integrity-check.sh" "$PASS" "deployed and executable"
  else
    row "integrity-check.sh" "$WARN" "deployed but not executable"
  fi
else
  row "integrity-check.sh" "$WARN" "not deployed at $INTEGRITY_SCRIPT"
fi

# ---------------------------------------------------------------------------
# 9. Agent boundary coverage
# ---------------------------------------------------------------------------
header "9. Agent Untrusted Data Boundary Coverage"
if [[ -d "$AGENTS_DIR" ]]; then
  TOTAL_AGENTS=$(ls -1 "$AGENTS_DIR"/*.md 2>/dev/null | wc -l | tr -d '[:space:]')
  BOUNDARY_COUNT=$(grep -l "Untrusted Data Boundary" "$AGENTS_DIR"/*.md 2>/dev/null | wc -l | tr -d '[:space:]')

  if [[ "$TOTAL_AGENTS" -eq 0 ]]; then
    row "agent boundary coverage" "$WARN" "no .md files found in $AGENTS_DIR"
  else
    if [[ "$BOUNDARY_COUNT" -eq "$TOTAL_AGENTS" ]]; then
      row "agent boundary coverage" "$PASS" "${BOUNDARY_COUNT}/${TOTAL_AGENTS} agents have boundary section"
    elif [[ "$BOUNDARY_COUNT" -gt 0 ]]; then
      MISSING=$((TOTAL_AGENTS - BOUNDARY_COUNT))
      row "agent boundary coverage" "$WARN" "${BOUNDARY_COUNT}/${TOTAL_AGENTS} covered (${MISSING} missing boundary)"
    else
      row "agent boundary coverage" "$FAIL" "0/${TOTAL_AGENTS} agents have boundary section"
    fi
  fi
else
  row "agent boundary coverage" "$FAIL" "agents directory not found at $AGENTS_DIR"
fi

# ---------------------------------------------------------------------------
# 10. Lock status
# ---------------------------------------------------------------------------
header "10. Orchestrator Lock Status"
if [[ -d "$LOCK_DIR" ]]; then
  LOCK_FILES=$(ls -1 "$LOCK_DIR" 2>/dev/null | wc -l | tr -d '[:space:]')
  if [[ "$LOCK_FILES" -gt 0 ]]; then
    # Check age of lock files — stale if older than 30 minutes
    STALE_COUNT=0
    NOW=$(date +%s)
    while IFS= read -r lf; do
      [[ -z "$lf" ]] && continue
      MTIME=$(stat -f "%m" "$LOCK_DIR/$lf" 2>/dev/null || stat -c "%Y" "$LOCK_DIR/$lf" 2>/dev/null || echo 0)
      AGE=$(( NOW - MTIME ))
      if [[ "$AGE" -gt 1800 ]]; then
        STALE_COUNT=$((STALE_COUNT + 1))
      fi
    done < <(ls -1 "$LOCK_DIR" 2>/dev/null)

    if [[ "$STALE_COUNT" -gt 0 ]]; then
      row "lock.d" "$WARN" "${LOCK_FILES} lock file(s), ${STALE_COUNT} stale (>30m old)"
    else
      row "lock.d" "$INFO" "${LOCK_FILES} active lock file(s) present"
    fi
  else
    row "lock.d" "$PASS" "lock.d exists, no active locks"
  fi
else
  row "lock.d" "$PASS" "no lock directory (no active pipeline)"
fi

# ---------------------------------------------------------------------------
# Footer
# ---------------------------------------------------------------------------
echo ""
echo "${BOLD}--- End of diagnostics ---${RST}"
echo ""

exit 0
