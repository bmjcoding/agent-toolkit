# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Canonical root `hooks/changelog-check/` owner seeded from the Claude implementation during Phase 1 of hook standardization.
- Root hook tag derivation now recognizes `hooks/<slug>/CHANGELOG.md` as `hook/<slug>` for the emerging shared hook namespace.
- Historical release continuity remains in the prior tool-local changelog until the dedicated changelog-ownership migration phase moves fully to root `hooks/`.
