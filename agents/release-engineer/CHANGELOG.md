# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2026-04-12

### Changed

- Commit-phase split: commit preparation (staging files and drafting commit message) is now a discrete step separated from commit execution, allowing human review of the staged diff and message before the commit is finalized (REC-6).

## [1.1.0] - 2026-04-11

### Added

- Changelog skill integration — generates CHANGELOG.md entries before commit
- `--no-changelog` flag to skip changelog generation

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/claude-toolkit/compare/release-engineer-v1.3.0...HEAD
[1.3.0]: https://github.com/bmjcoding/claude-toolkit/compare/release-engineer-v1.2.0...release-engineer-v1.3.0
[1.1.0]: https://github.com/bmjcoding/claude-toolkit/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/bmjcoding/claude-toolkit/releases/tag/v1.0.0
