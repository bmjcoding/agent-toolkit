# .claude/

Repo-local Claude entrypoints and skills for contributor onboarding and pre-PR
standardization.

## Contribution Entry Point

Invoke `.claude/agents/contribution-assistant.md` before committing or opening a pull
request. It loads repo-local skills from `.claude/skills/`, improves and standardizes
changed contributions, updates versioned changelogs, regenerates generated assets, and
runs the local gate.

## Ownership

- `.claude/agents/contribution-assistant.md` is the contributor-facing assistant.
- `.claude/skills/contribution-changelog/` is the contribution-specific changelog skill
  with no `[Unreleased]` workflow.
- `.claude/skills/definition-review` and `.claude/skills/improve` resolve to the
  canonical self-improvement skills in root `skills/`.
- `npm run validate:claude` verifies these local references stay resolvable.
