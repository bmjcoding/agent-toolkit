# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- The injected orchestrator constraints now point single-writer and handoff guidance at
  the resolved session-scoped handoff directory when a valid session id is active,
  falling back to the flat handoff directory otherwise.
- The hook's additional context message now emits the resolved project-brief and plan
  paths instead of hardcoded flat `.orchestrator/` locations.

## [1.0.0] - 2026-04-15

### Added

- Canonical root `hooks/inject-context/` owner seeded from the existing shared hook implementation during Phase 1 of hook standardization.
- Historical release continuity remains in the prior tool-local changelog until the dedicated changelog-ownership migration phase moves fully to root `hooks/`.

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/hook/inject-context-v1.0.0...HEAD
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/hook/inject-context-v1.0.0
