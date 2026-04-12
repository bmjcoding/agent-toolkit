# shared/

This directory is the **single source of truth for tool-agnostic content** — components that are authored once and consumed by multiple AI tools (Claude Code, GitHub Copilot, OpenAI Codex CLI, and future tools). Content here must use only plain Markdown conventions understood across all target tools; no Claude Code-specific YAML frontmatter fields that would be meaningless to Codex or Copilot.

## What Belongs Here

- `shared/skills/` — skills that apply universally (e.g., `changelog`, `git-ship`, `improve`, `owasp-reference`). Each skill lives in `shared/skills/<slug>/` with a `SKILL.md` and `CHANGELOG.md`. Claude Code reads skills from `~/.claude/skills/`; Codex CLI reads from `.agents/skills/`; Copilot reads from `.github/skills/` or `.claude/skills/`.
- `shared/rules/` — language and framework rules (Docker, Node, Python, logging) expressed as plain Markdown bullet lists. These are loaded by Claude Code via `.claude/rules/` symlinks and can be referenced directly by Copilot and Codex instructions.

## What Does NOT Belong Here

- Agent definitions that use Claude Code-specific frontmatter (`permissionMode`, `maxTurns`, `hooks`) — those live in `claude-code/agents/`.
- Commands (slash commands) — those are Claude Code-specific constructs and live in `claude-code/commands/`.
- Hooks — Claude Code-specific shell hooks live in `claude-code/hooks/`.

## Symlink Install (Claude Code)

After the restructure is complete, the Claude Code symlinks will point here for shared content:

```sh
~/.claude/skills -> /path/to/agent-toolkit/shared/skills
~/.claude/rules  -> /path/to/agent-toolkit/shared/rules
```
