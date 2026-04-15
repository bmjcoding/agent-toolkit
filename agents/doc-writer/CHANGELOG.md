# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Declared canonical `lifecycle` metadata in the shared root definition so the distribution catalog can publish maturity separately from per-tool availability for this agent.

- Switched doc-writer branch discovery to the remote default branch and updated repeated
  reviewer lookup guidance to consume phase-qualified `design-architect*.json` handoffs.
- Updated the Claude adapter reference to the flattened `claude-code/agents/<name>.md`
  layout used by the tool-specific generated surfaces.

## [2.0.0] - 2026-04-15

### Changed

- Declared shared execution metadata in the canonical root definition so model tier, capabilities, subagent routing, and skill dependencies no longer need to be inferred from tool-specific wrappers.

- Moved the canonical agent definition and changelog to `agents/doc-writer/`; Claude, Copilot, and Codex files are now tool-specific adapters generated from the shared source.
- Updated comparison links to use the shared `agent/doc-writer` tag namespace for this root canonical component.

### Added

- Standalone Use section showing how to invoke doc-writer directly with a minimal dispatch prompt, independent of a frankenstein pipeline.
- Best Practices section cross-referencing the Keep a Changelog anti-patterns guide (`skills/changelog/references/anti-patterns.md`) so writers know which patterns to avoid (commit-log dumps, "Various fixes", undated releases).

### Removed

- Removed the redundant Claude-specific changelog copy from `claude-code/agents/doc-writer/CHANGELOG.md`.

## [1.2.3] - 2026-04-14

### Changed
- Factored standard 4-bullet untrusted-data prelude and instruction sandwich out to `improve/references/security-preamble.md`. Agent-specific preamble, rules, and runaway guard remain inline.

## [1.2.2] - 2026-04-14

### Changed

- DW-1: replaced inline 13-line ADR fenced template block with a reference to the project's existing ADR section format; format is now maintained in one place rather than embedded in the agent definition

## [1.2.1] - 2026-04-13

### Changed

- ADR numbering instruction now requires filesystem check via the Gotchas section rather than deriving from session context; prevents numbering collisions across concurrent pipeline runs

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: restructured for v3.0 per-tool layout. Claude Code remains under `claude-code/` for tool-native assets. At that point in history, shared rules and skills were described as living under `claude-code/rules/` and `claude-code/skills/`.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `agents/doc-writer/` → `claude-code/agents/doc-writer/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/agent/doc-writer-v2.0.0...HEAD
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/agent/doc-writer-v2.0.0
[1.2.3]: https://github.com/bmjcoding/agent-toolkit/compare/agent/doc-writer-v1.2.2...agent/doc-writer-v1.2.3
[1.2.2]: https://github.com/bmjcoding/agent-toolkit/compare/agent/doc-writer-v1.2.1...agent/doc-writer-v1.2.2
[1.2.1]: https://github.com/bmjcoding/agent-toolkit/compare/agent/doc-writer-v4.0.0...agent/doc-writer-v1.2.1
[4.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/doc-writer-v3.0.0...agent/doc-writer-v4.0.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/doc-writer-v2.0.0...agent/doc-writer-v3.0.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/agent/doc-writer-v1.0.0
