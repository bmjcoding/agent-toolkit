# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Declared canonical `lifecycle` metadata in the shared root definition so the distribution catalog can publish maturity separately from per-tool availability for this skill.

- Clarified that the lightweight frontend workflow is only for single-domain frontend work and should escalate to the full orchestrator for cross-domain, planning-heavy, or shipping tasks.
- Tightened the implementation handoff so `frontend-engineer` receives concrete file and UX context instead of a generic task prompt.

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

- Updated SKILL.md content to align with OKLCH color enforcement and dark-mode pairing rules introduced in the design-authority skill.

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/skill/frontend-v3.0.0...HEAD
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/frontend-v2.0.0...skill/frontend-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/frontend-v1.1.0...skill/frontend-v2.0.0
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/frontend-v1.0.0...skill/frontend-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/skill/frontend-v1.0.0
