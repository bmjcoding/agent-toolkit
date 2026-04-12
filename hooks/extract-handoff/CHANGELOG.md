# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-04-12

### Added

- Session-aware `ORCH_BASE` resolution: when `.orchestrator/session.id` exists and contains a valid `YYYYMMDDTHHMMSS` value, handoff files are written to `.orchestrator/sessions/<SID>/handoffs/`. Falls back to flat `.orchestrator/handoffs/` when `session.id` is absent or malformed.

### Changed

- Malformed handoff JSON is now logged with `reason=malformed_json` rather than silently skipped (sre-004).
- agents.log entries written as JSON objects via `jq -c` for structured downstream parsing (sre-005).

### Security

- SID value validated against `^[0-9]{8}T[0-9]{6}$` before use in path construction; path traversal via crafted `session.id` content prevented (sre-high-2).

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/claude-toolkit/compare/extract-handoff-v1.1.0...HEAD
[1.1.0]: https://github.com/bmjcoding/claude-toolkit/compare/extract-handoff-v1.0.0...extract-handoff-v1.1.0
[1.0.0]: https://github.com/bmjcoding/claude-toolkit/tree/extract-handoff-v1.0.0
