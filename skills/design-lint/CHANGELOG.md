# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.2.0] - 2026-04-27

### Added

- New `checks/monochromatic.sh` check counts distinct non-gray Tailwind color families and flags when more than the configured limit (default 3) are present in scope. Encapsulates the gray-family allowlist (`gray|zinc|stone|neutral|slate`) and the per-file family limit so monochromatic discipline has one update site rather than parallel prose in `design-architect` and `frontend-engineer`.

## [4.1.0] - 2026-04-15

### Changed

- Declared canonical `lifecycle` metadata in the shared root definition so the distribution catalog can publish maturity separately from per-tool availability for this skill.

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

- Updated dark-mode-pairs check script to improve detection of missing `dark:` counterparts across component files.
- Updated hex-colors check script to align with the OKLCH-only color enforcement rule.
- Updated z-index check script to reflect the current z-scale definitions.

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/skill/design-lint-v4.1.0...HEAD
[4.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/design-lint-v4.0.0...skill/design-lint-v4.1.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/design-lint-v2.0.0...skill/design-lint-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/design-lint-v1.1.0...skill/design-lint-v2.0.0
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/design-lint-v1.0.0...skill/design-lint-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/skill/design-lint-v1.0.0
