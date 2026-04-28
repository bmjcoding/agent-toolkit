# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.1.0] - 2026-04-28

### Added

- Tag-presence enforcement: the pre-push hook now verifies that any `## [X.Y.Z]` header
  newly promoted from temporary unreleased staging in this push has a corresponding
  per-component git tag (`<slug>-vX.Y.Z`). Push is blocked until the tag exists,
  preventing version headers from landing without an accompanying tag.

### Changed

- Canonical changelog ownership moved to root `hooks/changelog-check/CHANGELOG.md`. This Claude-local file now remains only as a historical redirect.

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

- Format validation — verify touched CHANGELOG.md has a valid Keep a Changelog header in addition to the existing presence check

## [1.0.0] - 2026-04-11

### Added

- Initial release
