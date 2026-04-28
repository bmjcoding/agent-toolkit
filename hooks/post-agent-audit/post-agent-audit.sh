#!/usr/bin/env bash
# lifecycle: stable
# SubagentStop hook: after any subagent returns, audit for:
#   1. Out-of-scope file modifications (changes to files NOT in the subagent's
#      owned_files list per plan.json)
#   2. Truncation symptoms (no handoff JSON written despite the agent stopping)
#   3. Handoff schema violations (severity enum, status enum, files_written
#      type, agent_id format) — delegated to scripts/orchestrator/validate-handoff.py
#      so the rule lives in one place across tool adapters.
#
# When out-of-scope writes are detected, the script stashes them as a named
# patch (so the user can review or recover) and notes the stash in a
# session-scoped audit file. It does not block — the orchestrator inspects
# the audit file and decides whether to halt.
#
# This script consolidates the "Truncated agent results" + "Mandatory
# post-truncation scope audit" guidance from the orchestrator agent body
# into mechanical enforcement, and (since 2026-04-27 follow-up) the handoff
# schema validation that previously cost 6+ rejection-and-retry cycles
# across the prior 10 retros.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd -P)"
# shellcheck source=../_adapter_lib.sh
source "${SCRIPT_DIR}/../_adapter_lib.sh"

read_adapter_input

# Resolve session base.
SID=$(cat .orchestrator/session.id 2>/dev/null)
if [[ -n "$SID" && "$SID" =~ ^[0-9]{8}T[0-9]{6}$ ]]; then
  ORCH_BASE=".orchestrator/sessions/$SID"
else
  ORCH_BASE=".orchestrator"
fi

PLAN="$ORCH_BASE/plan.json"
HANDOFF_DIR="$ORCH_BASE/handoffs"
AUDIT_LOG="$ORCH_BASE/logs/agents.log"
mkdir -p "$ORCH_BASE/logs" 2>/dev/null || true

if [ ! -f "$PLAN" ]; then
  exit 0   # No plan, no scope to audit.
fi

# Identify the agent that just stopped.
AGENT_ID=$(json_value '.agent_id // .agent_type // .subagent_type // empty')
SUBTASK_ID=$(json_value '.subtask_id // .subtaskId // empty')

if [ -z "$AGENT_ID" ]; then
  exit 0
fi

# Look up the agent's owned_files from plan.json. If we have a subtask_id, use
# that; otherwise union owned_files for any subtask whose `agent` matches.
OWNED=$(if [ -n "$SUBTASK_ID" ]; then
  jq -r --arg id "$SUBTASK_ID" '.subtasks[] | select(.id == $id) | .owned_files[]?' "$PLAN" 2>/dev/null
else
  jq -r --arg ag "$AGENT_ID" '.subtasks[] | select(.agent == $ag) | .owned_files[]?' "$PLAN" 2>/dev/null
fi | sort -u)

# Get currently-modified files (tracked + untracked).
MODIFIED=$( {
  git diff --name-only HEAD 2>/dev/null
  git ls-files --others --exclude-standard 2>/dev/null
} | sort -u)

# Compute set difference: modified - owned = out-of-scope.
OUT_OF_SCOPE=""
if [ -n "$OWNED" ] && [ -n "$MODIFIED" ]; then
  OUT_OF_SCOPE=$(comm -23 <(echo "$MODIFIED") <(echo "$OWNED"))
fi

# Locate the handoff file. Use the named alias if present, else any phase-qualified alias.
HANDOFF_FILE="$HANDOFF_DIR/${AGENT_ID}.json"
HANDOFF_PRESENT=true
if [ ! -f "$HANDOFF_FILE" ]; then
  # Look for phase-qualified alias (e.g., release-engineer-6a.json when AGENT_ID is release-engineer)
  ALT=$(ls -1t "$HANDOFF_DIR"/${AGENT_ID}-*.json 2>/dev/null | head -1)
  if [ -n "$ALT" ]; then
    HANDOFF_FILE="$ALT"
  else
    HANDOFF_PRESENT=false
  fi
fi

# ── Validate handoff schema (REC-1 from 2026-04-27 follow-up) ─────────────
HANDOFF_VIOLATIONS_JSON="null"
HANDOFF_VALID=true
VALIDATOR=$(resolve_toolkit_file "scripts/orchestrator/validate-handoff.py" || true)
if [ "$HANDOFF_PRESENT" = true ]; then
  if [ ! -f "$VALIDATOR" ]; then
    HANDOFF_VALID=false
    HANDOFF_VIOLATIONS_JSON='[{"code":"validator_missing","message":"scripts/orchestrator/validate-handoff.py is missing"}]'
  elif VALIDATE_OUT=$(python3 "$VALIDATOR" "$HANDOFF_FILE" 2>/dev/null); then
    HANDOFF_VALID=true
  else
    HANDOFF_VALID=false
    HANDOFF_VIOLATIONS_JSON=$(echo "$VALIDATE_OUT" | jq -c '.violations // []' 2>/dev/null || echo '[]')
  fi
fi

# Decide whether to write an audit record. Three conditions trigger one:
#   a) out-of-scope writes
#   b) handoff missing (truncation symptom)
#   c) handoff schema violations
NEEDS_AUDIT=false
[ -n "$OUT_OF_SCOPE" ] && NEEDS_AUDIT=true
[ "$HANDOFF_PRESENT" = false ] && NEEDS_AUDIT=true
[ "$HANDOFF_VALID" = false ] && NEEDS_AUDIT=true

if [ "$NEEDS_AUDIT" = false ]; then
  exit 0   # Clean — agent stayed in scope, wrote a handoff, schema valid.
fi

# Stash out-of-scope files for user review (do not lose work).
STASH_NAME=""
if [ -n "$OUT_OF_SCOPE" ]; then
  STASH_NAME="post-agent-audit-${AGENT_ID}-$(date +%s)"
  echo "$OUT_OF_SCOPE" | xargs git stash push -m "$STASH_NAME" -- 2>/dev/null || true
fi

# Write an audit record.
AUDIT_FILE="$ORCH_BASE/post-agent-audit-${AGENT_ID}.json"
jq -n \
  --arg agent "$AGENT_ID" \
  --arg sid "$SID" \
  --arg subtask "$SUBTASK_ID" \
  --arg stash "$STASH_NAME" \
  --argjson handoff_present "$HANDOFF_PRESENT" \
  --argjson handoff_valid "$HANDOFF_VALID" \
  --argjson handoff_violations "$HANDOFF_VIOLATIONS_JSON" \
  --arg handoff_path "$HANDOFF_FILE" \
  --arg out_of_scope "$OUT_OF_SCOPE" \
  --arg owned "$OWNED" \
  '{
     agent: $agent,
     session_id: $sid,
     subtask_id: ($subtask | select(length>0)),
     handoff_present: $handoff_present,
     handoff_valid: $handoff_valid,
     handoff_path: ($handoff_path | select(length>0)),
     handoff_schema_violations: $handoff_violations,
     stash_name: ($stash | select(length>0)),
     out_of_scope_files: ($out_of_scope | split("\n") | map(select(length>0))),
     owned_files: ($owned | split("\n") | map(select(length>0)))
   }' > "$AUDIT_FILE" 2>/dev/null

echo "$(date -Iseconds) post_agent_audit agent=$AGENT_ID handoff_present=$HANDOFF_PRESENT handoff_valid=$HANDOFF_VALID stash=$STASH_NAME" \
  >> "$AUDIT_LOG" 2>/dev/null || true

# Do not block — the orchestrator inspects the audit file and decides.
exit 0
