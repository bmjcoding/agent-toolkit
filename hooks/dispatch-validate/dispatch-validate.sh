#!/usr/bin/env bash
# lifecycle: stable
# PreToolUse hook for Agent dispatches: validates the dispatch prompt against
# forbidden patterns before the subagent is spawned. Catches three classes of
# error programmatically:
#
#   1. forbidden_retro_combination — primary task body combined with a retro trigger
#   2. missing_retro_suppression  — non-retro dispatch missing the suppression line
#   3. mode_word_missing          — autoresearch dispatch with no recognised mode
#
# The validation logic lives in ~/.claude/scripts/dispatch-validator.py so the
# rule has one update site. This hook script just shapes the input and decides
# whether to deny.
#
# Hook payload (PreToolUse on Agent): the JSON includes tool_input with the
# subagent_type and prompt. We extract both and pass to the validator.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd -P)"
# shellcheck source=../_adapter_lib.sh
source "${SCRIPT_DIR}/../_adapter_lib.sh"

read_adapter_input

# Only act on Agent tool dispatches.
TOOL=$(extract_tool_name)
if [ "$TOOL" != "Agent" ] && [ "$TOOL" != "Task" ]; then
  exit 0
fi

# Extract the subagent type and the dispatch prompt.
TARGET=$(json_value '.tool_input.subagent_type // .toolInput.subagent_type // .tool_input.agent // .toolInput.agent // empty')
PROMPT=$(json_value '.tool_input.prompt // .toolInput.prompt // .tool_input.message // .toolInput.message // empty')

if [ -z "$TARGET" ] || [ -z "$PROMPT" ]; then
  # Insufficient signal — let the dispatch through.
  exit 0
fi

VALIDATOR="${HOME}/.claude/scripts/dispatch-validator.py"
if [ ! -x "$VALIDATOR" ]; then
  # Validator missing — log a notice but do not block.
  echo "$(date -Iseconds) dispatch-validate: validator script missing at $VALIDATOR" \
    >> .orchestrator/logs/agents.log 2>/dev/null || true
  exit 0
fi

# Run the validator.
TMP_PROMPT=$(mktemp)
printf '%s' "$PROMPT" > "$TMP_PROMPT"
RESULT=$(python3 "$VALIDATOR" --target "$TARGET" --prompt-file "$TMP_PROMPT" 2>/dev/null)
EXIT_CODE=$?
rm -f "$TMP_PROMPT"

if [ "$EXIT_CODE" -eq 0 ]; then
  exit 0
fi

# Non-zero exit means at least one P0/P1 finding. Deny the dispatch.
if command -v emit_deny >/dev/null 2>&1; then
  emit_deny "Dispatch validation failed for $TARGET. $(echo "$RESULT" | jq -r '.findings[] | "[\(.priority)] \(.code): \(.message)"' 2>/dev/null | head -3)"
else
  # Fallback if the adapter helper is unavailable.
  echo "BLOCKED: dispatch validation failed for $TARGET" >&2
  echo "$RESULT" | jq -r '.findings[] | "  [\(.priority)] \(.code): \(.message)"' >&2 2>/dev/null
  exit 2
fi
