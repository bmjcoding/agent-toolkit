# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: copied from root `skills/` to `claude-code/skills/` in v3.0 per-tool restructure. Root `skills/` deleted.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `skills/owasp-reference/` → `shared/skills/owasp-reference/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.1.0] - 2026-04-11

### Changed

- Updated SKILL.md to align with current reference structure and behavioral refusal inventory
- Added Behavioral Refusal Inventory table documenting LLM-only security properties and their lack of technical backstops

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/owasp-reference-v3.0.0...HEAD
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/shared/owasp-reference-v2.0.0...claude-code/owasp-reference-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/shared/owasp-reference-v1.1.0...shared/owasp-reference-v2.0.0
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/shared/owasp-reference-v1.0.0...shared/owasp-reference-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/owasp-reference-v1.0.0
