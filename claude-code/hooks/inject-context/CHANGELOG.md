# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `hooks/inject-context/` → `claude-code/hooks/inject-context/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.1.0] - 2026-04-12

### Added

- Session-aware `ORCH_BASE` resolution: reads `.orchestrator/session.id` and injects context from `.orchestrator/sessions/<SID>/context/` when a valid session ID is present. Falls back to `.orchestrator/context/` when absent or malformed.

### Security

- SID value validated against `^[0-9]{8}T[0-9]{6}$` before use in path construction; path traversal via crafted `session.id` content prevented (sre-high-3).

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/inject-context-v2.0.0...HEAD
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/inject-context-v1.1.0...claude-code/inject-context-v2.0.0
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/inject-context-v1.0.0...inject-context-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/inject-context-v1.0.0
