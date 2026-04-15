# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Moved the canonical agent definition and changelog to `agents/plan-reviewer/`; Claude, Copilot, and Codex files are now tool-specific adapters generated from the shared source.
- Updated comparison links to use the shared `agent/plan-reviewer` tag namespace for this root canonical component.

### Removed

- Removed the redundant Claude-specific changelog copy from `claude-code/agents/plan-reviewer/CHANGELOG.md`.

## [1.4.2] - 2026-04-14

### Changed
- Factored standard 4-bullet untrusted-data prelude and instruction sandwich out to `improve/references/security-preamble.md`. Agent-specific preamble, rules, and runaway guard remain inline.

## [1.4.1] - 2026-04-14

### Changed

- Handoff-First Rule: replaced the 6-line inline JSON skeleton with a single prose sentence describing the required structure. Actionable instruction preserved; schema duplication removed.

## [4.0.1] - 2026-04-14

### Fixed

- Invariant rule (line 61): field name corrected from `issues` to `findings` to match the output schema. The rule now references the correct field name used in the handoff JSON template.

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: restructured for v3.0 per-tool layout. Claude Code remains under `claude-code/` for tool-native assets. At that point in history, shared rules and skills were described as living under `claude-code/rules/` and `claude-code/skills/`.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `agents/plan-reviewer/` → `claude-code/agents/plan-reviewer/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.3.0] - 2026-04-12

### Added

- Handoff status schema: `revise` added as an explicit valid enum value alongside `approve`; the extract-handoff hook now accepts `revise` without rejection, enabling plan-reviewer to request plan amendments without emitting `needs_human` (REC-4).

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/agent/plan-reviewer-v1.4.2...HEAD
[1.4.2]: https://github.com/bmjcoding/agent-toolkit/compare/agent/plan-reviewer-v1.4.1...agent/plan-reviewer-v1.4.2
[1.4.1]: https://github.com/bmjcoding/agent-toolkit/compare/agent/plan-reviewer-v4.0.1...agent/plan-reviewer-v1.4.1
[4.0.1]: https://github.com/bmjcoding/agent-toolkit/compare/agent/plan-reviewer-v4.0.0...agent/plan-reviewer-v4.0.1
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/plan-reviewer-v2.0.0...agent/plan-reviewer-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/plan-reviewer-v1.3.0...agent/plan-reviewer-v2.0.0
[1.3.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/plan-reviewer-v1.2.0...agent/plan-reviewer-v1.3.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/agent/plan-reviewer-v1.0.0
