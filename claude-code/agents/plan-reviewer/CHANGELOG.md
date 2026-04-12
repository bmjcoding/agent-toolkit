# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `agents/plan-reviewer/` → `claude-code/agents/plan-reviewer/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.3.0] - 2026-04-12

### Added

- Handoff status schema: `revise` added as an explicit valid enum value alongside `approve`; the extract-handoff hook now accepts `revise` without rejection, enabling plan-reviewer to request plan amendments without emitting `needs_human` (REC-4).

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/plan-reviewer-v2.0.0...HEAD
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/plan-reviewer-v1.3.0...claude-code/plan-reviewer-v2.0.0
[1.3.0]: https://github.com/bmjcoding/agent-toolkit/compare/plan-reviewer-v1.2.0...plan-reviewer-v1.3.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/plan-reviewer-v1.0.0
