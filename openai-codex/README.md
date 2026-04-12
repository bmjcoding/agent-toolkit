# openai-codex/

This directory contains **OpenAI Codex CLI-specific content** — agents and configuration formatted for the Codex CLI (Rust client, v0.120.0+).

## What Goes Here

```
openai-codex/
  agents/   # Custom agent definitions (TOML format: <name>.toml)
  config/   # Project-level Codex config (.codex/config.toml equivalent stubs)
```

## AGENTS.md Integration

Codex CLI reads `AGENTS.md` natively as its primary instruction file — no import bridge is needed. The repo-root `AGENTS.md` is loaded automatically. Codex also walks parent directories and loads nested `AGENTS.md` files; files closer to the working directory take precedence. The 32 KiB cap applies to the merged AGENTS.md content.

For a global override that applies across all repos, users place content in `~/.codex/AGENTS.override.md`.

## Custom Agent Format (TOML)

Codex CLI custom agents are defined in TOML and placed at `~/.codex/agents/<name>.toml` (global) or `.codex/agents/<name>.toml` (project-scoped, trusted repos only):

```toml
name        = "<agent-name>"
description = "<one-liner>"
model       = "codex-mini-latest"   # or o4-mini, o3, etc.

developer_instructions = """
Your agent instructions here.
"""
```

See `openai-codex/agents/planner.toml` for a canonical example with inline documentation of each field and the mapping from Claude Code frontmatter keys.

## Hooks (Experimental)

Codex CLI supports project-level hooks via `~/.codex/hooks.json` or `<repo>/.codex/hooks.json`. Hooks are **experimental** and require `features.codex_hooks = true` in `config.toml`. Currently Bash-only; `PreToolUse` and `PostToolUse` events supported. Disabled on Windows.

## Skills

Codex CLI reads skills from `.agents/skills/` (note: `.agents/`, not `.claude/`). During the restructure, a `.agents/skills/` directory at repo root may be added as a symlink or copy target pointing to `shared/skills/`.

## Config Location

Project config: `.codex/config.toml` (loaded only from trusted repos). Global config: `~/.codex/config.toml`. MCP servers are declared as `[mcp_servers.<id>]` tables in config.toml.
