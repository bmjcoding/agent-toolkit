# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Tag-presence enforcement: the pre-push hook now verifies that any `## [X.Y.Z]` header newly promoted from `[Unreleased]` in this push has a corresponding per-component git tag (`<slug>-vX.Y.Z`). Push is blocked until the tag exists, preventing version headers from landing without an accompanying tag.

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: v3.0 layout — hooks remain under `claude-code/hooks/changelog-check/`; historical skill/rule path patterns in some scripts were updated for the then-current layout.

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

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/changelog-check-v3.0.0...HEAD
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/changelog-check-v2.0.0...claude-code/changelog-check-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/changelog-check-v1.1.0...claude-code/changelog-check-v2.0.0
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/changelog-check-v1.0.0...changelog-check-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/changelog-check-v1.0.0
