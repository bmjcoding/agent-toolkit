# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.2.1] - 2026-04-15

### Changed

- Replaced the machine-specific toolkit-root fallback with `AGENT_TOOLKIT_DIR` or
  `TOOLKIT_PATH` resolution plus the current git repo root, so the canonical workflow
  and generated adapters no longer embed a local checkout path.

## [4.2.0] - 2026-04-15

### Changed

- Declared canonical `lifecycle` metadata in the shared root definition so the distribution catalog can publish maturity separately from per-tool availability for this workflow.

## [4.1.0] - 2026-04-15

### Changed

- Declared the shared argument hint in the canonical root workflow definition so command usage metadata is generated from the source of truth instead of copied back from adapters.

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: restructured for v3.0 per-tool layout. Claude Code remains under `claude-code/` for tool-native assets. At that point in history, shared rules and skills were described as living under `claude-code/rules/` and `claude-code/skills/`.

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

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/workflow/sync-toolkit-v4.2.1...HEAD
[4.2.1]: https://github.com/bmjcoding/agent-toolkit/compare/workflow/sync-toolkit-v4.2.0...workflow/sync-toolkit-v4.2.1
[4.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/workflow/sync-toolkit-v4.1.0...workflow/sync-toolkit-v4.2.0
[4.1.0]: https://github.com/bmjcoding/agent-toolkit/tree/workflow/sync-toolkit-v4.1.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/workflow/sync-toolkit-v2.0.0...workflow/sync-toolkit-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/workflow/sync-toolkit-v1.0.1...workflow/sync-toolkit-v2.0.0
[1.0.1]: https://github.com/bmjcoding/agent-toolkit/compare/workflow/sync-toolkit-v1.0.0...workflow/sync-toolkit-v1.0.1
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/workflow/sync-toolkit-v1.0.0
