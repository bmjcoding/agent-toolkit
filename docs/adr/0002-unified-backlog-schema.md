# 0002. Unified Backlog Schema

Date: 2026-04-11

## Status

Accepted

## Context

The claude-toolkit backlog system evolved independently in two places:

- The `/backlog` slash command wrote to `.claude/backlog.md` using a 6-column format: `# | Severity | File | Item | Phase | Added`
- The Frankenstein orchestration pipeline seeded `.orchestrator/backlog.md` using a 5-column format: `severity | file | finding | finding_id | source`

Because the schemas were incompatible, a finding surfaced by Frankenstein and a finding entered via the slash command could not be merged, compared, or filtered by a common tool. Item numbers were unstable: resolving an item deleted the row, shifting numbers for all subsequent items.

Two specific gaps drove this change:

1. **Environment-awareness**: findings that apply only in a work or personal environment could not be marked as such; they appeared in all contexts and created noise.
2. **Session traceability**: multiple Frankenstein runs on the same project accumulated findings with no way to identify which run produced a given row.

The two-location split (`.claude/` for the slash command, `.orchestrator/` for Frankenstein) is an existing structural constraint that is not resolved by this change.

## Decision

Adopt a single 12-column schema for both backlog file locations:

```
# | status | severity | environment | file | item | reason | source | finding_id | phase | added_at | session_id
```

Key choices within this schema:

- **Status replaces deletion**: resolving an item sets `status=resolved` and retains the row. Item numbers are stable until `--clear-resolved` is run explicitly. This prevents number drift during an active session.
- **Seven status values** cover the lifecycle: `open`, `in-progress`, `deferred-env`, `deferred-session`, `blocked`, `resolved`, `wont-fix`. The deferred statuses record the reason in `reason` so decisions are auditable without a separate log.
- **Environment column** (`any`, `work`, `personal`) allows filtering findings to the current context without maintaining separate files.
- **session_id column** is populated by Phase 0 of the Frankenstein orchestrator, which generates SESSION_ID in format `YYYYMMDDTHHMMSS` and writes it to `.orchestrator/session.id` as of 2026-04-12. All pipeline-seeded rows carry this value.
- **Two-location sync** (`.claude/backlog.md` and `.orchestrator/backlog.md`) is documented as a known limitation. Automated sync via `/backlog --sync` is implemented as of 2026-04-12; the shared schema is the prerequisite that makes sync feasible.

## Consequences

- The `/backlog` slash command and Frankenstein Phase 4 Step 2 both produce rows in the same format. A user can copy rows between files without reformatting.
- Existing backlog files in the 6-column or 5-column format require a one-time manual migration. The migration steps and schema mapping are documented in `docs/backlog-migration-guide.md`.
- Item number stability reduces confusion when resolving items during a long Frankenstein run. The trade-off is that resolved rows accumulate until `--clear-resolved` is called, slightly increasing file size.
- The `session_id` column is populated for all rows seeded by Frankenstein Phase 0 (implemented 2026-04-12). Tools that filter by `session_id` will see populated values for all current pipeline-generated items; rows written by the `/backlog` slash command carry empty `session_id`.
- The two-location split remains. Users who run both the slash command and Frankenstein in the same project will have two backlog files with the same schema but different contents. Automated sync via `/backlog --sync` bridges the gap; the files converge to a single source of truth after each sync.
