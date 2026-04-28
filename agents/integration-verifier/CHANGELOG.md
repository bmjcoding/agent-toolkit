# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.1] - 2026-04-28

### Changed

- Updated compiler-diagnostic classification guidance to use the toolkit-owned
  `scripts/orchestrator/classify-compile-errors.py` helper.

## [2.2.0] - 2026-04-27

### Changed

- Replaced the inline "Pre-existing error classification" prose with a reference to `~/.claude/scripts/classify-compile-errors.py`. The script walks handoff `files_written` lists to bucket compiler diagnostics into introduced / pre-existing / unclassified, returning structured JSON the agent surfaces in handoff `notes`.
- Replaced the `Untrusted Data Boundary` invariants block with a reference to `rules/untrusted-data-boundary/`.

## [2.1.0] - 2026-04-15

### Added

- Added structured `contracts_verified`, `contracts_failed`, `files_missing`,
  `compilation_errors`, and `recommendations` fields to the structural-verification
  handoff schema.

### Changed

- Declared canonical `lifecycle` metadata in the shared root definition so the distribution catalog can publish maturity separately from per-tool availability for this agent.
- Documented phase-qualified alias naming for repeated verifier passes so structural and
  cross-QA outputs can coexist safely in one session.
- Updated the Claude adapter reference to the flattened `claude-code/agents/<name>.md`
  layout used by the tool-specific generated surfaces.

## [2.0.0] - 2026-04-15

### Changed

- Declared shared execution metadata in the canonical root definition so model tier, capabilities, subagent routing, and skill dependencies no longer need to be inferred from tool-specific wrappers.

- Moved the canonical agent definition and changelog to `agents/integration-verifier/`; Claude, Copilot, and Codex files are now tool-specific adapters generated from the shared source.
- Updated comparison links to use the shared `agent/integration-verifier` tag namespace for this root canonical component.

### Removed

- Removed the redundant Claude-specific changelog copy from `claude-code/agents/integration-verifier/CHANGELOG.md`.

## [1.4.2] - 2026-04-14

### Changed
- Factored standard 4-bullet untrusted-data prelude and instruction sandwich out to `improve/references/security-preamble.md`. Agent-specific preamble, rules, and runaway guard remain inline.

## [1.4.1] - 2026-04-14

### Changed

- IV-1: replaced the 13-line inline shell script in the hook event-name lint step with a single `grep -r` pattern and inline canonical event name list (saves ~10 lines, behavior unchanged).
- IV-2: replaced the hardcoded `30 tool uses` soft cap with a relative expression `maxTurns / 2` so the budget scales with the configured `maxTurns` value.

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: restructured for v3.0 per-tool layout. Claude Code remains under `claude-code/` for tool-native assets. At that point in history, shared rules and skills were described as living under `claude-code/rules/` and `claude-code/skills/`.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `agents/integration-verifier/` → `claude-code/agents/integration-verifier/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.3.0] - 2026-04-12

### Added

- Tool-use soft budget: agent self-halts at 30 tool uses and emits a `partial` handoff with verification findings-so-far rather than running over budget (REC-8).

## [1.2.0] - 2026-04-11

### Added

- Full-pass requirement: verification must cover all contracts and owned files before writing the handoff — inline fixes do not terminate the pass early

### Changed

- Partial verdict criteria narrowed: emit `partial` only when the compilation tool is unavailable, not when findings exist or inline fixes were applied

## [1.1.0] - 2026-04-11

### Added

- Add full-pass requirement: verify all contracts before writing handoff, do not stop after inline fix

### Changed

- Narrow partial verdict criteria: emit partial only when compilation tool is unavailable, not when findings exist

## [1.0.0] - 2026-04-11

### Added

- Initial release

[2.2.1]: https://github.com/bmjcoding/agent-toolkit/compare/agent/integration-verifier-v2.2.0...agent/integration-verifier-v2.2.1
[2.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/integration-verifier-v2.0.0...agent/integration-verifier-v2.1.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/agent/integration-verifier-v2.0.0
[1.4.2]: https://github.com/bmjcoding/agent-toolkit/compare/agent/integration-verifier-v1.4.1...agent/integration-verifier-v1.4.2
[1.4.1]: https://github.com/bmjcoding/agent-toolkit/compare/agent/integration-verifier-v1.4.0...agent/integration-verifier-v1.4.1
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/integration-verifier-v2.0.0...agent/integration-verifier-v3.0.0
[1.3.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/integration-verifier-v1.2.0...agent/integration-verifier-v1.3.0
[1.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/integration-verifier-v1.1.0...agent/integration-verifier-v1.2.0
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/integration-verifier-v1.0.0...agent/integration-verifier-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/agent/integration-verifier-v1.0.0
