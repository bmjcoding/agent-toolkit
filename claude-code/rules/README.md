# claude-code/rules/

Claude Code rule sets — loaded via the `~/.claude/rules` symlink created by `install.sh`.

These files are the Claude Code copy of the universal rules. The single source of truth lives in `rules/` at the repo root; this directory is what gets symlinked into `~/.claude/` for use by Claude Code.

**4 rules:**

| Rule | `applyTo` globs | Description |
|---|---|---|
| `docker` | `**/Dockerfile*`, `**/docker-compose*.yml`, `**/docker-compose*.yaml`, `**/.dockerignore` | Docker and container conventions (pinned image tags, non-root USER, layer ordering) |
| `logging` | `**/*.py`, `**/*.js`, `**/*.ts`, `**/*.tsx`, `**/*.jsx`, `**/*.go`, `**/*.rs`, `**/*.java`, `**/*.kt`, `**/*.rb` | Structured logging conventions (log levels, context fields, no secrets in logs) |
| `node` | `**/*.js`, `**/*.ts`, `**/*.tsx`, `**/*.jsx`, `**/package.json` | Node.js / TypeScript conventions (imports, error handling, async patterns) |
| `python` | `**/*.py`, `**/pyproject.toml`, `**/requirements*.txt` | Python conventions (type hints, virtual envs, pyproject.toml, uv) |

## Structure

Each rule lives in its own subdirectory:

```
claude-code/rules/
  <slug>/
    <slug>.md      # Rule content (with paths[] frontmatter)
    CHANGELOG.md   # Per-rule version history
```

## Tag Format

```
rule/<slug>-v<major>.<minor>.<patch>
```

Example: `rule/docker-v1.1.0`

## Adding a Rule

1. Add the rule to `rules/<slug>/` (universal source of truth).
2. Copy it here to `claude-code/rules/<slug>/`.
3. Add a corresponding `github-copilot/instructions/<slug>.instructions.md` with the appropriate `applyTo` glob in its frontmatter.
4. The rule content will be picked up by Codex CLI automatically via `AGENTS.md` (no additional wiring needed).
