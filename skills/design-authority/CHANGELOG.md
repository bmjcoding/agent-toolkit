# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Added a scope-check entry gate so the skill preserves mature product design systems, routes small patches to only the needed references, and reserves the full pattern sweep for net-new screens or broad redesigns.

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

- Enforced OKLCH-only color notation across all design guidance; arbitrary hex values are now explicitly banned in favor of semantic Tailwind tokens or OKLCH CSS variables.
- Corrected hover-state tokens to `gray-50/900` (was `gray-100/800`) for proper contrast in both light and dark modes.
- Expanded shadow ban list to include `shadow-2xl`, strengthening the no-heavy-shadow rule.
- Updated charts, component action, data-display, and focus reference files to reflect OKLCH and corrected token guidance.
- Refreshed app-detail-panel and data-table templates to match current canonical patterns.

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/skill/design-authority-v3.0.0...HEAD
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/design-authority-v2.0.0...skill/design-authority-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/design-authority-v1.1.0...skill/design-authority-v2.0.0
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/design-authority-v1.0.0...skill/design-authority-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/skill/design-authority-v1.0.0
