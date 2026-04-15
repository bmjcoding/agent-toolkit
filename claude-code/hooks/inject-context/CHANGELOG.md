# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Canonical changelog ownership moved to root `hooks/inject-context/CHANGELOG.md`. This Claude-local file now remains only as a historical redirect.

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: v3.0 layout — hooks remain under `claude-code/hooks/inject-context/`; historical skill/rule path patterns in some scripts were updated for the then-current layout.

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

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/inject-context-v3.0.0...HEAD
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/inject-context-v2.0.0...claude-code/inject-context-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/inject-context-v1.1.0...claude-code/inject-context-v2.0.0
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/inject-context-v1.0.0...claude-code/inject-context-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/claude-code/inject-context-v1.0.0
