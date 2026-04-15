# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Updated ship guidance to refer to the `git-ship` workflow in a tool-agnostic way instead of a Claude-only slash-command form.

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- Historical note: v3.0 temporarily moved this skill into tool-local copies before root `skills/` was restored as canonical.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - Canonical shared-skill path normalized under root `skills/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.1.0] - 2026-04-11

### Changed

- Updated phases reference with expanded lint/audit parallel agent detail and smoke test guidance
- Revised SKILL.md readiness criteria: added dry-run scope clarification and flaky-test isolation rules

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/skill/prod-readiness-v3.0.0...HEAD
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/prod-readiness-v2.0.0...skill/prod-readiness-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/prod-readiness-v1.1.0...skill/prod-readiness-v2.0.0
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/prod-readiness-v1.0.0...skill/prod-readiness-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/skill/prod-readiness-v1.0.0
