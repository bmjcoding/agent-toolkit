# agent-toolkit — Multi-tool agent scaffolding

A configuration library for AI coding assistants. Provides agents, skills, rules, hooks,
and commands tested across three tools: **Claude Code**, **GitHub Copilot (VS Code)**,
and **OpenAI Codex CLI**.

Skills and rules live at the repo root (`/skills/`, `/rules/`) and are consumed by all
three tools. Tool-specific constructs (slash commands, hooks, VS Code prompts) live in
their own top-level dirs.

## Repository layout

```
agent-toolkit/
  skills/               # Universal skills (13) — shared across all tools
  rules/                # Universal rules (4: docker, logging, node, python)
  claude-code/          # Claude Code-specific
    agents/             # 15 agent definitions (.md + YAML frontmatter)
    commands/           # 6 slash commands
    hooks/              # 10 shell hooks (PreToolUse / PostToolUse)
    bundles/            # curated install bundles
    docs/               # Claude Code docs
    scripts/
      install.sh        # symlink manager for ~/.claude/
  github-copilot/       # GitHub Copilot (VS Code / cloud)
    agents/             # 15 .agent.md and cloud .md definitions
    instructions/       # 4 path-specific instruction files (from rules)
    prompts/            # 6 reusable prompt files (from commands)
    skills/             # changelog wrapper (other skills via install-time symlink)
    scripts/
  openai-codex/         # OpenAI Codex CLI
    agents/             # 15 <name>.toml agent definitions
    hooks/              # 9 .sh scripts + hooks.json
    config.toml.template # 13 [[skills.config]] entries
    scripts/
  AGENTS.md             # repo-wide instructions (read natively by all 3 tools)
```

## Components summary

| Type         | Tool            | Count |
|--------------|-----------------|-------|
| Agents       | Claude Code     | 15    |
| Commands     | Claude Code     | 6     |
| Hooks        | Claude Code     | 10    |
| Agents       | GitHub Copilot  | 15    |
| Instructions | GitHub Copilot  | 4     |
| Prompts      | GitHub Copilot  | 6     |
| Agents       | OpenAI Codex    | 15    |
| Hooks        | OpenAI Codex    | 9     |
| Skills       | Universal       | 13    |
| Rules        | Universal       | 4     |

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
~/.claude/rules    -> <repo>/rules
~/.claude/skills   -> <repo>/skills
```

Override repo root: `AGENT_TOOLKIT_DIR=/path/to/repo ./claude-code/scripts/install.sh`

> **Breaking change (v2.0.0)**: if you have existing `~/.claude/` symlinks pointing to
> the old monolithic or `shared/` layout, re-run `install.sh` to retarget them. Skills
> and rules now live at the repo root (`/skills/`, `/rules/`), not under `shared/`.

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

# Symlink universal skills (discoverable at install time)
ln -s "$(pwd)/skills" .github/skills
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

# Skills — Codex reads from .agents/skills/
ln -s "$(pwd)/skills" .agents/skills

# Config — copy the template and fill in your values
cp openai-codex/config.toml.template .codex/config.toml
```

Codex reads `AGENTS.md` natively — no import bridge needed.

## Versioning

Each component uses SemVer, versioned independently. Tag format:

```
claude-code/<slug>-v<version>      # Claude Code agents, commands, hooks
skill/<slug>-v<version>            # universal skills
rule/<slug>-v<version>             # universal rules
github-copilot/<slug>-v<version>   # Copilot-specific content
openai-codex/<slug>-v<version>     # Codex-specific content
```

## Contributing

When adding a new skill, follow the template in
`skills/changelog/SKILL.md`. Place the skill in `skills/<slug>/`
with a `SKILL.md` and `CHANGELOG.md`. If the skill needs Claude Code-specific
wiring (a command or hook), add those separately under `claude-code/`.

See [AGENTS.md](AGENTS.md) for the full agent instruction set and orchestrator
protocol.
