# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.1.1] - 2026-04-16

### Fixed

- Removed the duplicate `lifecycle` frontmatter key so the definition stays lint-clean while remaining non-user-invocable.

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

- Updated SKILL.md to align with current reference structure and behavioral refusal inventory
- Added Behavioral Refusal Inventory table documenting LLM-only security properties and their lack of technical backstops

## [1.0.0] - 2026-04-11

### Added

- Initial release
