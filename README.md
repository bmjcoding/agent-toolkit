# agent-toolkit — Multi-tool agent scaffolding

A configuration library for AI coding assistants. It provides shared skills, shared
rules, shared hooks, and tool-specific agents, commands, prompts, generated rule
adapters, and install assets, plus bundle manifests where the target tool supports them,
for **Claude Code**, **GitHub Copilot for VS Code**, and **OpenAI Codex**.

`AGENTS.md` is the primary shared instruction source across tools. Root `CLAUDE.md` is a
one-line Claude compatibility shim whose content is exactly `@AGENTS.md`.

## Repository layout

```text
agent-toolkit/
  docs/
    adr/                  # Repo-wide architecture decisions
  agents/                 # Canonical shared agent instruction bodies
  hooks/                  # Canonical shared hook logic
  skills/                 # Canonical shared skills
  rules/                  # Canonical shared rules
  workflows/              # Canonical shared workflow definitions
  claude-code/            # Claude-native agents, commands, hook docs, bundles, generated rule adapters, scripts
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
- Root `hooks/` is the canonical shared owner of hook logic.
- `AGENTS.md` is the canonical shared instruction file.
- `CLAUDE.md` is a one-line Claude compatibility shim, not the canonical shared
  instruction source.
- Tool directories contain only tool-native assets or adapters:
  - `claude-code/`: Claude frontmatter wrappers, slash-command adapters, hook docs, bundles, generated rule adapters, install scripts.
  - `github-copilot/`: VS Code Copilot agent adapters, prompt adapters, generated instruction adapters, hook manifests/adapters, install scripts.
  - `openai-codex/`: Codex TOML agent adapters, hooks, config templates, rule composition assets.
- Canonical root `rules/` content is adapted into:
  - `claude-code/rules/`
  - `github-copilot/instructions/`
- Shared skills and shared rules are versioned once only at the root:
  - `skill/<slug>-vX.Y.Z`
  - `rule/<slug>-vX.Y.Z`

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

Install Ruff in a local virtualenv with:

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
```

Run the repo linters with:

```sh
npm run lint
.venv/bin/ruff check .
```

Auto-fix what can be fixed with:

```sh
npm run lint:fix
.venv/bin/ruff check . --fix
```

The Node entrypoint covers:

- `eslint` for repository JavaScript
- `markdownlint-cli2` for Markdown docs and instruction files
- `prettier --check` for JSON and YAML

Ruff is configured separately for the Python utilities and helper scripts.
Python dev dependencies live in `requirements-dev.txt`.

## Install

### Claude Code

Claude Code loads tool-native surfaces from `~/.claude/`. Shared skills stay canonical at
repo root, while rules are exposed through generated adapters under `claude-code/rules/`.

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

For hooks, prefer `./github-copilot/scripts/install.sh --target /path/to/project`. The
installer flattens the checked-in hook manifests into the `.github/hooks/*.json` shape
that Copilot expects at runtime.

Or use:

```sh
./github-copilot/scripts/install.sh --target /path/to/project
./github-copilot/scripts/install.sh --target /path/to/project --dry-run
./github-copilot/scripts/install.sh --target /path/to/project --check
```

### OpenAI Codex

Codex reads `AGENTS.md` natively and should load shared skills from the repo-root
canonical `skills/` tree.

```sh
cp openai-codex/agents/*.toml ~/.codex/agents/
cp openai-codex/hooks/hooks.json ~/.codex/hooks.json
cp openai-codex/config.toml.template ~/.codex/config.toml
ln -sfn "$(pwd)/skills" .agents/skills
```

The config template points directly at `${AGENT_TOOLKIT_DIR}/skills/<slug>/SKILL.md`.

## Versioning

All components use SemVer and Keep a Changelog 1.1.0.

- Shared agents: `agent/<slug>-v<version>`
- Shared skills: `skill/<slug>-v<version>`
- Shared rules: `rule/<slug>-v<version>`
- Shared workflows: `workflow/<slug>-v<version>`
- Tool-specific assets:
  - `claude-code/<slug>-v<version>`
  - `github-copilot/<slug>-v<version>`
  - `openai-codex/<slug>-v<version>`

## Contributing

Add shared agents under `agents/<slug>/`, shared workflows under `workflows/<slug>/`,
shared skills under `skills/<slug>/`, and shared rules under `rules/<slug>/`. Add
tool-specific adapters only when a runtime requires a different format or discovery
surface, then regenerate them with `node scripts/sync-canonical-adapters.js` when
applicable.

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

Editing shared skills, indexed hook assets, or Claude bundle manifests also refreshes
`index.json`.

Pull requests fail if generated adapters or `index.json` are stale. Pushes to branches
auto-commit the regenerated outputs back to the branch when needed.

See [AGENTS.md](AGENTS.md), [CONTRIBUTING.md](CONTRIBUTING.md), and [docs/adr/](docs/adr/)
for the detailed repo conventions.
