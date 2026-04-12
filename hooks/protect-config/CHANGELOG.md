# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.1] - 2026-04-12

### Security

- Added `.orchestrator/session.id` to the PROTECTED path list; agents may not overwrite the session identifier mid-run (sec-med-1).
- Tightened `sessions/` subtree pattern from `sessions/[^/]+/logs/` to `sessions/[0-9]{8}T[0-9]{6}/logs/` to reject non-SID directory names (sec-med-2).

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/protect-config-v1.0.1...HEAD
[1.0.1]: https://github.com/bmjcoding/agent-toolkit/compare/protect-config-v1.0.0...protect-config-v1.0.1
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/protect-config-v1.0.0
