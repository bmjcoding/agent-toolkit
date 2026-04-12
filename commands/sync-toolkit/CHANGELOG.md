# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/bmjcoding/claude-toolkit/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/bmjcoding/claude-toolkit/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/bmjcoding/claude-toolkit/releases/tag/v1.0.0
