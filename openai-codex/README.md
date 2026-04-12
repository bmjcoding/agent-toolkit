# openai-codex/

This directory contains **OpenAI Codex CLI-specific content** — agents, hooks, and configuration formatted for the Codex CLI (Rust client, v0.120.0+).

## Subdirectory Layout

```
openai-codex/
  agents/              # 15 custom agent definitions (TOML format: <name>.toml)
  hooks/               # 9 shell scripts + hooks.json manifest
    branch-guard.sh
    changelog-check.sh
    extract-handoff.sh
    inject-context.sh
    integrity-warn.sh
    pre-push-secrets.sh
    protect-config.sh
    toolkit-drift-check.sh
    toolkit-edit-reminder.sh
    hooks.json           # Hook manifest wiring all 9 scripts to Codex events
  config.toml.template # Project config template with 13 [[skills.config]] entries
  scripts/
    install.sh         # Wire openai-codex/ content into .codex/ and .agents/
```

Universal skills (13) live at the **repository root** under `skills/`. Codex reads
them via `.agents/skills/` symlink or `[[skills.config]]` entries in `config.toml`.

## Install

```sh
# Using the install script (recommended)
bash openai-codex/scripts/install.sh --dry-run
bash openai-codex/scripts/install.sh

# Or manually
cp openai-codex/agents/*.toml ~/.codex/agents/
cp openai-codex/hooks/hooks.json .codex/hooks.json
cp openai-codex/config.toml.template .codex/config.toml
ln -s /path/to/agent-toolkit/skills .agents/skills
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

## Hooks

Codex CLI hooks are configured via `hooks.json` and are **experimental** — they require `features.codex_hooks = true` in `config.toml`. Currently Bash-only; `PreToolUse` and `PostToolUse` events supported. Disabled on Windows.

The 9 hooks in `openai-codex/hooks/`:

| Script | Event | Purpose |
|---|---|---|
| `branch-guard.sh` | PreToolUse | Prevent destructive operations on protected branches |
| `changelog-check.sh` | PreToolUse | Enforce changelog entry before commit |
| `extract-handoff.sh` | PostToolUse | Extract agent handoff JSON from output |
| `inject-context.sh` | PreToolUse | Inject session context into agent runs |
| `integrity-warn.sh` | PostToolUse | Warn when output integrity checks fail |
| `pre-push-secrets.sh` | PreToolUse | Scan for secrets before push |
| `protect-config.sh` | PreToolUse | Block writes to protected config files |
| `toolkit-drift-check.sh` | PostToolUse | Detect uncommitted drift in toolkit components |
| `toolkit-edit-reminder.sh` | PostToolUse | Remind to update changelog after toolkit edits |

## Skills

The `config.toml.template` includes 13 `[[skills.config]]` entries — one per universal
skill — pointing to `skills/<slug>/SKILL.md` at the repo root. Copy the template to
`.codex/config.toml` and adjust the base path to match your checkout location.

Codex can also discover skills via `.agents/skills/` symlink:

```sh
ln -s /path/to/agent-toolkit/skills .agents/skills
```

## Config Location

Project config: `.codex/config.toml` (loaded only from trusted repos). Global config: `~/.codex/config.toml`. MCP servers are declared as `[mcp_servers.<id>]` tables in config.toml.

## Tag Format

```
openai-codex/<slug>-v<major>.<minor>.<patch>
```

Example: `openai-codex/frankenstein-v1.0.0`
