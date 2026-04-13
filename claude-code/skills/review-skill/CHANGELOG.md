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

- BREAKING: copied from root `skills/` to `claude-code/skills/` in v3.0 per-tool restructure. Root `skills/` deleted.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `skills/review-skill/` → `shared/skills/review-skill/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.1.0] - 2026-04-11

### Changed

- Updated lint-definition.py script and evals for new subdirectory layout
- Revised Q-warning handling: Q-code warnings now required in Required Changes table, not silently absorbed into Lint Results

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/review-skill-v3.0.0...HEAD
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/shared/review-skill-v2.0.0...claude-code/review-skill-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/shared/review-skill-v1.1.0...shared/review-skill-v2.0.0
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/shared/review-skill-v1.0.0...shared/review-skill-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/review-skill-v1.0.0
