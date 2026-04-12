# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.0] - 2026-04-11

### Added

- Rename/grep-first rule: fix-agent dispatch prompts for rename findings must include a project-wide grep step to catch all occurrences before editing

### Changed

- Backlog routing now explicitly separates findings with `requires_human: true` into a dedicated "Needs Human Decision" section

## [1.3.0] - 2026-04-11

### Added

- Mechanical agent model override heuristic — dispatch purely mechanical agents at haiku tier to reduce cost

### Removed

- Changelog skill removed from frontmatter — changelog generation delegated to release-engineer

## [1.2.0] - 2026-04-11

### Added

- Explorer model override — read-only inventory agents dispatch as model: haiku
- Post-delivery changelog rule — release-engineer required after every post-delivery commit

## [1.1.0] - 2026-04-11

### Added

- Mandatory release-engineer routing for all commits in Ship phase
- Changelog skill added to skills list

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/claude-toolkit/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/bmjcoding/claude-toolkit/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/bmjcoding/claude-toolkit/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/bmjcoding/claude-toolkit/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/bmjcoding/claude-toolkit/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/bmjcoding/claude-toolkit/releases/tag/v1.0.0
