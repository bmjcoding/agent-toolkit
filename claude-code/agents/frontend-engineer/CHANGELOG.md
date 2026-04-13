# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-04-13

### Added

- Large task context overflow gotcha: guidance for 3+ file subtasks to emit partial handoffs rather than truncating silently

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: restructured for v3.0 per-tool layout. Claude Code remains under `claude-code/` with all components fully self-contained. Rules and skills relocated to `claude-code/rules/` and `claude-code/skills/` (away from root).

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `agents/frontend-engineer/` → `claude-code/agents/frontend-engineer/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.1.1] - 2026-04-11

### Added

- Add post-change compile check step: run tsc --noEmit after all changes before writing handoff

## [1.1.0] - 2026-04-11

### Added

- Add design system skill loading, dark mode rule, anti-convergence bans
- Add untrusted data boundary and frontend code safety rules

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/frontend-engineer-v3.0.0...HEAD
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/frontend-engineer-v2.0.0...claude-code/frontend-engineer-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/frontend-engineer-v1.1.1...claude-code/frontend-engineer-v2.0.0
[1.1.1]: https://github.com/bmjcoding/agent-toolkit/compare/frontend-engineer-v1.1.0...frontend-engineer-v1.1.1
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/frontend-engineer-v1.0.0...frontend-engineer-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/frontend-engineer-v1.0.0
