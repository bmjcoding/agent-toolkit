# rules/

Shared rule definitions — the single source of truth for rule content used across the toolkit's supported AI surfaces.

## Contribution Entry Point

Before opening a pull request that touches rules, run the repo-local Claude contribution
assistant at `.claude/agents/contribution-assistant.md`. It checks the changed component,
updates versioned changelogs, regenerates adapters, and runs the local gate.

## Ownership

- Root `rules/` is canonical.
- Claude Code consumes generated adapters under `claude-code/rules/`.
- GitHub Copilot for VS Code consumes generated adapters under `github-copilot/instructions/`.
- OpenAI Codex uses them through `openai-codex/rules/build-agents-md.sh` and related composition assets.

## Structure

```text
rules/
  <slug>/
    <slug>.md
    CHANGELOG.md
```

## Rules

| Rule | Lifecycle | Description |
|---|---|---|
| `docker` | stable | Frontend and backend are always separate containers. |
| `finding-discipline` | stable | Finding Discipline |
| `logging` | stable | Never use print/console.log/println/etc. Always use the language's proper logging facility (e.g., Python logging, JS/TS structured logger... |
| `node` | stable | npm install to update dependencies. For production dependencies, pin exact versions in package.json (e.g., "express": "4.18.2") and rely... |
| `python` | stable | Use uv for dependency management — never pip install directly. |
| `untrusted-data-boundary` | stable | Untrusted Data Boundary |

## Versioning

Rule versions live in each rule's `CHANGELOG.md` section headers. This repository does
not require release tags for rule versions.
