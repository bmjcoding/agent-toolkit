# agent-toolkit — Multi-tool agent scaffolding

A configuration library for AI coding assistants. It provides shared skills, shared
rules, shared hooks, and tool-specific agents, commands, prompts, generated rule
adapters, and install assets, plus bundle manifests where the target tool supports them,
for **Claude Code**, **GitHub Copilot for VS Code**, and **OpenAI Codex**.

`AGENTS.md` is the primary shared instruction source across tools. Root `CLAUDE.md` is a
one-line Claude compatibility shim whose content is exactly `@AGENTS.md`.

## Contribution Entry Point

Before opening a pull request, run the repo-local Claude contribution assistant at
`.claude/agents/contribution-assistant.md`. It standardizes changed components, updates
versioned changelogs, regenerates generated assets, and runs the local checks that mirror
CI. If Claude is unavailable, run `npm run check` directly before committing.

## Repository layout

```text
agent-toolkit/
  .claude/               # Repo-local Claude contribution assistant and supporting skills
  .github/               # GitHub CI, templates, and ownership metadata
  docs/
    adr/                  # Repo-wide architecture decisions
  agents/                 # Canonical shared agent instruction bodies
  hooks/                  # Canonical shared hook logic
  skills/                 # Canonical shared skills, categorized as skills/<category>/.../<slug>/
  rules/                  # Canonical shared rules
  workflows/              # Canonical shared workflow definitions
  bundles/                # Canonical shared bundle manifests
  scripts/                # Repo maintenance, validation, generation, and smoke scripts
  claude-code/            # Claude-native agents, commands, hook docs, generated rule adapters, scripts
  github-copilot/         # VS Code Copilot-native agents, prompts, instructions, hooks, scripts
  openai-codex/           # Codex-native agents, hooks, config templates, rule build assets
  AGENTS.md               # Primary shared instructions
  CLAUDE.md               # One-line Claude compatibility shim: @AGENTS.md
```

## Ownership model

- Root `skills/` is the single source of truth for shared skill content.
- Root `rules/` is the single source of truth for shared rule content.
- Root `agents/` is the single source of truth for shared agent instruction bodies.
- Root `workflows/` is the single source of truth for shared workflow bodies.
- Root `bundles/` is the single source of truth for shared bundle manifests.
- Root `hooks/` is the canonical shared owner of hook logic.
- `AGENTS.md` is the canonical shared instruction file.
- `CLAUDE.md` is a one-line Claude compatibility shim, not the canonical shared
  instruction source.
- Tool directories contain only tool-native assets or adapters:
- `claude-code/`: Claude frontmatter wrappers, slash-command adapters, hook docs, generated rule adapters, install scripts.
  - `github-copilot/`: VS Code Copilot agent adapters, prompt adapters, generated instruction adapters, hook manifests/adapters, install scripts.
  - `openai-codex/`: Codex TOML agent adapters, hooks, config templates, rule composition assets.
- Canonical root `rules/` content is adapted into:
  - `claude-code/rules/`
  - `github-copilot/instructions/`
- Shared skills and shared rules are versioned once only in their canonical root
  changelogs.

## Distribution Catalog

`index.json` is the generated machine-readable distribution catalog for external
consumers. It is artifact-oriented and tool-aware: each entry resolves a concrete
checked-in asset with its component id, kind, version, target tool, artifact path,
install metadata, checksum, and any bundle or capability metadata the installer needs.

Regenerate it with:

```sh
node scripts/generate-index.js
```

Smoke-test the full adapter and catalog generation flow with:

```sh
node scripts/smoke-generated-assets.js
```

## Linting

Install the Node-based lint tooling with:

```sh
npm ci
```

Run Ruff via `uvx` with the repo-pinned version:

```sh
uvx --from ruff==0.15.10 ruff check .
```

Run the repo linters with:

```sh
npm run lint
npm run lint:py
```

Auto-fix what can be fixed with:

```sh
npm run lint:fix
npm run lint:py:fix
```

The Node entrypoint covers:

- `eslint` for repository JavaScript
- `markdownlint-cli2` for Markdown docs and instruction files
- `prettier --check` for JSON and YAML

Ruff is configured in `pyproject.toml` and invoked through the pinned `uvx` command in
`package.json`.

## Install

### Claude Code

Claude Code loads tool-native surfaces from `~/.claude/`. Shared skills stay canonical at
repo root, while rules are exposed through generated adapters under `claude-code/rules/`.
This repository also includes repo-local contribution helpers under `.claude/`:
`contribution-assistant` and its `contribution-changelog` skill. The repo-local
`.claude/skills/definition-review` and `.claude/skills/improve` entries are symlinks to the
canonical shared skills, so contributors can use the assistant without first installing
the whole toolkit globally.

```bash
TOOLKIT=$(pwd)
ln -sfn "$TOOLKIT/claude-code/agents"   ~/.claude/agents
ln -sfn "$TOOLKIT/claude-code/commands" ~/.claude/commands
ln -sfn "$TOOLKIT/hooks"                ~/.claude/hooks
ln -sfn "$TOOLKIT/claude-code/rules"    ~/.claude/rules
ln -sfn "$TOOLKIT/skills"               ~/.claude/skills
```

Or use:

```sh
./claude-code/scripts/install.sh
./claude-code/scripts/install.sh --dry-run
./claude-code/scripts/install.sh --check
```

### GitHub Copilot for VS Code

VS Code Copilot uses `.github/` for its runtime surfaces. Canonical shared content stays
at the repo root and is adapted into the Copilot-native files under `github-copilot/`.

```sh
TOOLKIT=$(pwd)
ln -sfn "$TOOLKIT/github-copilot/agents"       .github/agents
ln -sfn "$TOOLKIT/github-copilot/instructions" .github/instructions
ln -sfn "$TOOLKIT/github-copilot/prompts"      .github/prompts
```

For hooks, prefer `bash github-copilot/scripts/install.sh --target /path/to/project`. The
installer flattens the checked-in hook manifests into the `.github/hooks/*.json` shape
that Copilot expects at runtime.

Or use:

```sh
bash github-copilot/scripts/install.sh --target /path/to/project
bash github-copilot/scripts/install.sh --target /path/to/project --dry-run
bash github-copilot/scripts/install.sh --target /path/to/project --check
```

### OpenAI Codex

Codex reads `AGENTS.md` natively and should load shared skills from the repo-root
canonical `skills/` tree.

```sh
export AGENT_TOOLKIT_DIR="$(pwd)"
mkdir -p "$HOME/.codex/agents" .agents
cp openai-codex/agents/*.toml "$HOME/.codex/agents/"
ln -sfn "$AGENT_TOOLKIT_DIR/openai-codex/hooks/hooks.json" "$HOME/.codex/hooks.json"
mkdir -p "$HOME/.codex/openai-codex"
ln -sfn "$AGENT_TOOLKIT_DIR/openai-codex/hooks" "$HOME/.codex/openai-codex/hooks"
cp openai-codex/config.toml.template "$HOME/.codex/config.toml"
ln -sfn "$AGENT_TOOLKIT_DIR/skills" .agents/skills
```

The config template points directly at
`${AGENT_TOOLKIT_DIR}/skills/<category>/.../<slug>/SKILL.md`.
Use the installer instead of the manual `cp` flow if you already have a populated
`~/.codex/config.toml`; the installer appends skill entries and preserves existing
settings. The `.agents/skills` symlink is an optional project-local discovery fallback.
The `~/.codex/openai-codex/hooks` symlink preserves the generated Codex hook fallback
path when `AGENT_TOOLKIT_DIR` is not exported into the Codex runtime shell. If your
checkout predates the executable-bit repair for generated hook adapters, run
`bash openai-codex/scripts/install.sh` once to repair hook shell permissions in place.

## Versioning

All components use SemVer and Keep a Changelog 1.1.0.

Versions live in each component's `CHANGELOG.md` section headers, for example
`## [1.2.3] - 2026-04-28`. This repository does not require release tags or tag-backed
comparison links; that keeps the changelog policy portable to Bitbucket Data Center.

## Contributing

Add shared agents under `agents/<slug>/`, shared workflows under `workflows/<slug>/`,
shared skills under `skills/<category>/.../<slug>/`, and shared rules under `rules/<slug>/`.
Skill category directories are discovered recursively; do not hardcode the current
category set in scripts or docs. Add tool-specific adapters only when a runtime requires
a different format or discovery surface, then regenerate them with
`node scripts/sync-canonical-adapters.js` when applicable.

Before opening a contribution PR, use `.claude/agents/contribution-assistant.md` or run
`npm run check` directly. Toolkit changelogs use one-and-done versioned entries: every
touched component gets a bumped `## [X.Y.Z] - YYYY-MM-DD` section, not an `[Unreleased]`
entry.

When canonical shared content changes, CI also re-runs adapter sync and catalog
generation. For example, editing `agents/frankenstein/AGENT.md` regenerates:

- `claude-code/agents/`
- `github-copilot/agents/`
- `openai-codex/agents/`
- `index.json`

Editing a canonical workflow under `workflows/<slug>/WORKFLOW.md` regenerates:

- `claude-code/commands/`
- `github-copilot/prompts/`
- `index.json`

Editing a canonical rule under `rules/<slug>/<slug>.md` regenerates:

- `claude-code/rules/`
- `github-copilot/instructions/`
- `index.json`

Editing shared skills, indexed hook assets, or canonical bundle manifests also refreshes
`index.json`.

Pull requests fail if generated adapters, generated hook surfaces, or `index.json` are
stale. Pushes to branches auto-commit the regenerated outputs back to the branch when
needed. CI also re-runs the repository secret scan so contributors are not relying only
on locally installed pre-push hooks.

See [AGENTS.md](AGENTS.md), [CONTRIBUTING.md](CONTRIBUTING.md), and [docs/adr/](docs/adr/)
for the detailed repo conventions.
