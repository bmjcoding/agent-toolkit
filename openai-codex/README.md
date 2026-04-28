# openai-codex/

This directory contains **OpenAI Codex-specific adapters and runtime assets** — TOML
agent wrappers, hook registry assets, configuration templates, and Codex-specific rule
composition assets. Canonical agent bodies, workflow bodies, skills, rules, and shared
hook logic live at the repo root.

## Contribution Entry Point

Before opening a pull request that touches Codex-specific assets, run the repo-local
Claude contribution assistant at `.claude/agents/contribution-assistant.md`. It checks the
changed component, updates versioned changelogs, regenerates adapters, and runs the local
gate.

## Subdirectory layout

```text
openai-codex/
  agents/              # Codex TOML adapters for root agents/
  hooks/               # Codex hook registry plus any tool-local adapters
  rules/               # Codex rule-composition assets
  config.toml.template # Skills config pointing at repo-root skills/
  scripts/
    install.sh
```

## Install

```sh
bash openai-codex/scripts/install.sh --dry-run
bash openai-codex/scripts/install.sh
```

Or manually:

```sh
export AGENT_TOOLKIT_DIR=/path/to/agent-toolkit
mkdir -p "$HOME/.codex/agents" .agents
cp openai-codex/agents/*.toml "$HOME/.codex/agents/"
ln -sfn "$AGENT_TOOLKIT_DIR/openai-codex/hooks/hooks.json" "$HOME/.codex/hooks.json"
mkdir -p "$HOME/.codex/openai-codex"
ln -sfn "$AGENT_TOOLKIT_DIR/openai-codex/hooks" "$HOME/.codex/openai-codex/hooks"
cp openai-codex/config.toml.template "$HOME/.codex/config.toml"
ln -sfn "$AGENT_TOOLKIT_DIR/skills" .agents/skills
```

Prefer the installer when `~/.codex/config.toml` already exists; the installer appends
the toolkit `[[skills.config]]` blocks instead of replacing the whole file. The
`.agents/skills` symlink is an optional project-local fallback for Codex skill discovery.
The `~/.codex/openai-codex/hooks` symlink makes the generated `hooks.json` fallback path
work even when `AGENT_TOOLKIT_DIR` is not exported in the shell that launches Codex.

## Shared instructions

Codex reads repo-root `AGENTS.md` natively as the shared instruction source. No shim or
import bridge is needed.

## Model Mapping

Codex adapters use the shared tier map below when generating `openai-codex/agents/*.toml`:

| Shared tier | Codex model |
|-------------|-------------|
| `frontier` | `gpt-5.4` |
| `balanced` | `gpt-5.3-codex` |
| `fast` | `gpt-5.3-codex-spark` |

## Shared skills

`config.toml.template` points each `[[skills.config]]` entry at the canonical root skill:

```toml
[[skills.config]]
path = "${AGENT_TOOLKIT_DIR}/skills/<category>/.../<slug>/SKILL.md"
enabled = true
```

Codex can also discover shared skills from `.agents/skills/`.

## Rules

Root `rules/` is canonical. `openai-codex/rules/` contains only Codex-specific rule
composition assets such as `build-agents-md.sh`.

The checked-in Codex surface currently consists of agents, hooks, the config template,
and rule build assets. Use the root `index.json` catalog for machine-readable artifact
metadata.

## Versioning

Codex adapter versions are read from the canonical component changelog they mirror.
Codex-only runtime assets keep their own `CHANGELOG.md` files. This repository does not
require release tags or tag-backed comparison links.
