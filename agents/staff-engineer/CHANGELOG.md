# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.2.0] - 2026-04-27

### Changed

- Removed the duplicated `Security & Hardening` baseline (pinned image tags, non-root containers, no hardcoded secrets, masked CI secrets) and replaced with a reference to the project `AGENTS.md` Security Rules section, which is the canonical source.
- Replaced the `Untrusted Data Boundary` invariants block with a reference to `rules/untrusted-data-boundary/`.

## [5.1.0] - 2026-04-15

### Added

- Added an exploration mode that writes session-scoped staff summaries and inventories
  for shared types, config, tooling, and infrastructure planning.

### Changed

- Declared canonical `lifecycle` metadata in the shared root definition so the distribution catalog can publish maturity separately from per-tool availability for this agent.
- Clarified that staff-engineer write boundaries are mode-specific: exploration writes
  only orchestrator context artifacts, while implementation remains constrained to
  `owned_files`.
- Updated the Claude adapter reference to the flattened `claude-code/agents/<name>.md`
  layout used by the tool-specific generated surfaces.

## [5.0.0] - 2026-04-15

### Changed

- Declared shared execution metadata in the canonical root definition so model tier, capabilities, subagent routing, and skill dependencies no longer need to be inferred from tool-specific wrappers.

- Moved the canonical agent definition and changelog to `agents/staff-engineer/`; Claude, Copilot, and Codex files are now tool-specific adapters generated from the shared source.
- Updated comparison links to use the shared `agent/staff-engineer` tag namespace for this root canonical component.

### Removed

- Removed the redundant Claude-specific changelog copy from `claude-code/agents/staff-engineer/CHANGELOG.md`.

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: restructured for v3.0 per-tool layout. Claude Code remains under `claude-code/` for tool-native assets. At that point in history, shared rules and skills were described as living under `claude-code/rules/` and `claude-code/skills/`.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `agents/staff-engineer/` → `claude-code/agents/staff-engineer/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.0.0] - 2026-04-11

### Added

- Initial release

[5.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/staff-engineer-v5.0.0...agent/staff-engineer-v5.1.0
[5.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/agent/staff-engineer-v5.0.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/staff-engineer-v2.0.0...agent/staff-engineer-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/staff-engineer-v1.0.0...agent/staff-engineer-v2.0.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/agent/staff-engineer-v1.0.0
