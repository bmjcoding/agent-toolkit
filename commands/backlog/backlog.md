---
name: backlog
description: >
  View, resolve, retriage, or clear items in the pipeline backlog. Use when the user wants to
  check the backlog, resolve items, or manage deferred findings.
disable-model-invocation: true
argument-hint: "[--resolve N] [--resolve N --wont-fix \"reason\"] [--defer N --env ENV \"reason\"] [--defer N --session \"reason\"] [--retriage] [--clear-resolved] [--agent] [--human] [--env ENV] [--open] [--sync] [--cleanup] [--dry-run]"
metadata:
  version: 2.3.0
---

Manage the pipeline backlog at `.claude/backlog.md`. Scope resolution and autonomy rules are defined in CLAUDE.md.

## Default action (no arguments)

Read and display `.claude/backlog.md`. If it doesn't exist, report "No backlog items."

## Arguments

`$ARGUMENTS`

- **No args** — display the backlog
- **`--resolve <N>`** — mark item #N in Agent Actionable as `resolved` (retain the row; do NOT remove it)
- **`--resolve <N> --wont-fix "<reason>"`** — mark item #N as `wont-fix`, populate reason with reason
- **`--defer <N> --env <env> "<reason>"`** — mark item #N as `deferred-env`, set environment=<env>, reason=<reason>
- **`--defer <N> --session "<reason>"`** — mark item #N as `deferred-session`, reason=<reason>
- **`--retriage`** — re-check all Agent Actionable open/in-progress/blocked items against the current codebase. If an item has already been fixed, mark it resolved. Report what changed.
- **`--clear-resolved`** — remove all rows with status=`resolved` or status=`wont-fix` from BOTH files when present: `.claude/backlog.md` (user's personal backlog) AND `.orchestrator/backlog.md` (pipeline's accumulated cross-session backlog in the current CWD). Renumber the `#` column sequentially after removal in each file. Also prune stale `## Known context` subsections in `.claude/backlog.md`: for any `### <title> (items X, Y-Z)` or `### <title> (item X)` subsection, if ALL referenced item numbers are in the set being cleared, the subsection is deleted. (Known context pruning does NOT apply to `.orchestrator/backlog.md` since it doesn't use Known context subsections.)
- **`--agent`** — show only Agent Actionable section, only open/blocked rows
- **`--human`** — show only Needs Human Decision section, only open/blocked rows
- **`--env <env>`** — filter rows where environment matches `<env>` or `any`
- **`--open`** — show only rows with status=`open`, status=`in-progress`, or status=`blocked`
- **`--sync`** — pull new findings from `.orchestrator/backlog.md` into `.claude/backlog.md`. See [Sync Protocol](#sync-protocol) for deduplication and routing rules. Reports: N items imported, M items skipped (already present), K items skipped (status=resolved/wont-fix). Pull-only — does not write to `.orchestrator/backlog.md`.
- **`--cleanup`** — full housekeeping pass on BOTH backlog files (.claude/backlog.md + .orchestrator/backlog.md when present). Equivalent to `--clear-resolved` plus: refresh `Last updated:` header in each file, emit a per-file summary report `(N rows cleared in <file>, M Known context subsections pruned in .claude/backlog.md)`. Use this as the one-stop cleanup after reviewing resolved items.
- **`--dry-run`** — modifier compatible with `--clear-resolved`, `--cleanup`, `--retriage`, `--sync`. Prints the planned changes (rows to remove, subsections to prune, findings to import) but does NOT write to the file. Use to preview before executing.

## Backlog format

The backlog file uses this structure:

```markdown
# Backlog

Last updated: YYYY-MM-DDTHH:MM

## Needs Human Decision
| # | status | severity | environment | file | item | reason | source | finding_id | phase | added_at | session_id |
|---|--------|----------|-------------|------|------|-----------------|--------|------------|-------|----------|------------|

## Agent Actionable
| # | status | severity | environment | file | item | reason | source | finding_id | phase | added_at | session_id |
|---|--------|----------|-------------|------|------|-----------------|--------|------------|-------|----------|------------|
```

## Field definitions

- `#` — Sequential integer per section. Stable until --clear-resolved runs.
- `status` — One of: `open`, `in-progress`, `deferred-env`, `deferred-session`, `blocked`, `resolved`, `wont-fix`. Default for new items: `open`.
- `severity` — Lowercase only: `critical`, `high`, `medium`, `low`.
- `environment` — Where this item can be worked on: `any`, `work`, `personal`. Default: `any`.
- `file` — Relative path to the affected file, or `unspecified` if cross-cutting.
- `item` — One-line description of the finding or action needed.
- `reason` — Populated when status is `deferred-env`, `deferred-session`, `blocked`, or `wont-fix`. Empty string otherwise.
- `source` — Agent role or user label that added the item (e.g., `security-engineer`, `prod-readiness`, `user`). NOT a commit hash.
- `finding_id` — Stable cross-reference ID in format `<prefix>-NNN` (e.g., `sec-001`, `sre-003`). Empty string if not assigned.
- `phase` — Originating pipeline phase (e.g., `Security`, `SRE`, `Lint`, `Design`, `Phase4`) or empty string.
- `added_at` — ISO-8601 timestamp truncated to minute: `YYYY-MM-DDTHH:MM`.
- `session_id` — Frankenstein session ID that produced this item, or empty string for slash-command-originated items.

## Status values

- `open` — Unresolved, actively on the queue.
- `in-progress` — Claimed by an agent but not yet complete. Use this when a fix is in flight.
- `deferred-env` — Cannot be worked in the current environment. Retry when environment matches the `environment` column.
- `deferred-session` — Deferred to a future Frankenstein session.
- `blocked` — Cannot proceed until another item or external condition clears. Reason in `reason`.
- `resolved` — Fixed. Row retained for audit trail until --clear-resolved runs.
- `wont-fix` — Explicitly accepted as not worth addressing. Reason in `reason`.

## Classification rules

**Needs Human Decision**: the fix requires external context the agent does not have. Credentials, infrastructure choices, stakeholder sign-off, production configs, compliance decisions, API strategy, auth strategy.

**Agent Actionable**: the fix is pure code work with no external dependencies. Adding stubs, installing/configuring tooling, adding middleware, writing tests, removing unused deps, fixing lint violations.

## Known limitations

- `.orchestrator/backlog.md` (written by the Frankenstein pipeline) uses the same 12-column schema but is a SEPARATE file in the current working directory (not `~/.claude/backlog.md`). Items in `.orchestrator/backlog.md` are not visible to `--resolve`, `--defer`, or `--retriage` (those flags operate only on `.claude/backlog.md`). However, `--clear-resolved` and `--cleanup` DO operate on both files when `.orchestrator/backlog.md` exists in the CWD. To import pipeline findings into your personal backlog, run `--sync` (pull-only). Pipeline runs never modify `.claude/backlog.md` automatically.
- **`--clear-resolved` context pruning is conservative**: subsections under `## Known context` are only deleted when ALL referenced item numbers are being cleared. If a subsection references items that remain active (e.g., "items 1-5" where items 3-5 are cleared but 1-2 remain), the subsection is preserved and may contain stale number references. Use `--cleanup --dry-run` to preview and manually edit if full section removal is desired.

## Sync Protocol

### Why two files exist
The Frankenstein pipeline operates on session-scoped paths. Each pipeline run extracts findings from per-session handoffs (`.orchestrator/sessions/<SESSION_ID>/handoffs/*.json`) and appends them to `.orchestrator/backlog.md` (the flat cross-session merged file — a path exception that never moves into per-session directories). The slash command (`/backlog`) operates on `.claude/backlog.md` — the user's personal, manually-refined, durable backlog. These files are kept separate so pipeline runs never clobber user edits and so the pipeline is not coupled to the personal file path.

As of backlog v2.3.0 + frankenstein v1.11.0, `.orchestrator/backlog.md` uses append-with-dedup semantics: prior sessions' open findings are preserved; only new finding_ids are appended. Shipped findings are automatically marked `resolved` in `.orchestrator/backlog.md` by Frankenstein Phase 6c at end of session. Run `/backlog --clear-resolved` (or `--cleanup`) periodically to prune.

### When to sync
Run `/backlog --sync` any time you want to act on pipeline findings using the slash command. Sync is manual and user-controlled. There is no automatic sync on pipeline completion — this is intentional (the user may want to review `.orchestrator/backlog.md` before importing).

### Deduplication guarantee
`--sync` is idempotent. Running it twice imports nothing on the second run. Dedup uses `finding_id` as the primary key. When `finding_id` is empty or missing, a surrogate content-hash of `file|item` is used.

### Status-change behavior on dedup match
`--sync` is strictly pull-only for NEW findings. If a finding_id already exists in `.claude/backlog.md`, the row is not touched — even if its status differs from the pipeline file (e.g., pipeline has `resolved` but personal file has `open`). Users who want to propagate upstream status changes should use `--retriage` manually after reviewing the difference. This avoids clobbering user edits to the personal backlog.

### Import filter
Only rows with status in (`open`, `in-progress`, `blocked`) are imported. Rows with status `resolved`, `wont-fix`, `deferred-env`, or `deferred-session` in `.orchestrator/backlog.md` are historical audit entries and are NOT imported.

### Section routing
- Rows from the `Agent Actionable` section in `.orchestrator/backlog.md` are appended to the `Agent Actionable` section in `.claude/backlog.md`.
- Rows from the `Needs Human Decision` section are appended to the `Needs Human Decision` section.

### Direction
`--sync` is pull-only. It reads `.orchestrator/backlog.md` (read-only) and writes to `.claude/backlog.md`. It never modifies `.orchestrator/backlog.md`. This keeps the pipeline's audit trail intact and avoids coupling the pipeline to the personal file path.

## Gotchas

- **Resolved items are retained until --clear-resolved**: `--resolve N` marks status=resolved but leaves the row. Item numbers are stable until you run `--clear-resolved`, which removes resolved/wont-fix rows and renumbers.
- **Retriage can auto-resolve**: `--retriage` checks the current codebase and marks items resolved if the underlying file changed. Let retriage do this rather than manually resolving items that have already been fixed.
- **Severity must be lowercase**: `critical`, `high`, `medium`, `low`. The old ALL-CAPS format is not valid in the unified schema.
- **When adding items manually**: populate `added_at` with the current timestamp (`YYYY-MM-DDTHH:MM`) and `source` with an appropriate label (`user`, `prod-readiness`, `security-engineer`, etc.).
- **Both backlog files use the same schema**: `.claude/backlog.md` (slash command) and `.orchestrator/backlog.md` (pipeline) now share this 12-column format. The pipeline file is seeded by Frankenstein Phase 4 Step 2.
