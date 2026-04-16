#!/usr/bin/env bash
# Handoff extraction hook for the Codex CLI surface (experimental)
# Requires: features.codex_hooks=true in ~/.codex/config.toml
# Note: Codex hooks stdin payload schema may differ from Claude Code's; validate in your environment.
#
# Claude Code env vars used: none directly — session/agent data arrives via stdin JSON.
# Codex mapping: Stop (agent/session stop event)
# Uncertainty: Codex's Stop event payload field names may differ from Claude Code's
# (.agent_id, .last_assistant_message, etc.). Check Codex docs for exact field names at runtime.
#
# Original purpose: SubagentStop hook — extract handoff JSON from agent's final message,
# validate against canonical schema, and write to .orchestrator/sessions/$SID/handoffs/<agent_id>.json
# when session-scoped mode is active, otherwise to the flat .orchestrator/handoffs/ fallback.
set -uo pipefail

# Resolve ORCH_BASE: session-scoped if session.id exists and is valid, else flat
SID=$(cat .orchestrator/session.id 2>/dev/null)
if [[ -n "$SID" && "$SID" =~ ^[0-9]{8}T[0-9]{6}$ ]]; then
  ORCH_BASE=".orchestrator/sessions/$SID"
else
  if [[ -n "$SID" ]]; then
    # Log invalid SID format for operational visibility
    echo "$(date -Iseconds) session_id_invalid sid=$SID reason=unexpected_format fallback=flat" >> .orchestrator/logs/agents.log 2>/dev/null || true
  fi
  ORCH_BASE=".orchestrator"
fi

HANDOFF_DIR="$ORCH_BASE/handoffs"
[[ -d "$HANDOFF_DIR" ]] || exit 0

# Read event data from stdin (documented hook input protocol)
INPUT=$(cat)
# CLAUD-004: sanitize AGENT_ID to prevent path traversal (CWE-22)
# Strip all chars except a-zA-Z0-9._- and limit to 64 chars; fall back to 'unknown' if empty
AGENT_ID=$(echo "$INPUT" | jq -r '.agent_id // .session_id // "unknown"' 2>/dev/null | tr -cd 'a-zA-Z0-9._-' | cut -c1-64)
AGENT_ID=${AGENT_ID:-unknown}
MSG=$(echo "$INPUT" | jq -r '.last_assistant_message // empty' 2>/dev/null)
[[ -z "$MSG" ]] && exit 0

# Extract content between ```handoff and ``` fences
JSON=$(echo "$MSG" | sed -n '/^```handoff$/,/^```$/{ /^```/d; p; }')
[[ -z "$JSON" ]] && exit 0

# LLM02-B: schema validation -- reject non-object handoffs before writing
TYPE=$(echo "$JSON" | jq -r 'type' 2>/dev/null)
if [ "$TYPE" != "object" ]; then
  mkdir -p "$HANDOFF_DIR/rejected"
  echo "$JSON" > "$HANDOFF_DIR/rejected/${AGENT_ID}-$(date +%s)-$(openssl rand -hex 4 2>/dev/null || echo 0000).json"
  mkdir -p "$ORCH_BASE/logs"
  echo "$(date -Iseconds) handoff_rejected agent=${AGENT_ID} reason=non-object type=${TYPE}" >> "$ORCH_BASE/logs/agents.log"
  exit 0
fi

# ---------------------------------------------------------------------------
# Canonical schema validation (Option A producer normalization rollout)
# Required fields: agent_id (string), status (enum), files_written (array),
#                  findings (array). Each findings element must be an object
#                  with severity (enum), file (string), and finding (string).
# Backwards compat: accept legacy findings_resolved format with a log warning.
# ---------------------------------------------------------------------------

validate_handoff() {
  local json="$1"
  local log_prefix="$(date -Iseconds)"
  mkdir -p "$ORCH_BASE/logs"

  # Extract agent_id from handoff JSON for use in reject filenames and log lines.
  # Fall back to the hook-level AGENT_ID if the field is missing.
  local hid
  hid=$(echo "$json" | jq -r '.agent_id // ""' 2>/dev/null)
  hid=$(echo "$hid" | tr -cd 'a-zA-Z0-9._-' | cut -c1-64)
  hid=${hid:-$AGENT_ID}

  # Helper: write to rejected dir and log, then return failure
  _reject() {
    local reason="$1"
    mkdir -p "$HANDOFF_DIR/rejected"
    echo "$json" > "$HANDOFF_DIR/rejected/${hid}-$(date +%s)-$(openssl rand -hex 4 2>/dev/null || echo 0000).json"
    echo "${log_prefix} handoff_rejected agent=${hid} ${reason}" >> "$ORCH_BASE/logs/agents.log"
    return 1
  }

  # 1. agent_id must be a non-empty string
  local agent_id_val
  agent_id_val=$(echo "$json" | jq -r 'if .agent_id | type == "string" and length > 0 then "ok" else "fail" end' 2>/dev/null)
  if [ "$agent_id_val" != "ok" ]; then
    _reject "reason=missing_required_field field=agent_id" && return 1 || return 1
  fi

  # 2. status must be one of the allowed enum values
  # Note: approve and revise are valid for plan-reviewer verdict handoffs
  local valid_statuses="done partial needs_human failed verification_only approve revise"
  local status_val
  status_val=$(echo "$json" | jq -r '.status // ""' 2>/dev/null)
  local status_ok=false
  for s in $valid_statuses; do
    [ "$status_val" = "$s" ] && status_ok=true && break
  done
  if [ "$status_ok" = false ]; then
    _reject "reason=invalid_status_enum field=status value=${status_val}" && return 1 || return 1
  fi

  # 3. files_written must be an array (can be empty)
  local fw_type
  fw_type=$(echo "$json" | jq -r '.files_written | type' 2>/dev/null)
  if [ "$fw_type" != "array" ]; then
    _reject "reason=missing_required_field field=files_written expected=array got=${fw_type}" && return 1 || return 1
  fi

  # 4. findings must be an array (can be empty)
  #    Backwards compat: if findings absent but findings_resolved present, accept with warning.
  local has_findings
  has_findings=$(echo "$json" | jq -r 'has("findings")' 2>/dev/null)
  local has_findings_resolved
  has_findings_resolved=$(echo "$json" | jq -r 'has("findings_resolved")' 2>/dev/null)

  if [ "$has_findings" != "true" ]; then
    if [ "$has_findings_resolved" = "true" ]; then
      echo "${log_prefix} handoff_legacy_format agent=${hid} format=findings_resolved" >> "$ORCH_BASE/logs/agents.log"
      # Accept legacy handoff — skip findings item validation
      return 0
    fi
    _reject "reason=missing_required_field field=findings expected=array" && return 1 || return 1
  fi

  local findings_type
  findings_type=$(echo "$json" | jq -r '.findings | type' 2>/dev/null)
  if [ "$findings_type" != "array" ]; then
    _reject "reason=missing_required_field field=findings expected=array got=${findings_type}" && return 1 || return 1
  fi

  # 5. If findings is non-empty, validate each element
  local findings_len
  findings_len=$(echo "$json" | jq -r '.findings | length' 2>/dev/null)
  if [ "$findings_len" -gt 0 ] 2>/dev/null; then
    local valid_severities="critical high medium low unspecified"
    local i=0
    while [ "$i" -lt "$findings_len" ]; do
      # Each element must be an object
      local elem_type
      elem_type=$(echo "$json" | jq -r ".findings[$i] | type" 2>/dev/null)
      if [ "$elem_type" != "object" ]; then
        _reject "reason=invalid_findings_item index=${i} expected=object got=${elem_type}" && return 1 || return 1
      fi

      # severity must be a non-empty string matching the enum
      local sev
      sev=$(echo "$json" | jq -r ".findings[$i].severity // \"\"" 2>/dev/null)
      local sev_ok=false
      for sv in $valid_severities; do
        [ "$sev" = "$sv" ] && sev_ok=true && break
      done
      if [ "$sev_ok" = false ]; then
        _reject "reason=invalid_findings_item index=${i} field=severity value=${sev}" && return 1 || return 1
      fi

      # file must be a string (non-empty)
      local file_val
      file_val=$(echo "$json" | jq -r "if .findings[$i].file | type == \"string\" and length > 0 then \"ok\" else \"fail\" end" 2>/dev/null)
      if [ "$file_val" != "ok" ]; then
        _reject "reason=invalid_findings_item index=${i} field=file expected=non-empty-string" && return 1 || return 1
      fi

      # finding must be a string (non-empty)
      local finding_val
      finding_val=$(echo "$json" | jq -r "if .findings[$i].finding | type == \"string\" and length > 0 then \"ok\" else \"fail\" end" 2>/dev/null)
      if [ "$finding_val" != "ok" ]; then
        _reject "reason=invalid_findings_item index=${i} field=finding expected=non-empty-string" && return 1 || return 1
      fi

      i=$((i + 1))
    done
  fi

  return 0
}

# Run validation; if it fails, skip the file-write but still emit agent_stop log
if ! validate_handoff "$JSON"; then
  # Rejection already logged inside validate_handoff; fall through to agent_stop log
  :
else
  # Validate JSON and write to handoff file
  echo "$JSON" | jq . > "$HANDOFF_DIR/${AGENT_ID}.json" 2>/dev/null || true
fi

# Log agent_stop event (merged from SubagentStop inline hook — stdin already consumed above)
# SRE-LOG-CORRELATION: emit both agent_id= and agent_type= so operators can grep either field
# Format: JSON object to match dispatcher-written format (parse-metrics.py compatible)
mkdir -p "$ORCH_BASE/logs"
AGENT_TYPE=$(echo "$INPUT" | jq -r '.agent_type // .agent_id // "unknown"' 2>/dev/null)
LOG_LINE=$(echo "$INPUT" | jq -c --arg ts "$(date -Iseconds)" --arg aid "$AGENT_ID" \
  '{agent_id: $aid, agent_type: (.agent_type // .agent_id // "unknown"), tokens: (.usage.total_tokens // null), tool_uses: (.usage.tool_uses // null), duration_ms: (.usage.duration_ms // null), timestamp: $ts}' 2>/dev/null) \
  || LOG_LINE="{\"agent_id\":\"${AGENT_ID}\",\"agent_type\":\"${AGENT_TYPE:-unknown}\",\"tokens\":null,\"tool_uses\":null,\"duration_ms\":null,\"timestamp\":\"$(date -Iseconds)\"}"
echo "$LOG_LINE" >> "$ORCH_BASE/logs/agents.log"
