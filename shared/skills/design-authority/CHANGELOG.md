# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/design-authority-v1.1.0...HEAD
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/design-authority-v1.0.0...design-authority-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/design-authority-v1.0.0
