# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `agents/backend-engineer/` → `claude-code/agents/backend-engineer/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.2.0] - 2026-04-11

### Added

- Post-change compile check step: run tsc --noEmit after all changes before writing handoff

## [1.1.0] - 2026-04-11

### Added

- Fixture creation rules: no-symlinks prohibition, VALID_PREFIXES reset validation, live count check before assertions

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/backend-engineer-v2.0.0...HEAD
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/backend-engineer-v1.2.0...claude-code/backend-engineer-v2.0.0
[1.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/backend-engineer-v1.1.0...backend-engineer-v1.2.0
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/backend-engineer-v1.0.0...backend-engineer-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/backend-engineer-v1.0.0
