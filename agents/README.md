# agents/

Canonical shared agent instruction bodies.

## Ownership

- Root `agents/` is the canonical editing surface for shared agent semantics.
- `claude-code/agents/`, `github-copilot/agents/`, and `openai-codex/agents/` contain
  tool-native adapters generated from these canonical files.
- Tool-local adapters may differ in frontmatter, schema, manifest wiring, or runtime
  constraints, but the instruction body should be edited here first.

## Structure

```text
agents/
  <slug>/
    AGENT.md       # Canonical shared instruction body
    CHANGELOG.md   # Canonical shared changelog for the agent definition
```

## Sync

After editing a canonical agent, regenerate adapters:

```sh
node scripts/sync-canonical-adapters.js
```
