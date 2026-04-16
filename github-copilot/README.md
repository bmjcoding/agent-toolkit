# github-copilot/

This directory contains **GitHub Copilot for VS Code-specific content** — agents,
instructions, prompts, hooks, and install assets. Canonical agent bodies,
workflow bodies, skills, and rules live at the repo root; this directory keeps only the
VS Code Copilot adapters and wiring those canonical files require.

## Subdirectory layout

```text
github-copilot/
  agents/       # VS Code Copilot agent adapters for root agents/
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
ln -sfn "${TOOLKIT}/github-copilot/instructions" .github/instructions
ln -sfn "${TOOLKIT}/github-copilot/prompts"      .github/prompts
```

For hooks, prefer `github-copilot/scripts/install.sh`. Copilot expects a flat
`.github/hooks/*.json` discovery surface, while the repo now stores each hook under
`github-copilot/hooks/<slug>/`.

## Shared instructions

`AGENTS.md` is the primary shared instruction surface across the toolkit. Root
`CLAUDE.md` remains only the one-line Claude compatibility shim `@AGENTS.md` and should
not be treated as Copilot's canonical instruction file.

## Rule adapters

`github-copilot/agents/` and `github-copilot/prompts/` are generated adapters for the
canonical root `agents/` and `workflows/`. `github-copilot/instructions/` is also
generated from the canonical root rules in `rules/` via
`node scripts/sync-canonical-adapters.js`.

## Hooks

Root `hooks/` is now the canonical shared owner for hook logic. `github-copilot/hooks/`
keeps the VS Code Copilot manifests and generated tool-local adapters required by
Copilot's runtime semantics. The installer still flattens the manifests into
`.github/hooks/*.json`, which is the discovery shape Copilot expects.

## Tag format

Tool-specific Copilot assets use:

```text
github-copilot/<slug>-v<major>.<minor>.<patch>
```
