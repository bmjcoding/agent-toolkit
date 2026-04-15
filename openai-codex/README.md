# openai-codex/

This directory contains **OpenAI Codex-specific adapters and runtime assets** — TOML
agent wrappers, hooks, configuration templates, and Codex-specific rule
composition assets. Canonical agent bodies, workflow bodies, skills, and rules live at
the repo root.

## Subdirectory layout

```text
openai-codex/
  agents/              # Codex TOML adapters for root agents/
  hooks/               # Shell hook scripts + hooks.json manifest
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
cp openai-codex/agents/*.toml ~/.codex/agents/
cp openai-codex/hooks/hooks.json ~/.codex/hooks.json
cp openai-codex/config.toml.template ~/.codex/config.toml
ln -sfn /path/to/agent-toolkit/skills .agents/skills
```

## Shared instructions

Codex reads repo-root `AGENTS.md` natively as the shared instruction source. No shim or
import bridge is needed.

## Model Mapping

Codex adapters use the shared tier map below when generating `openai-codex/agents/*.toml`:

| Claude tier | Codex model |
|-------------|-------------|
| `inherit` / `opus` | `gpt-5.4` |
| `sonnet` | `gpt-5.3-codex` |
| `haiku` | `gpt-5.3-codex-spark` |

## Shared skills

`config.toml.template` points each `[[skills.config]]` entry at the canonical root skill:

```toml
[[skills.config]]
path = "${AGENT_TOOLKIT_DIR}/skills/<slug>/SKILL.md"
enabled = true
```

Codex can also discover shared skills from `.agents/skills/`.

## Rules

Root `rules/` is canonical. `openai-codex/rules/` contains only Codex-specific rule
composition assets such as `build-agents-md.sh`.

## Tag format

Tool-specific Codex assets use:

```text
openai-codex/<slug>-v<major>.<minor>.<patch>
```
