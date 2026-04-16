# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-04-16

### Changed

- Tightened release-tag enforcement so promoted CHANGELOG headers now require signed annotated tags. Lightweight tags and unsigned annotated tags are rejected before push, with remediation guidance that uses `git tag -s` and `git push --follow-tags`.

## [1.0.0] - 2026-04-15

### Added

- Canonical root `hooks/changelog-check/` owner seeded from the Claude implementation during Phase 1 of hook standardization.
- Root hook tag derivation now recognizes `hooks/<slug>/CHANGELOG.md` as `hook/<slug>` for the emerging shared hook namespace.
- Historical release continuity remains in the prior tool-local changelog until the dedicated changelog-ownership migration phase moves fully to root `hooks/`.

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/hook/changelog-check-v1.1.0...HEAD
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/hook/changelog-check-v1.0.0...hook/changelog-check-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/hook/changelog-check-v1.0.0
