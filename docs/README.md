# docs/

Repository-wide architecture decisions and durable project documentation.

## Contribution Entry Point

Before opening a pull request that touches docs, run the repo-local Claude contribution
assistant at `.claude/agents/contribution-assistant.md`. It checks the changed
documentation, updates versioned changelogs when needed, and runs the local gate.

## Ownership

- Root `docs/` contains durable repository decisions and supporting documentation.
- Architecture decisions live under `docs/adr/`.
- ADRs should describe repository-level direction, not component-specific release notes.
- Component behavior changes still belong in that component's `CHANGELOG.md`.

## Structure

```text
docs/
  adr/
    0000-short-title.md
```
