# Session Isolation Convention — Backlog

## Purpose

Session isolation matters because multiple Frankenstein runs on the same project accumulate findings in one flat backlog file. Without a session identifier, it is impossible to filter, prune, or report on findings from a specific run, or to distinguish carry-forward items from newly discovered ones. The `session_id` column in the unified 12-column schema allows per-session filtering and reporting without destroying cross-session history. This document defines the SESSION_ID format, the v1 flat-file convention, the deferred v2 per-session directory layout, and the carry-forward protocol.

---

## Session ID Format

`SESSION_ID` is a datetime stamp generated at Frankenstein startup:

```
YYYYMMDDTHHMMSS
```

Example value: `20260411T143022`

**Storage**: written to `.orchestrator/session.id` as a plain-text file — a single line with no trailing newline padding.

**Generation command** (SPEC ONLY — Frankenstein Phase 0 does not yet run this command; a future task will wire it in):

```bash
SESSION_ID=$(date '+%Y%m%dT%H%M%S')
echo "$SESSION_ID" > .orchestrator/session.id
```

---

## Current Location (v1)

In v1, a single `.orchestrator/backlog.md` holds all findings across sessions. The `session_id` column on each row records which Frankenstein session produced it.

To filter findings from a specific session:

```bash
grep '20260411T143022' .orchestrator/backlog.md
```

The `/backlog` slash command reads `.claude/backlog.md`. Items written by the slash command leave `session_id` as an empty string — the session_id column is only populated for pipeline-seeded rows.

---

## Per-Session Layout (v2, DEFERRED)

> **DEFERRED**: v2 is not implemented in this release. This section defines the target state for a future task.

In v2, each Frankenstein session writes to its own subdirectory under `.orchestrator/sessions/`:

```
.orchestrator/sessions/<SESSION_ID>/backlog.md   # per-session findings
.orchestrator/backlog.md                          # merged cross-session backlog
.claude/backlog.md                                # user-facing / slash command
```

This layout enables per-session archiving, parallel session safety (each session has an exclusive write path), and clean pruning of old session data without touching the merged backlog.

---

## Merge Protocol (v2, DEFERRED)

> **DEFERRED**: Not implemented.

The four-step merge protocol for v2:

1. On Frankenstein startup (Phase 0), read `.orchestrator/backlog.md` to load carry-forward items — rows with status `open` or `blocked` from previous sessions.
2. Seed the new session backlog at `.orchestrator/sessions/<SESSION_ID>/backlog.md` with carry-forward items plus new findings from this session's handoffs.
3. At Phase 4 completion, merge back into `.orchestrator/backlog.md`: for rows with a matching `finding_id`, update `status` and `added_at`; for rows with no match, append as new rows.
4. Mark prior-session rows that were not re-reported in this session as `resolved` if the underlying file no longer contains the violation (verified by file content check, not by absence from handoffs alone).

---

## Interim session_id Usage (v1)

- Frankenstein Phase 4 Step 2 reads `$SID` from `.orchestrator/session.id` with a fallback to empty string if the file is absent: `SID=$(cat .orchestrator/session.id 2>/dev/null || echo '')`.
- All pipeline-seeded rows in `.orchestrator/backlog.md` carry this `session_id` in the last column.
- Rows written by the `/backlog` slash command carry empty `session_id`.
- To filter a specific session: `grep '<SESSION_ID>' .orchestrator/backlog.md`
- Because Phase 0 does not yet generate `.orchestrator/session.id`, all rows seeded by the current release carry an empty `session_id`. Per-session filtering is available once Phase 0 wires in the SESSION_ID generation command above.

---

## Carry-Forward Convention

- Any row in `.orchestrator/backlog.md` with status `open` or `blocked` is a carry-forward item at the start of a new session.
- Carry-forward items retain their original `session_id`; they are not re-assigned to the new session's ID.
- The quality-engineer agent should read `.orchestrator/backlog.md` at Phase 4 start to load carry-forward items before processing new findings from handoffs, preventing duplicate entries for unresolved findings.
- Items with status `resolved`, `wont-fix`, `deferred-env`, or `deferred-session` are not carry-forward items and should not be re-processed by the new session.
