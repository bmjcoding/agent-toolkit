# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.4.0] - 2026-04-28

### Changed

- Added a portable `## Inputs` section for frontend task requests and removed the
  Claude-specific task placeholder.

## [4.3.0] - 2026-04-16

### Changed

- Declared canonical shared-skill dependencies on `design-authority` and `design-lint` so the distribution catalog can expose prerequisite shared skills without adding runtime coupling.

## [4.2.0] - 2026-04-16

### Changed

- Made the skill directly usable without a separate orchestrator by defaulting to local execution, treating specialist agents as optional, and allowing small adjacent cross-domain edits.

## [4.1.0] - 2026-04-15

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
