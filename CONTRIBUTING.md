# Contributing to agent-toolkit

## Repository structure

```
agent-toolkit/
├── claude-code/     # Claude Code agents, commands, hooks, bundles, docs, scripts
├── github-copilot/  # GitHub Copilot agents, prompts, instructions
├── openai-codex/    # OpenAI Codex CLI agents and config templates
├── shared/          # Tool-agnostic skills and rules (single source of truth)
├── AGENTS.md        # Root agent instruction file (all tools)
└── CLAUDE.md        # Claude Code bridge to AGENTS.md
```

## Branching

- Work off `main`. Use short-lived feature branches (`feat/<slug>`).
- Keep per-tool content inside its own subdirectory.
- Keep shareable content (rules, skills) under `shared/`.

## Commit style

Follow [Conventional Commits](https://www.conventionalcommits.org/):
`type(scope): short description`

Common scopes: `claude-code`, `github-copilot`, `openai-codex`, `shared`, `docs`, `chore`.

## Component versioning

Each component has its own `CHANGELOG.md` and version.
Tag format: `<tool>/<slug>-v<version>` (e.g. `claude-code/frankenstein-v3.1.0`).
Run the frankenstein agent (`claude-code/agents/frankenstein/frankenstein.md`) when bumping a component.

## Install scripts

Test any `scripts/install.sh` change with `--dry-run` before merging:

```bash
./claude-code/scripts/install.sh --dry-run
./claude-code/scripts/install.sh --check
```

## Pull requests

- Link the relevant ADR if your change affects architecture.
- Add a `CHANGELOG.md` entry in the affected component and/or the top-level file.
