#!/usr/bin/env bash
# PreToolUse hook: remind agents editing toolkit components to update CHANGELOG.md per KaC 1.1.0
set -uo pipefail

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
[[ "$TOOL" != "Write" && "$TOOL" != "Edit" ]] && exit 0

FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty' 2>/dev/null)
[[ -z "$FILE" ]] && exit 0

echo "$FILE" | grep -qE '(agent-toolkit|/\.claude)/(agents|skills|hooks|commands|rules|claude-code|shared)/[^/]+/[^/]+' || exit 0

[[ "$(basename "$FILE")" == "CHANGELOG.md" ]] && exit 0

MSG="You are editing an agent-toolkit component. Per KaC 1.1.0 principles: after completing your changes, update the component's CHANGELOG.md with a USER-FACING summary of what changed (not a commit-log dump, not a list of file paths). Write verb-prefixed bullets under the appropriate category (Added/Changed/Fixed). Aggregate related changes into a single entry. Bump the version in the component definition file AND the CHANGELOG per SemVer: PATCH for wording fixes (<=5 lines, no new sections), MINOR for new sections or capabilities, MAJOR for structural rewrites or breaking changes. See shared/skills/changelog/SKILL.md for the canonical format."

jq -n --arg msg "$MSG" '{hookSpecificOutput: {additionalContext: $msg}}'
exit 0
