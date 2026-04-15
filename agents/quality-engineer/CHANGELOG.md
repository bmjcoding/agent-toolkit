# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Remediation guidance now treats canonical `findings` as the primary upstream contract,
  requires plan-backed repair scopes before editing, and explicitly allows only the
  standard post-validation handoff emission in read-only mode.

## [2.0.0] - 2026-04-15

### Changed

- Declared shared execution metadata in the canonical root definition so model tier, capabilities, subagent routing, and skill dependencies no longer need to be inferred from tool-specific wrappers.

- Moved the canonical agent definition and changelog to `agents/quality-engineer/`; Claude, Copilot, and Codex files are now tool-specific adapters generated from the shared source.
- Updated comparison links to use the shared `agent/quality-engineer` tag namespace for this root canonical component.

### Removed

- Removed the redundant Claude-specific changelog copy from `claude-code/agents/quality-engineer/CHANGELOG.md`.

## [1.4.1] - 2026-04-14

### Changed
- Factored standard 4-bullet untrusted-data prelude and instruction sandwich out to `improve/references/security-preamble.md`. Agent-specific preamble, rules, and runaway guard remain inline.

## [1.4.0] - 2026-04-14

### Changed

- Output section consolidated: three separate mode-specific handoff JSON blocks replaced with a single canonical schema and a notes-pattern table (saves ~35 lines).
- Printf/accumulation check (REC-14): replaced project-specific variable names `AGENT_ROWS`/`HUMAN_ROWS` with generic placeholder `<ACCUMULATION_VAR>` and `frankenstein.md` reference with `orchestrator scripts` (Q-1 — removes project-bias).
- Backlog path `.orchestrator/backlog.md` annotated with inline comment clarifying it is persistent across sessions and not `$SID`-scoped (Q-2).

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: restructured for v3.0 per-tool layout. Claude Code remains under `claude-code/` for tool-native assets. At that point in history, shared rules and skills were described as living under `claude-code/rules/` and `claude-code/skills/`.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `agents/quality-engineer/` → `claude-code/agents/quality-engineer/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.3.0] - 2026-04-12

### Added

- Printf/accumulation end-to-end check in Remediation mode: when applying security fixes that modify `printf` format specifiers (e.g., `printf "%b"` -> `printf '%s'`), also verify accumulation variables use `$'\n'` (ANSI-C quoting) not literal `\n` strings, which `printf '%s'` does not expand; mandatory for fixes to frankenstein.md, hooks, or any shell script building multi-line output strings (REC-14).

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/agent/quality-engineer-v2.0.0...HEAD
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/agent/quality-engineer-v2.0.0
[1.4.1]: https://github.com/bmjcoding/agent-toolkit/compare/agent/quality-engineer-v1.4.0...agent/quality-engineer-v1.4.1
[1.4.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/quality-engineer-v1.3.0...agent/quality-engineer-v1.4.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/quality-engineer-v2.0.0...agent/quality-engineer-v3.0.0
[1.3.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/quality-engineer-v1.0.0...agent/quality-engineer-v1.3.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/agent/quality-engineer-v1.0.0
