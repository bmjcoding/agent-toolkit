# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.2.0] - 2026-04-15

### Changed

- Declared canonical `lifecycle` metadata in the shared root definition so the distribution catalog can publish maturity separately from per-tool availability for this workflow.

## [5.1.0] - 2026-04-15

### Changed

- Declared the shared argument hint in the canonical root workflow definition so command usage metadata is generated from the source of truth instead of copied back from adapters.

## [5.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [4.0.0] - 2026-04-12

### Changed

- BREAKING: restructured for v3.0 per-tool layout. Claude Code remains under `claude-code/` for tool-native assets. At that point in history, shared rules and skills were described as living under `claude-code/rules/` and `claude-code/skills/`.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `commands/backlog/` → `claude-code/commands/backlog/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [2.3.0] - 2026-04-12

### Changed

- `--clear-resolved` and `--cleanup` now operate on BOTH `.claude/backlog.md` and `.orchestrator/backlog.md` (when the pipeline backlog exists in CWD). Previously only `.claude/backlog.md` was cleared. Enables housekeeping for the pipeline's accumulating cross-session backlog.
- Sync Protocol docs updated to reflect `.orchestrator/backlog.md` accumulation semantics (frankenstein v1.11.0 introduces append-with-dedup + Phase 6c auto-resolve).

## [2.2.0] - 2026-04-12

### Added

- `--cleanup` flag — full housekeeping pass combining `--clear-resolved` with header timestamp refresh and summary report.
- `--dry-run` modifier — compatible with `--clear-resolved`, `--cleanup`, `--retriage`, `--sync`. Previews planned changes without writing.

### Changed

- `--clear-resolved` now also prunes stale `## Known context` subsections when ALL referenced item numbers are in the cleared set. Subsections with any remaining active items are preserved.

## [2.1.0] - 2026-04-12

### Added

- `--sync` subcommand: pull-only import from `.orchestrator/backlog.md` to `.claude/backlog.md`. Deduplicates by `finding_id` (primary) or `file`+`item` surrogate. Only imports rows with status `open`, `in-progress`, or `blocked` (CLAUD-002).
- `in-progress` status value: sixth status alongside `open`, `deferred-env`, `deferred-session`, `blocked`, `resolved`, `wont-fix`. Included in carry-forward convention and `--open` filter (CLAUD-009).

### Changed

- Schema field renamed `deferred_reason` → `reason`. Field covers all non-open status annotations (blocked, wont-fix, deferred-*, in-progress). Historical column name was overly narrow (CLAUD-007).

## [2.0.0] - 2026-04-11

### Changed

- Unified backlog schema: replaced 6-column format (`# | Severity | File | Item | Phase | Added`) with 12-column format (`# | status | severity | environment | file | item | deferred_reason | source | finding_id | phase | added_at | session_id`).
- `--resolve N` now marks status=`resolved` and retains the row instead of deleting it. Item numbers are stable until `--clear-resolved` runs.
- `argument-hint` updated to reflect all new argument forms.

### Added

- `status` column with six values: `open`, `deferred-env`, `deferred-session`, `blocked`, `resolved`, `wont-fix`.
- `environment` column (`any`, `work`, `personal`) for environment-aware filtering.
- `deferred_reason` column populated when status is deferred, blocked, or wont-fix.
- `source` column recording the agent role or user label that added the item.
- `finding_id` column for stable cross-reference IDs (`<prefix>-NNN` format).
- `added_at` column using ISO-8601 timestamp truncated to minute (`YYYY-MM-DDTHH:MM`).
- `session_id` column recording the Frankenstein session that produced the item (empty for slash-command items).
- `--resolve N --wont-fix "<reason>"` argument to mark an item as wont-fix with a recorded reason.
- `--defer N --env <env> "<reason>"` argument to defer an item to a specific environment.
- `--defer N --session "<reason>"` argument to defer an item to a future Frankenstein session.
- `--env <env>` argument to filter rows by environment.
- `--open` argument to show only open/blocked rows.
- Field definitions section documenting all 12 columns.
- Status values section documenting all 6 status strings.
- Both `.claude/backlog.md` and `.orchestrator/backlog.md` now share this unified schema.

## [1.0.1] - 2026-04-11

### Fixed

- Corrected argument-hint to reflect actual supported flags.

## [1.0.0] - 2026-04-11

### Added

- Initial release

[5.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/workflow/backlog-v5.1.0...workflow/backlog-v5.2.0
[5.1.0]: https://github.com/bmjcoding/agent-toolkit/tree/workflow/backlog-v5.1.0
[5.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/workflow/backlog-v4.0.0...workflow/backlog-v5.0.0
[4.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/workflow/backlog-v3.0.0...workflow/backlog-v4.0.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/workflow/backlog-v2.3.0...workflow/backlog-v3.0.0
[2.3.0]: https://github.com/bmjcoding/agent-toolkit/compare/workflow/backlog-v2.2.0...workflow/backlog-v2.3.0
[2.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/workflow/backlog-v2.1.0...workflow/backlog-v2.2.0
[2.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/workflow/backlog-v2.0.0...workflow/backlog-v2.1.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/workflow/backlog-v1.0.1...workflow/backlog-v2.0.0
[1.0.1]: https://github.com/bmjcoding/agent-toolkit/compare/workflow/backlog-v1.0.0...workflow/backlog-v1.0.1
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/workflow/backlog-v1.0.0
