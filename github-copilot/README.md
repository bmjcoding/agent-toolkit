# github-copilot/

This directory contains **GitHub Copilot for VS Code-specific content** — agents,
instructions, prompts, hooks, bundles, and install assets. Canonical agent bodies,
workflow bodies, skills, and rules live at the repo root; this directory keeps only the
VS Code Copilot adapters and wiring those canonical files require.

## Subdirectory layout

```text
github-copilot/
  agents/       # VS Code Copilot agent adapters for root agents/
  bundles/      # Bundle manifests
  hooks/        # VS Code Copilot hook manifests plus any tool-local adapters
  instructions/ # Rule adapters for root rules/
  prompts/      # Workflow adapters for root workflows/
  scripts/
    install.sh  # Wires .github/ discovery surfaces
```

## Install

```sh
bash github-copilot/scripts/install.sh --target /path/to/project --dry-run
bash github-copilot/scripts/install.sh --target /path/to/project
bash github-copilot/scripts/install.sh --target /path/to/project --check
```

Manual wiring:

```sh
TOOLKIT=/path/to/agent-toolkit
ln -sfn "${TOOLKIT}/github-copilot/agents"       .github/agents
ln -sfn "${TOOLKIT}/github-copilot/bundles"      .github/bundles
ln -sfn "${TOOLKIT}/github-copilot/instructions" .github/instructions
ln -sfn "${TOOLKIT}/github-copilot/prompts"      .github/prompts
```

For hooks, prefer `github-copilot/scripts/install.sh`. Copilot expects a flat
`.github/hooks/*.json` discovery surface, while the repo now stores each hook under
`github-copilot/hooks/<slug>/`.

## Shared instructions

`AGENTS.md` is the primary shared instruction surface. `CLAUDE.md` is kept only as a
compatibility shim for Claude-native consumers and should not be treated as Copilot's
canonical shared instruction file.

## Rule adapters

`github-copilot/agents/` and `github-copilot/prompts/` are generated adapters for the
canonical root `agents/` and `workflows/`. `github-copilot/instructions/` contains the VS
Code Copilot-native adapters for the canonical root rules in `rules/`.

## Hooks

Root `hooks/` is now the canonical shared owner for hook logic. `github-copilot/hooks/`
keeps the VS Code Copilot manifests and any transitional tool-local adapters required by
Copilot's runtime semantics. The installer still flattens the manifests into
`.github/hooks/*.json`, which is the discovery shape Copilot expects.

## Tag format

Tool-specific Copilot assets use:

```text
github-copilot/<slug>-v<major>.<minor>.<patch>
```
