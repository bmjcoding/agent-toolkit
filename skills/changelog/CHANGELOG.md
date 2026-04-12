# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-04-12

### Changed

- Switched comparison link footer format from monolithic repo tags (`v1.0.0`) to per-component dash-style tags (`changelog-v1.0.0`); all existing footers using `vX.Y.Z` are now non-conformant
- Tag view URL for the initial version now uses `tree/` path instead of `releases/tag/` (no GitHub Release object exists for this component)

### Added

- Per-Component Tag Format section defining the canonical `{slug}-v{version}` format, slug-derivation rules, collision-handling, and a complete example table
- Platform URL Formats sub-section with compare-URL templates for GitHub, GitLab, Bitbucket Cloud, and Bitbucket Datacenter (including verified/unverified status for each)
- [Unreleased] Workflow sub-section documenting who triggers a release cut, when, monorepo scope, and the required atomicity ordering (edit → commit → tag → push)
- Rule: when no VCS tag has been pushed for a component yet, omit compare links and document the omission with an inline comment rather than emitting broken URLs
- Yanked Releases section defining the `[YANKED]` marker and requirements for section body explanation and link retention

### Fixed

- Anti-patterns table was missing entries for: non-existent tag references, monolithic tags in monorepo context, wrong-platform URLs, omitted Deprecated entries, and future/guessed release dates

## [1.2.0] - 2026-04-11

### Added

- Commit Logs vs. Changelog Entries section with explicit no-commit-log-dump rules and a good/bad comparison table
- Drift-Prevention Enforcement section documenting Layer 1 (drift-check hook), Layer 2 (edit-reminder hook), and Layer 3 (/sync-toolkit command)

## [1.1.0] - 2026-04-11

### Added

- Version Renumbering section with required 4-step procedure for gap compression including mandatory definition file version comment update

## [1.0.0] - 2026-04-11

### Added

- Initial changelog skill defining Keep a Changelog 1.1.0 + SemVer standard for all toolkit components

[Unreleased]: https://github.com/bmjcoding/claude-toolkit/compare/changelog-v2.0.0...HEAD
[2.0.0]: https://github.com/bmjcoding/claude-toolkit/compare/changelog-v1.2.0...changelog-v2.0.0
[1.2.0]: https://github.com/bmjcoding/claude-toolkit/compare/changelog-v1.1.0...changelog-v1.2.0
[1.1.0]: https://github.com/bmjcoding/claude-toolkit/compare/changelog-v1.0.0...changelog-v1.1.0
[1.0.0]: https://github.com/bmjcoding/claude-toolkit/tree/changelog-v1.0.0
