# workflows/

Canonical shared workflow definitions.

## Ownership

- Root `workflows/` is the canonical editing surface for shared workflow semantics.
- Claude slash commands in `claude-code/commands/` and VS Code Copilot prompt files in
  `github-copilot/prompts/` are tool-native adapters generated from these canonical files.
- The shared meaning belongs here; tool directories keep only the format each runtime needs.

## Structure

```text
workflows/
  <slug>/
    WORKFLOW.md    # Canonical shared workflow body
    CHANGELOG.md   # Canonical shared changelog for the workflow definition
```

## Sync

After editing a canonical workflow, regenerate adapters:

```sh
node scripts/sync-canonical-adapters.js
```
