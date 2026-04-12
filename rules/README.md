# rules/

Universal rules — the single source of truth for language and framework rule sets across all three tools.

| Tool | How rules are loaded |
|---|---|
| Claude Code | `~/.claude/rules` symlink → this directory |
| GitHub Copilot (VS Code) | Adapted as `github-copilot/instructions/*.instructions.md` with `applyTo` frontmatter |
| OpenAI Codex CLI | Read via `AGENTS.md` at repo root (Codex reads AGENTS.md natively) |

**4 rules:**

| Rule | Description |
|---|---|
| `docker` | Docker and container conventions (pinned image tags, non-root USER, layer ordering) |
| `logging` | Structured logging conventions (log levels, context fields, no secrets in logs) |
| `node` | Node.js / TypeScript conventions (imports, error handling, async patterns) |
| `python` | Python conventions (type hints, virtual envs, pyproject.toml, uv) |

## Structure

Each rule lives in its own subdirectory:

```
rules/
  <slug>/
    <slug>.md      # Rule content
    CHANGELOG.md   # Per-rule version history
```

## Tag Format

```
rule/<slug>-v<major>.<minor>.<patch>
```

Example: `rule/docker-v1.1.0`

## Adding a Rule

1. Create `rules/<slug>/<slug>.md` with the rule content.
2. Create `rules/<slug>/CHANGELOG.md` with the initial version entry.
3. Add a corresponding `github-copilot/instructions/<slug>.instructions.md` with the appropriate `applyTo` glob in its frontmatter.
4. The rule content will be picked up by Codex CLI automatically via AGENTS.md (no additional wiring needed).
