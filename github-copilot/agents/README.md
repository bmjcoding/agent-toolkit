# github-copilot/agents/

Custom agent definitions for the GitHub Copilot extension (VS Code).

## Target Surface

**VS Code GitHub Copilot extension only.** Cloud agent format is different — cloud agents
use `.github/agents/<name>.md` (no `.agent.md` extension) with `description` required and
a subset of frontmatter fields. Files here are the VS Code variant.

## Agent Discovery Path

VS Code Copilot reads custom agents from `.github/agents/<name>.agent.md`. Files in this
directory are NOT auto-discovered. Run `github-copilot/scripts/install.sh` to symlink
them into `.github/agents/`.

## Frontmatter Field Reference

| Field | VS Code Support | Notes |
|-------|-----------------|-------|
| `name` | Yes | Display name in Copilot Chat |
| `description` | Yes | Shown in agent picker; first 4000 chars used in code review |
| `tools` | Yes | Copilot tool aliases (see below) |
| `model` | Yes | `gpt-4o`, `gpt-4o-mini`, `o1`, etc. |
| `mcp-servers` | Yes | Per-agent MCP server declarations |
| `handoffs` | Yes | Agent-to-agent handoff declarations |
| `hooks` | Yes | Event hooks (VS Code only) |
| `user-invocable` | Yes | Whether user can invoke directly |
| `target` | Yes | Documentation field: `vscode` |
| `disable-model-invocation` | Yes | Prevent the agent from calling the model |
| `permissionMode` | **No** | Claude Code-specific — dropped |
| `maxTurns` | **No** | Claude Code-specific — dropped |
| `disallowedTools` | **No** | Claude Code-specific — dropped |
| `effort` | **No** | Claude Code-specific — dropped |

## Copilot Tool Aliases (VS Code)

| Claude Code Tool | Copilot VS Code Alias |
|------------------|-----------------------|
| `Read` | `read_file` |
| `Write` | `create_file` / `insert_edit_into_file` |
| `Edit` | `insert_edit_into_file` |
| `Glob` | `list_dir` |
| `Grep` | `search_files` (also covers Glob for text search) |
| `Bash` | `run_in_terminal` |
| `Agent` | (no direct equivalent; use `handoffs` frontmatter) |
| `WebSearch` | `search_web` (if enabled) |
| `WebFetch` | (no direct equivalent) |

## Contents

| Agent | Ported from | Notes |
|-------|-------------|-------|
| `planner.agent.md` | `claude-code/agents/planner/planner.md` | Core planning agent |
