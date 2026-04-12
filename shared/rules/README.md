# shared/rules/

Tool-agnostic rule fragments shared across agent toolchains.

These files contain directives that apply regardless of which AI coding tool is consuming them (Claude Code, GitHub Copilot, OpenAI Codex, etc.). They are intended to be imported into tool-specific rule files (e.g., `AGENTS.md` for Codex CLI / Copilot) or referenced from `claude-code/rules/` specializations.

## Rule Files

| File | Description | Claude Code specialization |
|------|-------------|---------------------------|
| `docker.md` | Dockerfile and docker-compose authoring conventions | `claude-code/rules/docker/docker.md` |
| `logging.md` | Language-appropriate logging (no print/console.log) | `claude-code/rules/logging/logging.md` |
| `node.md` | Node.js / JS / TS dependency and lockfile policy | `claude-code/rules/node/node.md` |
| `python.md` | Python dependency management with `uv` | `claude-code/rules/python/python.md` |

## Usage

**In AGENTS.md (Codex CLI / GitHub Copilot):**

```markdown
## Docker
<!-- shared/rules/docker.md -->
- Frontend and backend are always separate containers.
- Multi-layer builds, slim/alpine base images.
```

**In claude-code/rules/** files that want to extend shared content, reference the shared file in a comment and add Claude-specific frontmatter (path globs) on top.

## Design Notes

- These files do not carry version markers or CHANGELOG files — they are aggregations of tool-agnostic content extracted from versioned Claude Code rule components.
- The canonical source of truth for each rule's version history lives in the corresponding `claude-code/rules/<name>/CHANGELOG.md`.
