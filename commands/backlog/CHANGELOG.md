# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.1.0] - 2026-04-12

### Added

- `in-progress` status value: marks items actively being worked on in the current session. Carried forward across session boundaries.
- `--sync` subcommand: pulls new findings from `.orchestrator/backlog.md` into `.claude/backlog.md`. Pull-only, dedup by `finding_id` (content-hash fallback for rows without a finding_id). Reports items imported, skipped (already present), and skipped (status excluded). Does not write to `.orchestrator/backlog.md`.

### Changed

- `deferred_reason` column renamed to `reason` — field applies to `deferred-env`, `deferred-session`, `blocked`, and `wont-fix` statuses, not only deferred items. Schema header and all references updated.
- `source` field now normalized to lowercase on Phase 4 seed (`ascii_downcase` + whitespace strip), preventing mixed-case duplicates across pipeline runs.

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

[Unreleased]: https://github.com/bmjcoding/claude-toolkit/compare/backlog-v2.1.0...HEAD
[2.1.0]: https://github.com/bmjcoding/claude-toolkit/compare/backlog-v2.0.0...backlog-v2.1.0
[2.0.0]: https://github.com/bmjcoding/claude-toolkit/compare/backlog-v1.0.1...backlog-v2.0.0
[1.0.1]: https://github.com/bmjcoding/claude-toolkit/compare/backlog-v1.0.0...backlog-v1.0.1
[1.0.0]: https://github.com/bmjcoding/claude-toolkit/tree/backlog-v1.0.0
