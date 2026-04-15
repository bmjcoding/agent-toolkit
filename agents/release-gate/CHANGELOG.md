# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Declared canonical lifecycle metadata so the distribution catalog can publish normalized lifecycle state for this shared agent.

- Documented phase-qualified handoff aliases for repeated release-gate verdict passes so
  iteration-specific reviews no longer rely on a single shared filename.
- Updated the Claude adapter reference to the flattened `claude-code/agents/<name>.md`
  layout used by the tool-specific generated surfaces.

## [2.0.0] - 2026-04-15

### Changed

- Declared shared execution metadata in the canonical root definition so model tier, capabilities, subagent routing, and skill dependencies no longer need to be inferred from tool-specific wrappers.

- Moved the canonical agent definition and changelog to `agents/release-gate/`; Claude, Copilot, and Codex files are now tool-specific adapters generated from the shared source.
- Updated comparison links to use the shared `agent/release-gate` tag namespace for this root canonical component.

### Removed

- Removed the redundant Claude-specific changelog copy from `claude-code/agents/release-gate/CHANGELOG.md`.

## [1.2.1] - 2026-04-14

### Changed

- RG-1: consolidated the Execution section to a single sentence referencing the skill loaded at startup; removed duplicate tool-discovery guidance that was already present in the preamble. Reduces `prod-readiness` occurrences from 4 to 2 (saves ~2 lines).

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: restructured for v3.0 per-tool layout. Claude Code remains under `claude-code/` for tool-native assets. At that point in history, shared rules and skills were described as living under `claude-code/rules/` and `claude-code/skills/`.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `agents/release-gate/` → `claude-code/agents/release-gate/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/agent/release-gate-v2.0.0...HEAD
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/agent/release-gate-v2.0.0
[1.2.1]: https://github.com/bmjcoding/agent-toolkit/compare/agent/release-gate-v1.2.0...agent/release-gate-v1.2.1
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/release-gate-v2.0.0...agent/release-gate-v3.0.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/agent/release-gate-v1.0.0
