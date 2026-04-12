# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `hooks/changelog-check/` → `claude-code/hooks/changelog-check/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.1.0] - 2026-04-11

### Added

- Format validation — verify touched CHANGELOG.md has a valid KaC header (## [X.Y.Z] - YYYY-MM-DD or ## [Unreleased]) in addition to the existing presence check

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/changelog-check-v2.0.0...HEAD
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/changelog-check-v1.1.0...claude-code/changelog-check-v2.0.0
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/changelog-check-v1.0.0...changelog-check-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/changelog-check-v1.0.0
