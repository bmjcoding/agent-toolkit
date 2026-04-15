# github-copilot/agents/

VS Code GitHub Copilot agent adapters for the canonical root `agents/` definitions.

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
| `tools` | Yes | Use the official aliases `read`, `edit`, `search`, `execute`, `web`, `todo`, or `["*"]` |
| `model` | Yes | Use a qualified model name such as `Claude Opus 4.5 (copilot)` |
| `mcp-servers` | Yes | Per-agent MCP server declarations |
| `agents` | Yes | VS Code custom-agent handoff declarations |
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
| `Read` | `read` |
| `Write` / `Edit` | `edit` |
| `Glob` / `Grep` | `search` |
| `Bash` | `execute` |
| `Agent(...)` | `agents:` frontmatter list |
| `WebSearch` / `WebFetch` | `web` |
| `TodoWrite` | `todo` |

## Model Mapping

Shared agent adapters use a cross-tool tier map:

| Claude tier | Copilot model |
|-------------|---------------|
| `inherit` / `opus` | `Claude Opus 4.5 (copilot)` |
| `sonnet` | `Claude Sonnet 4.5 (copilot)` |
| `haiku` | `Claude Haiku 4.5 (copilot)` |

## Canonical Source

Edit the shared instruction body at `agents/<name>/AGENT.md`, then regenerate adapters
with `node scripts/sync-canonical-adapters.js`.

## Contents

| Agent | Ported from | Notes |
|-------|-------------|-------|
| `planner.agent.md` | `agents/planner/AGENT.md` | Core planning agent |
