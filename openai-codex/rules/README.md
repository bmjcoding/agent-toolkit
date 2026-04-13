# openai-codex/rules/

OpenAI Codex CLI port of the 4 universal rules. These files mirror the content
in `rules/` (the single source of truth) and are wired into Codex via `AGENTS.md`.

## How Codex reads rules

OpenAI Codex CLI reads `AGENTS.md` natively as its primary instruction file.
There is **no `applyTo` glob mechanism** and no `@import` directive — the entire
content of `AGENTS.md` (up to the 32 KiB merged cap) is loaded into every session.

To inject rules into a project's `AGENTS.md`, use `build-agents-md.sh`:

```sh
# Append all 4 rules to the project AGENTS.md
bash openai-codex/rules/build-agents-md.sh >> AGENTS.md
```

The install script (`openai-codex/scripts/install.sh`) can invoke this step
optionally during setup.

## Rules in this directory

| Rule | Source file | Description |
|---|---|---|
| `docker` | `docker/docker.md` | Docker and container conventions (pinned tags, non-root USER, layer ordering) |
| `logging` | `logging/logging.md` | Structured logging conventions (no print/console.log, use language-native loggers) |
| `node` | `node/node.md` | Node.js / TypeScript conventions (exact version pins, lockfile policy) |
| `python` | `python/python.md` | Python conventions (uv for deps, pyproject.toml, no pip install) |

## Structure

```
openai-codex/rules/
  <slug>/
    <slug>.md      # Rule content (YAML frontmatter + bullet rules)
    CHANGELOG.md   # Per-rule version history
  README.md        # This file
  build-agents-md.sh  # Script to compose rules into an AGENTS.md block
```

## Composition via build-agents-md.sh

`build-agents-md.sh` strips the YAML frontmatter from each rule `.md` file and
concatenates the bodies under section headers, producing a block suitable for
appending to any project's `AGENTS.md`:

```
## Rules

### Docker
...rule content...

### Logging
...rule content...

### Node
...rule content...

### Python
...rule content...
```

## Keeping rules in sync

The authoritative rule content lives in `rules/<slug>/<slug>.md` at the repo
root (or in `claude-code/rules/` after the v3.0 restructure). When a rule is
updated, copy the new content to `openai-codex/rules/<slug>/<slug>.md` and bump
the CHANGELOG entry here.

## Tag format

```
openai-codex/<slug>-v<major>.<minor>.<patch>
```

Example: `openai-codex/docker-v3.0.0`
