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

- BREAKING: v3.0 layout — hooks remain under `claude-code/hooks/pre-push-secrets/`; skill/rule path patterns in some scripts updated to new `claude-code/skills/` and `claude-code/rules/` locations.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `hooks/pre-push-secrets/` → `claude-code/hooks/pre-push-secrets/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.0.1] - 2026-04-12

### Fixed

- gitleaks scan now uses a dual-path glob covering both flat `.orchestrator/` and session-scoped `.orchestrator/sessions/*/` paths, ensuring secrets introduced in session-isolated files are caught before push.

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/pre-push-secrets-v3.0.0...HEAD
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/pre-push-secrets-v2.0.0...claude-code/pre-push-secrets-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/pre-push-secrets-v1.0.1...claude-code/pre-push-secrets-v2.0.0
[1.0.1]: https://github.com/bmjcoding/agent-toolkit/compare/pre-push-secrets-v1.0.0...pre-push-secrets-v1.0.1
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/pre-push-secrets-v1.0.0
