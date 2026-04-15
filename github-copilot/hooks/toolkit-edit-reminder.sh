#!/usr/bin/env bash
# Toolkit edit reminder hook for the VS Code Copilot surface
# Requires: VS Code Copilot hooks enabled in your VS Code environment
# Note: VS Code Copilot hook stdin payload schema may differ from Claude Code's; validate in your environment.
#
# Claude Code env vars used: none directly — reads stdin JSON for tool_name and tool_input.
# VS Code Copilot mapping: PreToolUse / matcher: Edit|Write
# Note: stdin JSON field names (.tool_name, .tool_input.file_path, .tool_input.path) are
# Claude Code conventions. Verify VS Code Copilot uses the same field names and update jq expressions
# below if they differ.
#
# Original purpose: PreToolUse hook — remind agents editing toolkit components to update
# CHANGELOG.md per KaC 1.1.0. Advisory only, outputs additionalContext, always exits 0.
set -uo pipefail

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
[[ "$TOOL" != "Write" && "$TOOL" != "Edit" ]] && exit 0

FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty' 2>/dev/null)
[[ -z "$FILE" ]] && exit 0

echo "$FILE" | grep -qE '(agent-toolkit|claude-toolkit|/\.claude)/(agents|skills|hooks|commands|rules|claude-code)/[^/]+/[^/]+|^claude-code/(agents|hooks|commands)/[^/]+/[^/]+|^(skills|rules)/[^/]+/[^/]+' || exit 0

[[ "$(basename "$FILE")" == "CHANGELOG.md" ]] && exit 0

MSG="You are editing an agent-toolkit component. Per KaC 1.1.0 principles: after completing your changes, update the component's CHANGELOG.md with a USER-FACING summary of what changed (not a commit-log dump, not a list of file paths). Write verb-prefixed bullets under the appropriate category (Added/Changed/Fixed). Aggregate related changes into a single entry. Bump the version in the component definition file AND the CHANGELOG per SemVer: PATCH for wording fixes (<=5 lines, no new sections), MINOR for new sections or capabilities, MAJOR for structural rewrites or breaking changes. See skills/changelog/SKILL.md for the canonical format."

jq -n --arg msg "$MSG" '{hookSpecificOutput: {additionalContext: $msg}}'
exit 0
