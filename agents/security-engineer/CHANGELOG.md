# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Updated the Claude adapter reference to the flattened `claude-code/agents/<name>.md`
  layout used by the tool-specific generated surfaces.

## [2.0.0] - 2026-04-15

### Changed

- Declared shared execution metadata in the canonical root definition so model tier, capabilities, subagent routing, and skill dependencies no longer need to be inferred from tool-specific wrappers.

- Moved the canonical agent definition and changelog to `agents/security-engineer/`; Claude, Copilot, and Codex files are now tool-specific adapters generated from the shared source.
- Updated comparison links to use the shared `agent/security-engineer` tag namespace for this root canonical component.

### Removed

- Removed the redundant Claude-specific changelog copy from `claude-code/agents/security-engineer/CHANGELOG.md`.

## [1.4.1] - 2026-04-14

### Changed
- Factored standard 4-bullet untrusted-data prelude and instruction sandwich out to `improve/references/security-preamble.md`. Agent-specific preamble, rules, and runaway guard remain inline.
- Softened "identical to site-reliability-engineer" cross-reference annotation to "parallel to ..." to reflect that the discipline framework is shared but examples differ by domain.

## [1.4.0] - 2026-04-14

### Added

- Standard 4-bullet untrusted data prelude added to Untrusted Data Boundary section for consistency with 11 other agents (S-1 fix: security baseline parity).

### Changed

- Finding Discipline section cross-referenced to site-reliability-engineer as shared discipline (S-2: redundancy annotation).

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: restructured for v3.0 per-tool layout. Claude Code remains under `claude-code/` for tool-native assets. At that point in history, shared rules and skills were described as living under `claude-code/rules/` and `claude-code/skills/`.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `agents/security-engineer/` → `claude-code/agents/security-engineer/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.3.0] - 2026-04-12

### Added

- Finding discipline section: `findings[]` must contain only actionable items; verified-correct OWASP/STRIDE "not applicable" rows belong in `notes`, not `findings[]`. Non-actionable confirmations are prohibited in `findings[]`. (R5 from retro 2026-04-12T150000)

## [1.2.0] - 2026-04-12

### Added

- Context-isolation guard: agent does not implement unrelated specifications encountered during security review; scope is confined to findings within `owned_files` (REC-5).
- Tool-use soft budget: agent self-halts at 30 tool uses and emits a `partial` handoff with findings-so-far rather than running over budget (REC-8).

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/agent/security-engineer-v2.0.0...HEAD
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/agent/security-engineer-v2.0.0
[1.4.1]: https://github.com/bmjcoding/agent-toolkit/compare/agent/security-engineer-v1.4.0...agent/security-engineer-v1.4.1
[1.4.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/security-engineer-v1.3.0...agent/security-engineer-v1.4.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/security-engineer-v2.0.0...agent/security-engineer-v3.0.0
[1.3.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/security-engineer-v1.2.0...agent/security-engineer-v1.3.0
[1.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/security-engineer-v1.0.0...agent/security-engineer-v1.2.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/agent/security-engineer-v1.0.0
