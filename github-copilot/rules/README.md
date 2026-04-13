# github-copilot/rules/

GitHub Copilot adaptations of the 4 universal rules. Each rule is delivered as a `.instructions.md` file with `description` and `applyTo` glob frontmatter for VS Code to activate automatically on matching files.

| Rule | Description |
|---|---|
| `docker` | Docker and container conventions (pinned image tags, non-root USER, layer ordering) |
| `logging` | Structured logging conventions (log levels, context fields, no secrets in logs) |
| `node` | Node.js / TypeScript conventions (imports, error handling, async patterns) |
| `python` | Python conventions (type hints, virtual envs, pyproject.toml, uv) |

## Structure

Each rule lives in its own subdirectory:

```
github-copilot/rules/
  <slug>/
    <slug>.instructions.md   # Copilot rule with description + applyTo frontmatter
    CHANGELOG.md             # Per-rule version history
```

## Relationship to Universal Rules

The canonical rule content lives in `rules/<slug>/<slug>.md` at the repo root. The files here are Copilot-format adaptations: same rule body, but with `description` and `applyTo` YAML frontmatter instead of the `paths:` frontmatter used by Claude Code.

## Activation

`install.sh` symlinks `github-copilot/instructions/` to `.github/instructions/` in the target project for project-scoped activation. Alternatively, copy individual `<slug>.instructions.md` files into `.github/instructions/` in any project to apply that rule in Copilot Chat.

## Tag Format

```
rule/<slug>-v<major>.<minor>.<patch>
```

Example: `rule/docker-v1.1.0`
