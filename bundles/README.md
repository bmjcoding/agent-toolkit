# bundles/

Canonical shared bundle manifests for grouping agents, skills, commands, hooks, and
rules into installable capability sets.

## Contribution Entry Point

Before opening a pull request that touches bundles, run the repo-local Claude
contribution assistant at `.claude/agents/contribution-assistant.md`. It checks changed
bundle metadata, updates versioned changelogs, regenerates generated assets, and runs the
local gate.

## Ownership

- Root `bundles/` is the canonical editing surface for shared bundle definitions.
- Each bundle lives in `bundles/<slug>/bundle.yaml`.
- Each bundle owns its release history in `bundles/<slug>/CHANGELOG.md`.
- Generated catalogs and installer-facing metadata should be refreshed with
  `npm run sync` after bundle changes.

## Structure

```text
bundles/
  <slug>/
    bundle.yaml
    CHANGELOG.md
```
