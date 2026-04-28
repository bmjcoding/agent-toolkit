# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-04-16

### Changed

- Declared canonical lifecycle metadata inline in the root hook script so generated catalog and validation flows derive hook maturity from the shared hook source.

## [1.0.0] - 2026-04-15

### Added

- Canonical root `hooks/protect-config/` owner seeded from the Claude implementation during Phase 1 of hook standardization.
- Root canonical regex now includes repo-root `hooks/`, `skills/`, and `rules/` paths so the new shared ownership layout is covered without waiting for tool-local path prefixes.
- Historical release continuity remains in the prior tool-local changelog until the dedicated changelog-ownership migration phase moves fully to root `hooks/`.

[1.0.1]: https://github.com/bmjcoding/agent-toolkit/compare/hook/protect-config-v1.0.0...hook/protect-config-v1.0.1
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/hook/protect-config-v1.0.0
