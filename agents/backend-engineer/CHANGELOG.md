# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2026-04-27

### Changed

- Stripped project-specific `Fixture Creation Rules` items referencing `VALID_PREFIXES`, `resetStorageService()`, and `apps/backend/tests/setup.ts` — these belonged in a project's own `AGENTS.md`, not the shared agent definition. The general "no symlinks in fixture directories" rule is preserved. Treated as MINOR rather than MAJOR because the removed content was project-specific examples that did not belong in a framework-agnostic agent; the agent's behavioural contract with consumers is unchanged.
- Stripped the framework-specific `Hono/OpenAPI Patterns` section (`c.req.valid('json')` etc.) for the same reason. The general guidance "use the project's existing validation approach for all inputs" already covers framework-agnostic intent.
- Replaced the `Untrusted Data Boundary` invariants block with a reference to `rules/untrusted-data-boundary/`.

## [2.1.0] - 2026-04-15

### Added

- Added an exploration mode that writes session-scoped backend summaries and inventories
  for the planner and downstream implementation agents.

### Changed

- Declared canonical `lifecycle` metadata in the shared root definition so the distribution catalog can publish maturity separately from per-tool availability for this agent.
- Clarified that backend write boundaries are mode-specific: exploration writes only
  orchestrator context artifacts, while implementation remains constrained to
  `owned_files`.
- Updated the Claude adapter reference to the flattened `claude-code/agents/<name>.md`
  layout used by the tool-specific generated surfaces.

## [2.0.0] - 2026-04-15

### Changed

- Declared shared execution metadata in the canonical root definition so model tier, capabilities, subagent routing, and skill dependencies no longer need to be inferred from tool-specific wrappers.

- Moved the canonical agent definition and changelog to `agents/backend-engineer/`; Claude, Copilot, and Codex files are now tool-specific adapters generated from the shared source.
- Updated comparison links to use the shared `agent/backend-engineer` tag namespace for this root canonical component.

### Removed

- Removed the redundant Claude-specific changelog copy from `claude-code/agents/backend-engineer/CHANGELOG.md`.

## [1.3.1] - 2026-04-14

### Changed
- Factored standard 4-bullet untrusted-data prelude and instruction sandwich out to `improve/references/security-preamble.md`. Agent-specific preamble, rules, and runaway guard remain inline.

## [1.3.0] - 2026-04-14

### Changed

- Genericized Fixture Creation Rules #2: replaced project-specific `VALID_PREFIXES` symbol and `resetStorageService()` function name with generic language (fixes B-1 and B-2 project-bias findings)
- Condensed Hono/OpenAPI `c.req.valid` guidance from three bullets into a single reference table (fixes B-3 verbosity finding)

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: restructured for v3.0 per-tool layout. Claude Code remains under `claude-code/` for tool-native assets. At that point in history, shared rules and skills were described as living under `claude-code/rules/` and `claude-code/skills/`.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `agents/backend-engineer/` → `claude-code/agents/backend-engineer/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.2.0] - 2026-04-11

### Added

- Post-change compile check step: run tsc --noEmit after all changes before writing handoff

## [1.1.0] - 2026-04-11

### Added

- Fixture creation rules: no-symlinks prohibition, VALID_PREFIXES reset validation, live count check before assertions

## [1.0.0] - 2026-04-11

### Added

- Initial release
