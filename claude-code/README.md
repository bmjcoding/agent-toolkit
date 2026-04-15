# claude-code/

This directory contains **Claude Code-specific adapters and runtime assets** — components
that exist because Claude Code requires native YAML frontmatter, slash-command files, hook
event wiring, and install surfaces that differ from other tools.

## Subdirectory Layout

```
claude-code/
  agents/     # Claude frontmatter wrappers for canonical root agents/
  commands/   # Claude slash-command wrappers for canonical root workflows/
  hooks/      # 9 shell scripts wired to Claude Code hook events (PreToolUse, PostToolUse, SubagentStart, SubagentStop)
  bundles/    # YAML bundle files grouping related components for bulk install
  docs/       # Architecture decision records, migration guides, UX design docs
  scripts/
    install.sh  # Symlink manager for ~/.claude/
```

Canonical agents live at repo-root `agents/`. Canonical workflows live at repo-root
`workflows/`. Shared skills and rules live at repo-root `skills/` and `rules/`.

## Install (Symlinks)

Claude Code loads these components via symlinks from `~/.claude/`:

```sh
~/.claude/agents   -> /path/to/agent-toolkit/claude-code/agents
~/.claude/commands -> /path/to/agent-toolkit/claude-code/commands
~/.claude/docs     -> /path/to/agent-toolkit/claude-code/docs
~/.claude/hooks    -> /path/to/agent-toolkit/claude-code/hooks
~/.claude/rules    -> /path/to/agent-toolkit/claude-code/rules
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

- **Agent** (`<name>.md`): Claude-native frontmatter wrapper around the canonical root
  `agents/<name>/AGENT.md` body.
- **Command** (`<name>.md`): Claude-native slash-command wrapper around the canonical root
  `workflows/<name>/WORKFLOW.md` body.
- **Hook** (`<name>.sh`): Plain Bash, registered by event type in `settings.json`; exit 2 blocks, exit 1 warns, exit 0 continues.
- **Bundle** (`bundle.yaml`): YAML file with `id`, `name`, `description`, `status`, `tags[]`, `components[]` (each entry has `type`, `id`, `role`). Dependency metadata for agents and skills is declared in the component's own `.md` frontmatter (`tools:` for agents, `skills:` for skills/commands), not in the bundle file. Valid `role` values: `core` (required for the bundle to function), `optional` (nice-to-have, installable separately), `deprecated` (scheduled for removal). All current entries use `core`. The generated `index.json` distribution catalog is the stable lookup surface for bundle artifacts; use each entry's `artifact_path`, `component_version`, checksum, and install metadata instead of reconstructing paths from slugs.

## Tag Format

```
claude-code/<slug>-v<major>.<minor>.<patch>
```

Example: `claude-code/frankenstein-v3.1.0`
