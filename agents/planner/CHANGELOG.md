# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2026-04-11

### Added

- Pre-description file state verification rule: planner must sample 2-3 files from migration target lists before writing subtask descriptions to confirm described state matches reality

## [1.2.0] - 2026-04-11

### Added

- Visual acceptance criteria rule for layout subtasks: require grid column counts, spacing values, and design references in completion_criteria

## [1.1.0] - 2026-04-11

### Added

- catalog_layout spec field requirement for frontend catalog pages
- fixture_count as machine-readable field in integration contracts
- Changelog cross-subtask validation rule for bracket format
- Test fixture read-before-assert rule — live directory count, not plan.json
- Subtask description length cap at 2,000 words

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/claude-toolkit/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/bmjcoding/claude-toolkit/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/bmjcoding/claude-toolkit/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/bmjcoding/claude-toolkit/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/bmjcoding/claude-toolkit/releases/tag/v1.0.0
