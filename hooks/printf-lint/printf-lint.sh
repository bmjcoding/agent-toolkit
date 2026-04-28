#!/usr/bin/env bash
# lifecycle: stable
# PostToolUse hook for Edit/Write on shell files: runs the printf-newlines
# linter against the modified file and emits a finding if the format/accumulator
# pairing is unsafe. Catches the class of error programmatically so reviewers
# do not need to remember to run the script themselves.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd -P)"
# shellcheck source=../_adapter_lib.sh
source "${SCRIPT_DIR}/../_adapter_lib.sh"

read_adapter_input

# Only act on Edit/Write tools targeting .sh files.
TOOL=$(extract_tool_name)
case "$TOOL" in
  Edit|Write|MultiEdit) ;;
  *) exit 0 ;;
esac

FILE=$(extract_file_path)
[ -n "$FILE" ] || exit 0

case "$FILE" in
  *.sh|*.bash) ;;
  *) exit 0 ;;
esac

[ -f "$FILE" ] || exit 0

LINTER=$(resolve_toolkit_file "scripts/orchestrator/lint-printf-newlines.sh" || true)
if [ ! -x "$LINTER" ]; then
  echo "printf-lint: scripts/orchestrator/lint-printf-newlines.sh is missing or not executable; set AGENT_TOOLKIT_DIR to the toolkit checkout or install the helper script." >&2
  exit 1
fi

OUTPUT=$("$LINTER" "$FILE" 2>&1)
EXIT_CODE=$?

if [ "$EXIT_CODE" -eq 0 ]; then
  exit 0
fi

# Emit a non-blocking warning. We use stderr so the agent sees it in its tool
# response but the edit is not reverted. (The user can decide to harden this
# to a block if false-positive rate is low.)
echo "printf-lint: findings in $FILE" >&2
echo "$OUTPUT" >&2
exit 0
