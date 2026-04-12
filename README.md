# agent-toolkit — Multi-tool agent scaffolding

A configuration library for AI coding assistants. Provides agents, skills, rules, hooks,
and commands tested across three tools: **Claude Code**, **GitHub Copilot (VS Code)**,
and **OpenAI Codex CLI**.

Skills live in `shared/` and are consumed by all three tools. Tool-specific
constructs (slash commands, hooks, VS Code prompts) live in their own top-level dirs.

## Repository layout

```
agent-toolkit/
  claude-code/          # Claude Code-specific
    agents/             # 15 agent definitions (.md + YAML frontmatter)
    commands/           # 6 slash commands
    hooks/              # 10 shell hooks (PreToolUse / PostToolUse)
    bundles/            # curated install bundles
    docs/               # Claude Code docs
    scripts/
      install.sh        # symlink manager for ~/.claude/
  github-copilot/       # GitHub Copilot (VS Code / cloud)
    agents/             # .agent.md and cloud .md definitions
    mcp/                # MCP server stubs
    skills/             # Copilot-format skills
    scripts/
  openai-codex/         # OpenAI Codex CLI
    agents/             # <name>.toml agent definitions
    hooks/              # experimental hooks
    scripts/
  shared/               # Tool-agnostic content (single source of truth)
    skills/             # 13 skills shared across all tools
    rules/              # 5 language/framework rule sets (Docker, Node, Python, logging)
  AGENTS.md             # repo-wide instructions (read natively by all 3 tools)
```

## Components summary

| Type     | Tool          | Count |
|----------|---------------|-------|
| Agents   | Claude Code   | 15    |
| Commands | Claude Code   | 6     |
| Hooks    | Claude Code   | 10    |
| Skills   | Shared        | 13    |
| Rules    | Shared        | 5     |

All 48 components are versioned independently with SemVer.

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
~/.claude/skills   -> <repo>/shared/skills
```

Override repo root: `AGENT_TOOLKIT_DIR=/path/to/repo ./claude-code/scripts/install.sh`

> **Breaking change (v2.0.0)**: if you have existing `~/.claude/` symlinks pointing to
> the old monolithic layout, re-run `install.sh` to retarget them. The old `skills/`
> path now lives at `shared/skills/`; the old `rules/` path is now `shared/rules/`.

### GitHub Copilot (VS Code)

VS Code resolves agents from `.github/agents/`. Symlink or copy from `github-copilot/`:

```sh
# Symlink the agents dir
ln -s "$(pwd)/github-copilot/agents" .github/agents

# Or copy individual agent files
cp github-copilot/agents/*.agent.md .github/agents/
```

Repository-wide instructions are already in `AGENTS.md` (repo root) and
`.github/copilot-instructions.md`. No additional setup is required for those.

### OpenAI Codex CLI

Codex CLI reads agents from `~/.codex/agents/` (global) or `.codex/agents/`
(project-scoped, trusted repos only). Copy TOML definitions:

```sh
# Global install
cp openai-codex/agents/*.toml ~/.codex/agents/

# Skills — Codex reads from .agents/skills/
ln -s "$(pwd)/shared/skills" .agents/skills
```

Codex reads `AGENTS.md` natively — no import bridge needed.

## Versioning

Each component uses SemVer, versioned independently. Tag format:

```
claude-code/<slug>-v<version>      # agents, commands, hooks
shared/<slug>-v<version>           # skills, rules
```

## Contributing

When adding a new skill, follow the template in
`shared/skills/changelog/SKILL.md`. Place the skill in `shared/skills/<slug>/`
with a `SKILL.md` and `CHANGELOG.md`. If the skill needs Claude Code-specific
wiring (a command or hook), add those separately under `claude-code/`.

See [AGENTS.md](AGENTS.md) for the full agent instruction set and orchestrator
protocol.
