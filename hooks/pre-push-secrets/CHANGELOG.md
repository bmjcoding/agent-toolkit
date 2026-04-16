# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.1] - 2026-04-16

### Changed

- Declared canonical lifecycle metadata inline in the root hook script so generated catalog and validation flows derive hook maturity from the shared hook source.

## [1.0.0] - 2026-04-15

### Added

- Canonical root `hooks/pre-push-secrets/` owner seeded from the existing shared hook implementation during Phase 1 of hook standardization.
- Historical release continuity remains in the prior tool-local changelog until the dedicated changelog-ownership migration phase moves fully to root `hooks/`.

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/hook/pre-push-secrets-v1.0.1...HEAD
[1.0.1]: https://github.com/bmjcoding/agent-toolkit/compare/hook/pre-push-secrets-v1.0.0...hook/pre-push-secrets-v1.0.1
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/hook/pre-push-secrets-v1.0.0
