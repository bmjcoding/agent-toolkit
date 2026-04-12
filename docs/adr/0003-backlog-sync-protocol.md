# 0003. Backlog Sync Protocol

Date: 2026-04-12

## Status

Accepted

## Context

After the unified 12-column schema (ADR 0002), two backlog files exist with identical structure but different roles:

- `.orchestrator/backlog.md` — written by the pipeline; accumulates findings across sessions; treated as an append-only audit log
- `.claude/backlog.md` — maintained by the user; refined, prioritized, and resolved via the `/backlog` slash command

Users need a way to act on pipeline findings using slash-command tooling without losing their edits or merging the two files permanently. A naive copy would overwrite user edits on every pipeline run. A bidirectional sync would couple the pipeline to the personal file path and risk corrupting the audit log.

Two additional constraints drove the protocol shape:

1. **Rows without `finding_id`** — some findings are produced without a stable identifier. A pure ID-based dedup would silently reimport those rows on every sync.
2. **Status divergence** — a finding may be resolved in the personal backlog but still `open` in the pipeline file (e.g., user fixed it manually without a pipeline run). The sync must not clobber user-assigned status.

## Decision

`--sync` is a pull-only, user-triggered operation. It reads `.orchestrator/backlog.md` and appends new findings to `.claude/backlog.md`. It never writes to `.orchestrator/backlog.md`.

Deduplication uses a two-tier key:

1. **Primary**: `finding_id` — if both files contain a matching non-empty ID, the row is skipped regardless of other field values.
2. **Surrogate fallback**: when `finding_id` is empty, skip if the target file already has a row with the same `file` + `item` combination.

Status-change behavior: if a `finding_id` match is found, the existing row in `.claude/backlog.md` is not updated — user edits (including manual status changes) are preserved. The user must run `--retriage` explicitly if they want to propagate upstream status changes.

Import filter: only rows with status `open`, `in-progress`, or `blocked` are imported. Rows with `resolved`, `wont-fix`, `deferred-env`, or `deferred-session` are not imported; they exist in the pipeline file as audit history only.

## Consequences

- Users can safely re-run `--sync` without creating duplicate rows.
- A finding resolved upstream (in `.orchestrator/backlog.md`) is NOT auto-resolved in the personal backlog. This is intentional: the pipeline's status is authoritative for the pipeline; the user's personal backlog is theirs to manage.
- Findings without `finding_id` are deduplicated on content heuristic only (`file` + `item`). If the same logical finding is re-reported with different wording across sessions, it may be imported again. This is a known limitation; assigning `finding_id` values to all findings at seeding time is the correct long-term fix.
- Pull-only direction means the pipeline is never coupled to `.claude/backlog.md`. Pipeline correctness is not affected by the state of the personal backlog.
