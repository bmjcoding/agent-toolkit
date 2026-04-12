# claude-code/

This directory contains all **Claude Code-specific content** — components that use Claude Code's native YAML frontmatter, hook events, and permission model. These files are not portable to other AI tools without adaptation.

## Subdirectory Layout

```
claude-code/
  agents/     # Subagent definitions (.md with YAML frontmatter: name, description, tools, disallowedTools, permissionMode, maxTurns, ...)
  commands/   # Slash command definitions (.md loaded as /commandname in Claude Code sessions)
  hooks/      # Shell scripts wired to Claude Code hook events (PreToolUse, PostToolUse, SubagentStart, SubagentStop)
  bundles/    # JSON bundle manifests grouping related components for bulk install
```

## Install (Symlinks)

Claude Code loads these components via symlinks from `~/.claude/`:

```sh
~/.claude/agents   -> /path/to/agent-toolkit/claude-code/agents
~/.claude/commands -> /path/to/agent-toolkit/claude-code/commands
~/.claude/hooks    -> /path/to/agent-toolkit/claude-code/hooks   # hooks defined here; wired via settings.json
```

Hooks must also be registered in `~/.claude/settings.json` under the `hooks` key with the correct event type and matcher. See `claude-code/hooks/README.md` for wiring details.

## Component Format Reference

- **Agent** (`<name>.md`): YAML frontmatter with `name`, `description`, `tools`, `disallowedTools`, `permissionMode`, `maxTurns`, `effort`; body is Markdown instructions.
- **Command** (`<name>.md`): YAML frontmatter with `name`, `description`, `argument-hint`, `disable-model-invocation`; body is the command implementation prompt.
- **Hook** (`<name>.sh`): Plain Bash, registered by event type in `settings.json`; exit 2 blocks, exit 1 warns, exit 0 continues.
- **Bundle** (`<name>.json`): Flat JSON manifest with `bundleId`, `name`, `description`, `items[]`, `tags[]`, `status`.
