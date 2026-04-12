# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-04-12

### Added

- Session-aware path resolution: reads `.orchestrator/session.id` and writes handoffs to `.orchestrator/sessions/<SESSION_ID>/handoffs/` when the file is present and valid. Falls back to flat `.orchestrator/handoffs/` layout when `session.id` is absent or contains an unexpected format.
- SID format validation: rejects values not matching `^[0-9]{8}T[0-9]{6}$` and logs `session_id_invalid` with fallback=flat to agents.log.

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/claude-toolkit/compare/extract-handoff-v1.1.0...HEAD
[1.1.0]: https://github.com/bmjcoding/claude-toolkit/compare/extract-handoff-v1.0.0...extract-handoff-v1.1.0
[1.0.0]: https://github.com/bmjcoding/claude-toolkit/tree/extract-handoff-v1.0.0
