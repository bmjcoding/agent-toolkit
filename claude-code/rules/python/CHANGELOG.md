# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: relocated from `rules/python/` to `claude-code/rules/python/` as part of v3.0 per-tool restructure. Content unchanged.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `rules/python/` → `claude-code/rules/python/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/python-v3.0.0...HEAD
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/python-v2.0.0...claude-code/python-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/python-v1.0.0...claude-code/python-v2.0.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/python-v1.0.0
