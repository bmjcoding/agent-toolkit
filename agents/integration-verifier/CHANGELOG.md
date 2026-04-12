# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-04-11

### Added

- Full-pass requirement: verification must cover all contracts and owned files before writing the handoff — inline fixes do not terminate the pass early

### Changed

- Partial verdict criteria narrowed: emit `partial` only when the compilation tool is unavailable, not when findings exist or inline fixes were applied

## [1.1.0] - 2026-04-11

### Added

- Add full-pass requirement: verify all contracts before writing handoff, do not stop after inline fix

### Changed

- Narrow partial verdict criteria: emit partial only when compilation tool is unavailable, not when findings exist

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/claude-toolkit/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/bmjcoding/claude-toolkit/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/bmjcoding/claude-toolkit/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/bmjcoding/claude-toolkit/releases/tag/v1.0.0
