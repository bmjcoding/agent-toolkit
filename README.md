# agent-toolkit — Multi-tool agent scaffolding

A configuration library for AI coding assistants. Provides agents, skills, rules, hooks,
and commands tested across three tools: **Claude Code**, **GitHub Copilot (VS Code)**,
and **OpenAI Codex CLI**.

Each tool directory is fully self-contained: it includes its own copy of skills, rules,
and bundles. Tool-specific constructs (slash commands, hooks, VS Code prompts) also live
within each tool dir. Repo-wide ADRs and UX docs are in `/docs/`.

## Repository layout

```
agent-toolkit/
  docs/                 # Repo-wide documentation
    adr/                # Architecture Decision Records (repo-wide scope)
    ux/                 # UX design specs (multi-tool scope)
  claude-code/          # Claude Code — fully self-contained
    agents/             # 15 agent definitions (.md + YAML frontmatter)
    commands/           # 6 slash commands
    hooks/              # 9 shell hooks (PreToolUse / PostToolUse)
    bundles/            # 8 curated install bundles
    skills/             # 13 skill definitions
    rules/              # 4 rule sets (docker, logging, node, python)
    docs/               # Claude Code-specific ADRs and operational docs
    scripts/
      install.sh        # symlink manager for ~/.claude/
  github-copilot/       # GitHub Copilot (VS Code / cloud) — fully self-contained
    agents/             # 15 .agent.md definitions
    instructions/       # 4 path-scoped instruction files
    prompts/            # 6 reusable prompt files
    hooks/              # 9 hook JSON files
    bundles/            # 8 curated install bundles
    skills/             # 13 skill wrappers
    rules/              # 4 rule sets
    mcp/                # MCP server config template (maps to .vscode/mcp.json at install time)
    scripts/
  openai-codex/         # OpenAI Codex CLI — fully self-contained
    agents/             # 15 <name>.toml agent definitions
    hooks/              # 9 .sh scripts + hooks.json
    bundles/            # 8 curated install bundles
    skills/             # 13 skill definitions
    rules/              # 4 rule sets
    config.toml.template # 13 [[skills.config]] entries
    scripts/
  AGENTS.md             # repo-wide instructions (read natively by all 3 tools)
```

## Components summary

| Type         | Tool            | Count |
|--------------|-----------------|-------|
| Agents       | Claude Code     | 15    |
| Commands     | Claude Code     | 6     |
| Hooks        | Claude Code     | 9     |
| Agents       | GitHub Copilot  | 15    |
| Instructions | GitHub Copilot  | 4     |
| Prompts      | GitHub Copilot  | 6     |
| Agents       | OpenAI Codex    | 15    |
| Hooks        | OpenAI Codex    | 9     |
| Skills       | All tools       | 13 (per tool) |
| Rules        | All tools       | 4 (per tool)  |

All components are versioned independently with SemVer.

## Install

### Claude Code

Run the install script to create symlinks from `~/.claude/` into this repo:

```sh
# Default (apply symlinks)
./claude-code/scripts/install.sh

# Dry-run (preview changes, no writes)
./claude-code/scripts/install.sh --dry-run

# Verify existing symlinks
./claude-code/scripts/install.sh --check
```

Symlink map:

```
~/.claude/agents   -> <repo>/claude-code/agents
~/.claude/commands -> <repo>/claude-code/commands
~/.claude/docs     -> <repo>/claude-code/docs
~/.claude/hooks    -> <repo>/claude-code/hooks
~/.claude/rules    -> <repo>/claude-code/rules
~/.claude/skills   -> <repo>/claude-code/skills
```

Override repo root: `AGENT_TOOLKIT_DIR=/path/to/repo ./claude-code/scripts/install.sh`

> **Breaking change (v3.0.0)**: if you have existing `~/.claude/` symlinks pointing to
> the repo-root `rules/` or `skills/` directories, re-run `install.sh` to retarget them.
> Skills and rules now live inside each tool directory (`claude-code/rules/`,
> `claude-code/skills/`). The root `skills/` and `rules/` directories no longer exist.

### GitHub Copilot (VS Code)

VS Code resolves agents from `.github/agents/`. Use the Copilot install script or wire
manually:

```sh
# Symlink agents dir
ln -s "$(pwd)/github-copilot/agents" .github/agents

# Symlink instructions dir
ln -s "$(pwd)/github-copilot/instructions" .github/instructions

# Symlink prompts dir
ln -s "$(pwd)/github-copilot/prompts" .github/prompts

# Symlink skills (Copilot-specific wrappers)
ln -s "$(pwd)/github-copilot/skills" .github/skills
```

Repository-wide instructions are already in `AGENTS.md` (repo root) and
`.github/copilot-instructions.md`. No additional setup is required for those.

### OpenAI Codex CLI

Codex CLI reads agents from `~/.codex/agents/` (global) or `.codex/agents/`
(project-scoped, trusted repos only). Copy TOML definitions:

```sh
# Global install
cp openai-codex/agents/*.toml ~/.codex/agents/

# Hooks — copy hooks.json to your project .codex dir
cp openai-codex/hooks/hooks.json .codex/hooks.json

# Skills — Codex reads from .agents/skills/ (or inline via AGENTS.md)
ln -s "$(pwd)/openai-codex/skills" .agents/skills

# Config — copy the template and fill in your values
cp openai-codex/config.toml.template .codex/config.toml
```

Codex reads `AGENTS.md` natively — no import bridge needed.

## Versioning

Each component uses SemVer, versioned independently. Tag format:

```
claude-code/<slug>-v<version>      # Claude Code agents, commands, hooks, skills, rules
github-copilot/<slug>-v<version>   # Copilot agents, instructions, prompts, hooks, skills, rules
openai-codex/<slug>-v<version>     # Codex agents, hooks, skills, rules, config
```

## Contributing

When adding a new skill, follow the template in `claude-code/skills/changelog/SKILL.md`.
Place the skill in `<tool>/skills/<slug>/` for each tool you want to support, with a
`SKILL.md` and `CHANGELOG.md` in each copy. If the skill needs Claude Code-specific
wiring (a command or hook), add those separately under `claude-code/`.

See [AGENTS.md](AGENTS.md) for the full agent instruction set and orchestrator
protocol. Repo-wide ADRs are in [docs/adr/](docs/adr/).
