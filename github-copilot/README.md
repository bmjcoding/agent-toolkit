# github-copilot/

This directory contains **GitHub Copilot-specific content** — agents, instructions, and prompts formatted for the GitHub Copilot agent model (both VS Code extension and GitHub.com cloud agent).

## Subdirectory Layout

```
github-copilot/
  agents/       # 15 custom agent definitions (.agent.md for VS Code; .md for cloud)
  instructions/ # 4 path-specific instruction files (docker, logging, node, python)
  prompts/      # 6 reusable prompt files (.prompt.md — VS Code, VS, JetBrains only)
  skills/       # changelog wrapper (1 skill); other skills discoverable via .github/skills → /skills
  scripts/
    install.sh  # Wire github-copilot/ content into .github/ for VS Code
```

Universal skills (13) live at the **repository root** under `skills/`. Install the
skills via a symlink: `ln -s "$(pwd)/skills" .github/skills`.

Copilot also reads `AGENTS.md` (this repo root) natively and `.github/copilot-instructions.md` for repository-wide context. Those files are not duplicated here.

## Install

```sh
# Using the install script (recommended)
bash github-copilot/scripts/install.sh --dry-run
bash github-copilot/scripts/install.sh

# Or manually symlink each directory from your project root
ln -s /path/to/agent-toolkit/github-copilot/agents       .github/agents
ln -s /path/to/agent-toolkit/github-copilot/instructions .github/instructions
ln -s /path/to/agent-toolkit/github-copilot/prompts      .github/prompts
ln -s /path/to/agent-toolkit/skills                      .github/skills
```

## Agent Format (VS Code)

Custom agents for the VS Code Copilot extension use `.github/agents/<name>.agent.md` path with optional frontmatter fields: `name`, `description`, `tools`, `model`, `mcp-servers`, `handoffs`, `hooks`.

## Agent Format (GitHub Cloud)

GitHub.com cloud agents use `.github/agents/<name>.md` with `description` required and optional `tools`, `model` fields. Cloud agents do not support `hooks`, `mcpServers`, or `permissionMode` (silently ignored).

## Instructions

The 4 instruction files map directly to the 4 universal rules:

| File | Rule | `applyTo` |
|---|---|---|
| `docker.instructions.md` | Docker | `Dockerfile, docker-compose*.yml` |
| `logging.instructions.md` | Logging | `**/*.{ts,js,py}` |
| `node.instructions.md` | Node | `**/*.{ts,js}, package.json` |
| `python.instructions.md` | Python | `**/*.py, pyproject.toml` |

## Prompts

The 6 prompt files are direct Copilot equivalents of the 6 Claude Code slash commands:

| Prompt | Claude Code command |
|---|---|
| `audit.prompt.md` | `/audit` |
| `backlog.prompt.md` | `/backlog` |
| `git-verify.prompt.md` | `/git-verify` |
| `lint.prompt.md` | `/lint` |
| `sync-toolkit.prompt.md` | `/sync-toolkit` |
| `test.prompt.md` | `/test` |

## Copilot-Specific Constraints

- Repository-wide instructions in `.github/copilot-instructions.md` are additive (not exclusive) alongside `AGENTS.md`.
- Nested `AGENTS.md` support in VS Code is **off by default** — requires `chat.useCustomizationsInParentRepositories: true` in VS Code settings.
- Copilot code-review mode reads only the first 4000 characters of any instruction file. Keep agent descriptions concise.
- MCP in cloud agents: only `tools` transport is supported; no OAuth remote MCP; secrets prefixed `COPILOT_MCP_`.

## Tag Format

```
github-copilot/<slug>-v<major>.<minor>.<patch>
```

Example: `github-copilot/frankenstein-v1.0.0`
