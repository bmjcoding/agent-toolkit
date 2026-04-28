# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.1.1] - 2026-04-28

### Fixed

- Removed duplicate `lifecycle` frontmatter from the skill definition so duplicate-key
  validation remains clean.

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

- Updated provider detection reference with expanded Bitbucket Data Center API patterns and auto-merge guidance
- Revised SKILL.md workflow guidance for branch protection handling and empty-branch guard

## [1.0.0] - 2026-04-11

### Added

- Initial release

[4.1.1]: https://github.com/bmjcoding/agent-toolkit/compare/skill/git-ship-v4.1.0...skill/git-ship-v4.1.1
[4.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/git-ship-v4.0.0...skill/git-ship-v4.1.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/git-ship-v2.0.0...skill/git-ship-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/git-ship-v1.1.0...skill/git-ship-v2.0.0
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/git-ship-v1.0.0...skill/git-ship-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/skill/git-ship-v1.0.0
