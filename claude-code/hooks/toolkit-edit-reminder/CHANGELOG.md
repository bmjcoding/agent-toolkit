# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: v3.0 layout — hooks remain under `claude-code/hooks/toolkit-edit-reminder/`; skill/rule path patterns in some scripts updated to new `claude-code/skills/` and `claude-code/rules/` locations.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `hooks/toolkit-edit-reminder/` → `claude-code/hooks/toolkit-edit-reminder/`
- Shell script updated: scope filter regex updated for the new `claude-code/hooks/` and `shared/skills/` path prefixes.
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.0.0] - 2026-04-11

### Added

- PreToolUse hook that injects a CHANGELOG reminder when agents edit toolkit component files
- Scope filter targets agents, skills, hooks, commands, and rules directories in agent-toolkit and ~/.claude
- No-op when editing CHANGELOG.md itself to avoid recursive reminders

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/toolkit-edit-reminder-v3.0.0...HEAD
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/toolkit-edit-reminder-v2.0.0...claude-code/toolkit-edit-reminder-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/toolkit-edit-reminder-v1.0.0...claude-code/toolkit-edit-reminder-v2.0.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/toolkit-edit-reminder-v1.0.0
