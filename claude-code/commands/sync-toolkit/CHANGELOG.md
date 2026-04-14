# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Trimmed redundant restatements of the 'user-facing summaries, not commit-log dumps' constraint (3x → 1x).

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: restructured for v3.0 per-tool layout. Claude Code remains under `claude-code/` with all components fully self-contained. Rules and skills relocated to `claude-code/rules/` and `claude-code/skills/` (away from root).

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `commands/sync-toolkit/` → `claude-code/commands/sync-toolkit/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.0.1] - 2026-04-11

### Fixed

- Clarified that hook files under `~/.claude/hooks/` are installed via the Write tool, not Bash cp/mv; the protection applies to shell copy operations only, not Write tool writes
- Phase 3 instructions now explicitly specify the Write tool for all `~/.claude/` installations, resolving a contradiction with the Gotchas section

## [1.0.0] - 2026-04-11

### Added

- Slash command to detect changed toolkit components, generate user-facing CHANGELOG entries, copy to ~/.claude, and commit per-component
- Parallel agent dispatch for CHANGELOG generation — one agent per component, run concurrently
- `--dry-run`, `--no-pr`, and `--component TYPE/NAME` scope flags
- KaC no-commit-log-dumps enforcement instruction embedded in every spawned agent prompt
- Protected-path skip list for `~/.claude/settings.json`, `~/.claude/CLAUDE.md`, and `~/.claude/hooks/` contents
- Per-component commit strategy: one commit per component, routed through release-engineer per the frankenstein Ship phase rule

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/sync-toolkit-v3.0.0...HEAD
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/sync-toolkit-v2.0.0...claude-code/sync-toolkit-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/sync-toolkit-v1.0.1...claude-code/sync-toolkit-v2.0.0
[1.0.1]: https://github.com/bmjcoding/agent-toolkit/compare/sync-toolkit-v1.0.0...sync-toolkit-v1.0.1
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/sync-toolkit-v1.0.0
