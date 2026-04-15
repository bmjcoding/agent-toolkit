# github-copilot/

This directory contains **GitHub Copilot for VS Code-specific content** — agents,
instructions, prompts, hooks, and install assets. Canonical agent bodies,
workflow bodies, skills, and rules live at the repo root; this directory keeps only the
VS Code Copilot adapters and wiring those canonical files require.

## Subdirectory layout

```text
github-copilot/
  agents/       # VS Code Copilot agent adapters for root agents/
  hooks/        # VS Code Copilot hooks
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
ln -sfn "${TOOLKIT}/github-copilot/hooks"        .github/hooks
ln -sfn "${TOOLKIT}/github-copilot/instructions" .github/instructions
ln -sfn "${TOOLKIT}/github-copilot/prompts"      .github/prompts
```

## Shared instructions

`AGENTS.md` is the primary shared instruction surface across the toolkit and should be
treated as the shared instruction source of truth.

## Rule adapters

`github-copilot/agents/` and `github-copilot/prompts/` are generated adapters for the
canonical root `agents/` and `workflows/`. `github-copilot/instructions/` contains the VS
Code Copilot-native adapters for the canonical root rules in `rules/`.

## Hooks

`github-copilot/hooks/` contains VS Code Copilot hook assets. These are VS Code Copilot
hooks, not Codex hooks.

## Tag format

Tool-specific Copilot assets use:

```text
github-copilot/<slug>-v<major>.<minor>.<patch>
```
