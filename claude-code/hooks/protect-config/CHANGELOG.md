# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: v3.0 layout — hooks remain under `claude-code/hooks/protect-config/`; historical skill/rule path patterns in some scripts were updated for the then-current layout.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `hooks/protect-config/` → `claude-code/hooks/protect-config/`
- Shell script updated: path-guard regex patterns adjusted for the new `claude-code/hooks/` prefix.
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.0.1] - 2026-04-12

### Security

- Added `.orchestrator/session.id` to the PROTECTED path list; agents may not overwrite the session identifier mid-run (sec-med-1).
- Tightened `sessions/` subtree pattern from `sessions/[^/]+/logs/` to `sessions/[0-9]{8}T[0-9]{6}/logs/` to reject non-SID directory names (sec-med-2).

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/protect-config-v3.0.0...HEAD
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/protect-config-v2.0.0...claude-code/protect-config-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/protect-config-v1.0.1...claude-code/protect-config-v2.0.0
[1.0.1]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/protect-config-v1.0.0...claude-code/protect-config-v1.0.1
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/claude-code/protect-config-v1.0.0
