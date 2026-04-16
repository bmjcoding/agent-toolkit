# rules/

Shared rule definitions — the single source of truth for rule content used across the
toolkit's supported AI surfaces.

## Ownership

- Root `rules/` is canonical.
- Claude Code consumes generated adapters under `claude-code/rules/`.
- GitHub Copilot for VS Code consumes generated adapters under
  `github-copilot/instructions/`.
- OpenAI Codex uses them through `openai-codex/rules/build-agents-md.sh` and related
  composition assets.

## Structure

```text
rules/
  <slug>/
    <slug>.md      # Canonical rule content
    CHANGELOG.md   # Canonical rule changelog
```

## Rules

| Rule | Description |
|---|---|
| `docker` | Container build and runtime conventions |
| `logging` | Structured logging expectations |
| `node` | Node.js dependency and lockfile policy |
| `python` | Python dependency-management conventions |

## Tag format

```text
rule/<slug>-v<major>.<minor>.<patch>
```
