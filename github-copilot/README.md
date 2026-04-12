# github-copilot/

This directory contains **GitHub Copilot-specific content** — agents, instructions, and prompts formatted for the GitHub Copilot agent model (both VS Code extension and GitHub.com cloud agent).

## What Goes Here

```
github-copilot/
  agents/      # Custom agent definitions (.agent.md for VS Code; .md for cloud)
  prompts/     # Reusable prompt files (.prompt.md — VS Code, VS, JetBrains only)
  instructions/ # Path-specific instruction files (frontmatter: applyTo, name, description)
```

Copilot also reads `AGENTS.md` (this repo root) natively and `.github/copilot-instructions.md` for repository-wide context. Those files are not duplicated here.

## Agent Format (VS Code)

Custom agents for the VS Code Copilot extension use `.github/agents/<name>.agent.md` path with optional frontmatter fields: `name`, `description`, `tools`, `model`, `mcp-servers`, `handoffs`, `hooks`.

> Note: The `.github/agents/` path is the VS Code convention. During the restructure, agents here may be symlinked or copied to `.github/agents/` as needed.

## Agent Format (GitHub Cloud)

GitHub.com cloud agents use `.github/agents/<name>.md` with `description` required and optional `tools`, `model` fields. Cloud agents do not support `hooks`, `mcpServers`, or `permissionMode` (silently ignored).

## Copilot-Specific Constraints

- Repository-wide instructions in `.github/copilot-instructions.md` are additive (not exclusive) alongside `AGENTS.md`.
- Nested `AGENTS.md` support in VS Code is **off by default** — requires `chat.useCustomizationsInParentRepositories: true` in VS Code settings.
- Copilot code-review mode reads only the first 4000 characters of any instruction file. Keep agent descriptions concise.
- MCP in cloud agents: only `tools` transport is supported; no OAuth remote MCP; secrets prefixed `COPILOT_MCP_`.
