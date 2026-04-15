# openai-codex/rules/

Codex-specific rule composition assets. The canonical shared rule content lives in
repo-root `rules/`.

## Purpose

Use `build-agents-md.sh` to compose the canonical root rules into a Markdown block that can
be appended to a project's `AGENTS.md` when a flattened rules section is needed.

## Structure

```text
openai-codex/rules/
  README.md
  build-agents-md.sh
```

Shared rules are tagged at the root as `rule/<slug>-v<major>.<minor>.<patch>`.
