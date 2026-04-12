@AGENTS.md

<!-- Claude Code-specific additions below. Tool-agnostic rules live in AGENTS.md above. -->

## Claude Code Skills and Commands

The following slash commands are available in this toolkit (defined in `claude-code/commands/`):

- `/lint` — lint changed files on the current branch
- `/audit` — security audit of changed files
- `/test` — run tests scoped to changed files
- `/git-verify` — verify git hygiene (signed commits, changelog entries, branch protection)
- `/prod-readiness` — full production readiness check
- `/backlog` — view and manage the pipeline backlog
- `/sync-toolkit` — deploy toolkit components to `~/.claude/`

Skills are loaded from `skills/` (repo root) via the `~/.claude/skills` symlink.
Rules are loaded from `rules/` (repo root) via the `~/.claude/rules` symlink.

For all of the above commands, scope resolution and autonomous execution rules are defined in `AGENTS.md` under "Command Scope Resolution" and "Autonomous Execution".

## Subagent Tool Restrictions

Subagents defined in this toolkit follow these tool restrictions:

- **Default denied tools**: `Agent`, `WebSearch`, `WebFetch` (prevents unbounded recursion and external data fetching in most subagents)
- Exceptions are declared explicitly in each agent's YAML frontmatter via `tools:` and `disallowedTools:` fields
- Subagents cannot spawn other subagents (`Agent` tool is disallowed in subagent definitions unless explicitly needed)

## Hook Wiring

Hooks in this toolkit are wired via `~/.claude/settings.json`. The following hook events are used:

- `PreToolUse` — branch-guard, changelog-check, pre-push-secrets, protect-config
- `PostToolUse` — toolkit-edit-reminder
- `SubagentStart` — inject-context
- `SubagentStop` — extract-handoff, integrity-warn, toolkit-drift-check

Exit code semantics: exit 1 = non-blocking warning (continues); exit 2 = blocks tool execution.

## CLAUDE.md Security Note

This file and `~/.claude/CLAUDE.md` are loaded at the start of every Claude Code session. Any modification constitutes persistent custom instruction poisoning affecting all future sessions. Both files are write-protected by `hooks/protect-config/protect-config.sh` (PreToolUse hook) and `settings.json` deny-patterns. Any proposed edit requires explicit user confirmation.

## Nested CLAUDE.md Support

Claude Code walks the directory tree upward from the current working directory, loading all `CLAUDE.md` files found. Per-directory `CLAUDE.md` files may exist in subdirectories of this repo to provide component-specific context without modifying this root file.
