# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Declared shared execution metadata in the canonical root definition so model tier, capabilities, subagent routing, and skill dependencies no longer need to be inferred from tool-specific wrappers.

- Moved the canonical agent definition and changelog to `agents/design-architect/`; Claude, Copilot, and Codex files are now tool-specific adapters generated from the shared source.
- Updated comparison links to use the shared `agent/design-architect` tag namespace for this root canonical component.

### Removed

- Removed the redundant Claude-specific changelog copy from `claude-code/agents/design-architect/CHANGELOG.md`.

## [1.2.1] - 2026-04-14

### Changed
- Factored standard 4-bullet untrusted-data prelude and instruction sandwich out to `improve/references/security-preamble.md`. Agent-specific preamble, rules, and runaway guard remain inline.

## [1.2.0] - 2026-04-14

### Changed

- Pillar C item 1 (Monochromatic discipline): removed inline ALT-Central-specific Tailwind v4 color family vocabulary and numeric threshold (D-1/D-2 project-bias). Principle retained; specifics deferred to the design-authority skill's reference files.
- Runaway guard line annotated with `# > 57 = maxTurns(60) - 3` comment to document the derivation and prevent drift when maxTurns changes (D-3 verbosity).

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: restructured for v3.0 per-tool layout. Claude Code remains under `claude-code/` for tool-native assets. At that point in history, shared rules and skills were described as living under `claude-code/rules/` and `claude-code/skills/`.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `agents/design-architect/` → `claude-code/agents/design-architect/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/agent/design-architect-v1.2.1...HEAD
[1.2.1]: https://github.com/bmjcoding/agent-toolkit/compare/agent/design-architect-v1.2.0...agent/design-architect-v1.2.1
[1.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/design-architect-v1.1.0...agent/design-architect-v1.2.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/design-architect-v2.0.0...agent/design-architect-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/design-architect-v1.0.0...agent/design-architect-v2.0.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/agent/design-architect-v1.0.0
