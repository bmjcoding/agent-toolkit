# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.1.0] - 2026-04-28

### Changed

- Canonical changelog ownership moved to root `hooks/branch-guard/CHANGELOG.md`. This Claude-local file now remains only as a historical redirect.

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: v3.0 layout — hooks remain under `claude-code/hooks/branch-guard/`; historical skill/rule path patterns in some scripts were updated for the then-current layout.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `hooks/branch-guard/` → `claude-code/hooks/branch-guard/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.0.0] - 2026-04-11

### Added

- Initial release
