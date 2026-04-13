# openai-codex/

This directory contains **OpenAI Codex CLI-specific content** — agents, hooks, skills, rules, bundles, and configuration formatted for the Codex CLI (Rust client, v0.120.0+). This directory is fully self-contained; it does not depend on root-level `skills/` or `rules/` directories.

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
    hooks.json           # Hook manifest — install to ~/.codex/hooks.json
  skills/              # 13 universal skills (each in <slug>/SKILL.md)
  rules/               # 4 universal rules (docker, logging, node, python)
  bundles/             # 8 bundle manifests grouping components by workflow
  config.toml.template # Project config template with 13 [[skills.config]] entries
  dependencies.json    # Per-tool dependency manifest (schema v1.0)
  scripts/
    install.sh         # Wire openai-codex/ content into ~/.codex/
```

## Install

```sh
# Using the install script (recommended)
bash openai-codex/scripts/install.sh --dry-run
bash openai-codex/scripts/install.sh

# Or manually
cp openai-codex/agents/*.toml ~/.codex/agents/
cp openai-codex/hooks/hooks.json ~/.codex/hooks.json
cp openai-codex/config.toml.template .codex/config.toml
```

### Hooks path

Per the official Codex CLI specification, `hooks.json` must be installed as a file **next to** `config.toml`:

```
~/.codex/
  config.toml      # user-global config
  hooks.json       # hook manifest — sibling to config.toml (NOT in a hooks/ subdir)
```

The install script symlinks `openai-codex/hooks/hooks.json` → `~/.codex/hooks.json`. Hook shell scripts remain in `openai-codex/hooks/` and are referenced by their full path inside `hooks.json`.

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

Codex CLI hooks are configured via `hooks.json` and are **experimental** — they require `features.codex_hooks = true` in `config.toml`. Currently Bash-only. Disabled on Windows.

The hook manifest uses the official nested format:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "<regex>",
        "hooks": [
          { "type": "command", "command": "<full path to script>", "statusMessage": "..." }
        ]
      }
    ]
  }
}
```

The 9 hooks in `openai-codex/hooks/` are mapped to Codex events as follows:

| Script | Codex Event | Purpose |
|---|---|---|
| `branch-guard.sh` | PreToolUse | Prevent destructive operations on protected branches |
| `changelog-check.sh` | PreToolUse | Enforce changelog entry before commit |
| `protect-config.sh` | PreToolUse | Block writes to protected config files |
| `toolkit-edit-reminder.sh` | PreToolUse | Remind to update changelog after toolkit edits |
| `pre-push-secrets.sh` | PreToolUse | Scan for secrets before push |
| `integrity-warn.sh` | PostToolUse | Warn when output integrity checks fail |
| `toolkit-drift-check.sh` | PostToolUse | Detect uncommitted drift in toolkit components |
| `inject-context.sh` | UserPromptSubmit | Inject session context into agent runs |
| `extract-handoff.sh` | Stop | Extract agent handoff JSON from output |

## Skills

Skills live at `openai-codex/skills/<slug>/SKILL.md`. The `config.toml.template` includes 13 `[[skills.config]]` entries pointing to each `SKILL.md` file.

Valid `[[skills.config]]` fields are `path`, `name`, and `enabled` only (`description` is not allowed — the schema has `additionalProperties: false`).

Codex can also discover skills via `.agents/skills/` in the repo root:

```sh
ln -s /path/to/agent-toolkit/openai-codex/skills .agents/skills
```

## Config Settings

Key `config.toml` values used in this toolkit:

| Field | Value | Notes |
|---|---|---|
| `approval_policy` | `"on-request"` | Valid values: `"on-request"`, `"untrusted"`, `"never"` |
| `sandbox_mode` | `"workspace-write"` | Valid values: `"workspace-write"`, `"read-only"`, `"danger-full-access"` |
| `[features] codex_hooks` | `true` | Required to activate hooks |

Project config: `.codex/config.toml` (loaded only from trusted repos). Global config: `~/.codex/config.toml`. MCP servers are declared as `[mcp_servers.<id>]` tables in config.toml.

## Bundles

Bundle manifests in `openai-codex/bundles/` group components by workflow. Codex bundles include only `agent`, `skill`, and `hook` items — no `command` or `rule` categories (Codex has no custom slash commands; rules are embedded in AGENTS.md).

See `openai-codex/bundles/README.md` for the full bundle list and format documentation.

## Tag Format

```
openai-codex/<slug>-v<major>.<minor>.<patch>
```

Example: `openai-codex/frankenstein-v1.0.0`
