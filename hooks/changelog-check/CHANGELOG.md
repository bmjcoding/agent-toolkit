# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-04-28

### Removed

- Removed promoted-version release-tag enforcement from the pre-push hook. The
  hook now validates changelog presence and versioned Keep a Changelog header
  format without requiring git tags.
- Added pre-push rejection for unreleased staging markers and tag-backed changelog
  version footer links.

## [1.2.0] - 2026-04-28

### Changed

- Updated skill changelog slug derivation to recognize categorized
  `skills/<category>/<slug>/CHANGELOG.md` paths.

## [1.1.1] - 2026-04-16

### Changed

- Declared canonical lifecycle metadata inline in the root hook script so generated catalog and validation flows derive hook maturity from the shared hook source.

## [1.1.0] - 2026-04-16

### Changed

- Tightened release-tag enforcement so promoted CHANGELOG headers now require signed annotated tags. Lightweight tags and unsigned annotated tags are rejected before push, with remediation guidance that uses `git tag -s` and `git push --follow-tags`.

## [1.0.0] - 2026-04-15

### Added

- Canonical root `hooks/changelog-check/` owner seeded from the Claude implementation during Phase 1 of hook standardization.
- Root hook tag derivation now recognizes `hooks/<slug>/CHANGELOG.md` as `hook/<slug>` for the emerging shared hook namespace.
- Historical release continuity remains in the prior tool-local changelog until the dedicated changelog-ownership migration phase moves fully to root `hooks/`.
