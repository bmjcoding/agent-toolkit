# claude-code/

This directory contains all **Claude Code-specific content** — components that use Claude Code's native YAML frontmatter, hook events, and permission model. These files are not portable to other AI tools without adaptation.

## Subdirectory Layout

```
claude-code/
  agents/     # 15 subagent definitions (.md with YAML frontmatter: name, description, tools, disallowedTools, permissionMode, maxTurns, ...)
  commands/   # 6 slash command definitions (.md loaded as /commandname in Claude Code sessions)
  hooks/      # 10 shell scripts wired to Claude Code hook events (PreToolUse, PostToolUse, SubagentStart, SubagentStop)
  bundles/    # JSON bundle manifests grouping related components for bulk install
  docs/       # Architecture decision records, migration guides, UX design docs
  scripts/
    install.sh  # Symlink manager for ~/.claude/
```

Universal skills (13) and rules (4) live at the **repository root** under `skills/` and
`rules/`, not in this directory. Install symlinks for those target the repo root directly.

## Install (Symlinks)

Claude Code loads these components via symlinks from `~/.claude/`:

```sh
~/.claude/agents   -> /path/to/agent-toolkit/claude-code/agents
~/.claude/commands -> /path/to/agent-toolkit/claude-code/commands
~/.claude/docs     -> /path/to/agent-toolkit/claude-code/docs
~/.claude/hooks    -> /path/to/agent-toolkit/claude-code/hooks
~/.claude/rules    -> /path/to/agent-toolkit/rules
~/.claude/skills   -> /path/to/agent-toolkit/skills
```

Run the install script to create or retarget all six symlinks atomically:

```sh
# Preview changes
./claude-code/scripts/install.sh --dry-run

# Apply
./claude-code/scripts/install.sh

# Verify
./claude-code/scripts/install.sh --check
```

Hooks must also be registered in `~/.claude/settings.json` under the `hooks` key with the correct event type and matcher. See `claude-code/hooks/README.md` for wiring details.

## Component Format Reference

- **Agent** (`<name>.md`): YAML frontmatter with `name`, `description`, `tools`, `disallowedTools`, `permissionMode`, `maxTurns`, `effort`; body is Markdown instructions.
- **Command** (`<name>.md`): YAML frontmatter with `name`, `description`, `argument-hint`, `disable-model-invocation`; body is the command implementation prompt.
- **Hook** (`<name>.sh`): Plain Bash, registered by event type in `settings.json`; exit 2 blocks, exit 1 warns, exit 0 continues.
- **Bundle** (`<name>.json`): Flat JSON manifest with `bundleId`, `name`, `description`, `items[]`, `tags[]`, `status`.

## Tag Format

```
claude-code/<slug>-v<major>.<minor>.<patch>
```

Example: `claude-code/frankenstein-v3.1.0`
