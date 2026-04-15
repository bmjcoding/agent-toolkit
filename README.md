# agent-toolkit — Multi-tool agent scaffolding

A configuration library for AI coding assistants. It provides shared skills, shared rules,
and tool-specific agents, commands, hooks, prompts, bundles, and install assets for
**Claude Code**, **GitHub Copilot for VS Code**, and **OpenAI Codex**.

`AGENTS.md` is the primary shared instruction source across tools. `CLAUDE.md` is a thin
compatibility shim for Claude-native consumers that import or read it directly.

## Repository layout

```text
agent-toolkit/
  docs/
    adr/                  # Repo-wide architecture decisions
    todo/                 # Working notes and follow-up docs
  agents/                 # Canonical shared agent instruction bodies
  skills/                 # Canonical shared skills
  rules/                  # Canonical shared rules
  workflows/              # Canonical shared workflow definitions
  claude-code/            # Claude-native agents, commands, hooks, bundles, docs, scripts
  github-copilot/         # VS Code Copilot-native agents, prompts, instructions, hooks, bundles
  openai-codex/           # Codex-native agents, hooks, bundles, config templates, rule build assets
  AGENTS.md               # Primary shared instructions
  CLAUDE.md               # Compatibility shim that imports AGENTS.md
```

## Ownership model

- Root `skills/` is the single source of truth for shared skill content.
- Root `rules/` is the single source of truth for shared rule content.
- Root `agents/` is the single source of truth for shared agent instruction bodies.
- Root `workflows/` is the single source of truth for shared workflow bodies.
- `AGENTS.md` is the canonical shared instruction file.
- `CLAUDE.md` is a compatibility shim, not the canonical shared instruction source.
- Tool directories contain only tool-native assets or adapters:
  - `claude-code/`: Claude frontmatter wrappers, slash-command adapters, hooks, bundles, docs, install scripts.
  - `github-copilot/`: VS Code Copilot agent adapters, prompt adapters, instruction adapters, hooks, bundles.
  - `openai-codex/`: Codex TOML agent adapters, hooks, bundles, config templates, rule composition assets.
- Shared skills and shared rules are versioned once only at the root:
  - `skill/<slug>-vX.Y.Z`
  - `rule/<slug>-vX.Y.Z`

## Install

### Claude Code

Claude Code loads tool-native surfaces from `~/.claude/`, while shared content comes from
the repo-root canonical directories.

```bash
TOOLKIT=$(pwd)
ln -sfn "$TOOLKIT/claude-code/agents"   ~/.claude/agents
ln -sfn "$TOOLKIT/claude-code/commands" ~/.claude/commands
ln -sfn "$TOOLKIT/claude-code/docs"     ~/.claude/docs
ln -sfn "$TOOLKIT/claude-code/hooks"    ~/.claude/hooks
ln -sfn "$TOOLKIT/rules"                ~/.claude/rules
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
ln -sfn "$TOOLKIT/github-copilot/bundles"      .github/bundles
ln -sfn "$TOOLKIT/github-copilot/hooks"        .github/hooks
ln -sfn "$TOOLKIT/github-copilot/instructions" .github/instructions
ln -sfn "$TOOLKIT/github-copilot/prompts"      .github/prompts
```

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

See [AGENTS.md](AGENTS.md), [CONTRIBUTING.md](CONTRIBUTING.md), and [docs/adr/](docs/adr/)
for the detailed repo conventions.
