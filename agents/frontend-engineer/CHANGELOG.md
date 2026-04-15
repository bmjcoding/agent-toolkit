# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Moved the canonical agent definition and changelog to `agents/frontend-engineer/`; Claude, Copilot, and Codex files are now tool-specific adapters generated from the shared source.
- Updated comparison links to use the shared `agent/frontend-engineer` tag namespace for this root canonical component.

### Removed

- Removed the redundant Claude-specific changelog copy from `claude-code/agents/frontend-engineer/CHANGELOG.md`.

## [1.3.1] - 2026-04-14

### Changed
- Factored standard 4-bullet untrusted-data prelude and instruction sandwich out to `improve/references/security-preamble.md`. Agent-specific preamble, rules, and runaway guard remain inline.

## [1.3.0] - 2026-04-14

### Changed

- Remove hardcoded banned Tailwind class names (rounded-md, rounded-sm, shadow-md, shadow-lg, shadow-xl, shadow-2xl) from agent body; delegate to design-authority skill's banned-class reference (F-1, F-3)
- Replace five hardcoded .claude/skills/design-authority/ installation paths with relative skill-scoped references (F-2)
- Collapse standalone "Documentation & Spec Mode" section into a single inline note within the Design System section (F-4)

## [1.2.0] - 2026-04-13

### Added

- Large task context overflow gotcha: guidance for 3+ file subtasks to emit partial handoffs rather than truncating silently

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: restructured for v3.0 per-tool layout. Claude Code remains under `claude-code/` for tool-native assets. At that point in history, shared rules and skills were described as living under `claude-code/rules/` and `claude-code/skills/`.

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

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/agent/frontend-engineer-v1.3.1...HEAD
[1.3.1]: https://github.com/bmjcoding/agent-toolkit/compare/agent/frontend-engineer-v1.3.0...agent/frontend-engineer-v1.3.1
[1.3.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/frontend-engineer-v1.2.0...agent/frontend-engineer-v1.3.0
[1.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/frontend-engineer-v4.0.0...agent/frontend-engineer-v1.2.0
[4.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/frontend-engineer-v3.0.0...agent/frontend-engineer-v4.0.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/frontend-engineer-v2.0.0...agent/frontend-engineer-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/frontend-engineer-v1.1.1...agent/frontend-engineer-v2.0.0
[1.1.1]: https://github.com/bmjcoding/agent-toolkit/compare/agent/frontend-engineer-v1.1.0...agent/frontend-engineer-v1.1.1
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/frontend-engineer-v1.0.0...agent/frontend-engineer-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/agent/frontend-engineer-v1.0.0
