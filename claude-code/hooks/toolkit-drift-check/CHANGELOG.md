# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `hooks/toolkit-drift-check/` → `claude-code/hooks/toolkit-drift-check/`
- Shell script updated: component path regex updated for the new `claude-code/hooks/` prefix.
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.0.1] - 2026-04-11

### Fixed

- Sanitized `SESSION_KEY` derived from `$CLAUDE_SESSION_ID` to strip non-alphanumeric characters, preventing path traversal via a malformed session ID value
- Eliminated dead `COMPONENT_PATTERN` variable that was defined but never referenced; the grep filter now uses it as a single source of truth for the component path pattern

## [1.0.0] - 2026-04-11

### Added

- SubagentStop hook that detects toolkit component edits without a paired CHANGELOG.md update and warns to stderr
- Per-session dedup flag to suppress repeated warnings within a single Claude Code session
- TOOLKIT_PATH env var override for non-standard toolkit install locations

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/toolkit-drift-check-v2.0.0...HEAD
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/toolkit-drift-check-v1.0.1...claude-code/toolkit-drift-check-v2.0.0
[1.0.1]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/toolkit-drift-check-v1.0.0...claude-code/toolkit-drift-check-v1.0.1
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/toolkit-drift-check-v1.0.0
