---
name: backlog
description: >
  View, resolve, retriage, or clear items in the pipeline backlog. Use when the user wants to
  check the backlog, resolve items, or manage deferred findings.
disable-model-invocation: true
argument-hint: "[--resolve N] [--resolve N --wont-fix \"reason\"] [--defer N --env ENV \"reason\"] [--defer N --session \"reason\"] [--retriage] [--clear-resolved] [--agent] [--human] [--env ENV] [--open]"
metadata:
  version: 2.0.0
---

Manage the pipeline backlog at `.claude/backlog.md`. Scope resolution and autonomy rules are defined in CLAUDE.md.

## Default action (no arguments)

Read and display `.claude/backlog.md`. If it doesn't exist, report "No backlog items."

## Arguments

`$ARGUMENTS`

- **No args** — display the backlog
- **`--resolve <N>`** — mark item #N in Agent Actionable as `resolved` (retain the row; do NOT remove it)
- **`--resolve <N> --wont-fix "<reason>"`** — mark item #N as `wont-fix`, populate deferred_reason with reason
- **`--defer <N> --env <env> "<reason>"`** — mark item #N as `deferred-env`, set environment=<env>, deferred_reason=<reason>
- **`--defer <N> --session "<reason>"`** — mark item #N as `deferred-session`, deferred_reason=<reason>
- **`--retriage`** — re-check all Agent Actionable open/blocked items against the current codebase. If an item has already been fixed, mark it resolved. Report what changed.
- **`--clear-resolved`** — remove all rows with status=`resolved` or status=`wont-fix`. Renumber the `#` column sequentially after removal.
- **`--agent`** — show only Agent Actionable section, only open/blocked rows
- **`--human`** — show only Needs Human Decision section, only open/blocked rows
- **`--env <env>`** — filter rows where environment matches `<env>` or `any`
- **`--open`** — show only rows with status=`open` or status=`blocked`

## Backlog format

The backlog file uses this structure:

```markdown
# Backlog

Last updated: YYYY-MM-DDTHH:MM

## Needs Human Decision
| # | status | severity | environment | file | item | deferred_reason | source | finding_id | phase | added_at | session_id |
|---|--------|----------|-------------|------|------|-----------------|--------|------------|-------|----------|------------|

## Agent Actionable
| # | status | severity | environment | file | item | deferred_reason | source | finding_id | phase | added_at | session_id |
|---|--------|----------|-------------|------|------|-----------------|--------|------------|-------|----------|------------|
```

## Field definitions

- `#` — Sequential integer per section. Stable until --clear-resolved runs.
- `status` — One of: `open`, `deferred-env`, `deferred-session`, `blocked`, `resolved`, `wont-fix`. Default for new items: `open`.
- `severity` — Lowercase only: `critical`, `high`, `medium`, `low`.
- `environment` — Where this item can be worked on: `any`, `work`, `personal`. Default: `any`.
- `file` — Relative path to the affected file, or `unspecified` if cross-cutting.
- `item` — One-line description of the finding or action needed.
- `deferred_reason` — Populated when status is `deferred-env`, `deferred-session`, `blocked`, or `wont-fix`. Empty string otherwise.
- `source` — Agent role or user label that added the item (e.g., `security-engineer`, `prod-readiness`, `user`). NOT a commit hash.
- `finding_id` — Stable cross-reference ID in format `<prefix>-NNN` (e.g., `sec-001`, `sre-003`). Empty string if not assigned.
- `phase` — Originating pipeline phase (e.g., `Security`, `SRE`, `Lint`, `Design`, `Phase4`) or empty string.
- `added_at` — ISO-8601 timestamp truncated to minute: `YYYY-MM-DDTHH:MM`.
- `session_id` — Frankenstein session ID that produced this item, or empty string for slash-command-originated items.

## Status values

- `open` — Unresolved, actively on the queue.
- `deferred-env` — Cannot be worked in the current environment. Retry when environment matches the `environment` column.
- `deferred-session` — Deferred to a future Frankenstein session.
- `blocked` — Cannot proceed until another item or external condition clears. Reason in `deferred_reason`.
- `resolved` — Fixed. Row retained for audit trail until --clear-resolved runs.
- `wont-fix` — Explicitly accepted as not worth addressing. Reason in `deferred_reason`.

## Classification rules

**Needs Human Decision**: the fix requires external context the agent does not have. Credentials, infrastructure choices, stakeholder sign-off, production configs, compliance decisions, API strategy, auth strategy.

**Agent Actionable**: the fix is pure code work with no external dependencies. Adding stubs, installing/configuring tooling, adding middleware, writing tests, removing unused deps, fixing lint violations.

## Known limitations

- `.orchestrator/backlog.md` (written by the Frankenstein pipeline) uses the same 12-column schema but is a SEPARATE file. Items in `.orchestrator/backlog.md` are not visible to `--resolve`, `--defer`, or `--retriage`. To act on pipeline findings, first merge them into `.claude/backlog.md` (see the session isolation spec). A future v2 release will add automatic bidirectional sync.

## Gotchas

- **Resolved items are retained until --clear-resolved**: `--resolve N` marks status=resolved but leaves the row. Item numbers are stable until you run `--clear-resolved`, which removes resolved/wont-fix rows and renumbers.
- **Retriage can auto-resolve**: `--retriage` checks the current codebase and marks items resolved if the underlying file changed. Let retriage do this rather than manually resolving items that have already been fixed.
- **Severity must be lowercase**: `critical`, `high`, `medium`, `low`. The old ALL-CAPS format is not valid in the unified schema.
- **When adding items manually**: populate `added_at` with the current timestamp (`YYYY-MM-DDTHH:MM`) and `source` with an appropriate label (`user`, `prod-readiness`, `security-engineer`, etc.).
- **Both backlog files use the same schema**: `.claude/backlog.md` (slash command) and `.orchestrator/backlog.md` (pipeline) now share this 12-column format. The pipeline file is seeded by Frankenstein Phase 4 Step 2.
