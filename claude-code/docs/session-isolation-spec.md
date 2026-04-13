# Session Isolation Convention — Backlog

## Purpose

Session isolation matters because multiple Frankenstein runs on the same project accumulate findings in one flat backlog file. Without a session identifier, it is impossible to filter, prune, or report on findings from a specific run, or to distinguish carry-forward items from newly discovered ones. The `session_id` column in the unified 12-column schema allows per-session filtering and reporting without destroying cross-session history. This document defines the SESSION_ID format, the v1 flat-file convention, the per-session directory layout, and the carry-forward protocol.

---

## Session ID Format

`SESSION_ID` is a datetime stamp generated at Frankenstein startup:

```
YYYYMMDDTHHMMSS
```

Example value: `20260411T143022`

**Storage**: written to `.orchestrator/session.id` as a plain-text file — a single line with no trailing newline.

**Generation command** (implemented 2026-04-12 — wired in Frankenstein Phase 0; cross-reference: frankenstein.md Phase 0 and the 4 updated hooks):

```bash
SESSION_ID=$(date '+%Y%m%dT%H%M%S')
printf '%s' "$SESSION_ID" > .orchestrator/session.id
```

> **Note:** Using `printf '%s'` ensures no trailing newline, which is required for the hook-side regex format validation `^[0-9]{8}T[0-9]{6}$` to match.

---

## Current Location (v1)

In v1, a single `.orchestrator/backlog.md` holds all findings across sessions. The `session_id` column on each row records which Frankenstein session produced it.

To filter findings from a specific session:

```bash
grep '20260411T143022' .orchestrator/backlog.md
```

The `/backlog` slash command reads `.claude/backlog.md`. Items written by the slash command leave `session_id` as an empty string — the session_id column is only populated for pipeline-seeded rows.

---

## Per-Session Layout

Each Frankenstein session writes to its own subdirectory under `.orchestrator/sessions/`:

```
.orchestrator/sessions/<SESSION_ID>/backlog.md   # per-session findings
.orchestrator/backlog.md                          # merged cross-session backlog
.claude/backlog.md                                # user-facing / slash command
```

This layout enables per-session archiving, parallel session safety (each session has an exclusive write path), and clean pruning of old session data without touching the merged backlog.

---

## Flat Path Exceptions

The following paths are intentionally flat (not nested under `.orchestrator/sessions/<SESSION_ID>/`) because they serve cross-session or bootstrap roles:

- `.orchestrator/lock.d` — cross-session atomic mutex, acquired BEFORE SESSION_ID is generated. Using an atomic `mkdir` here prevents TOCTOU races when multiple Frankenstein sessions start simultaneously on the same project directory.
- `.orchestrator/backlog.md` — cross-session merged backlog; session findings accumulate here; remains flat so `/backlog --sync` has a stable path regardless of which session is active.
- `.orchestrator/session.id` — bootstrap sentinel; hooks read this to resolve the per-session root; cannot itself live inside the per-session root because it must be readable before the per-session root is known.

---

## Merge Protocol

The four-step merge protocol:

1. On Frankenstein startup (Phase 0), read `.orchestrator/backlog.md` to load carry-forward items — rows with status `open`, `blocked`, or `in-progress` from previous sessions.
2. Seed the new session backlog at `.orchestrator/sessions/<SESSION_ID>/backlog.md` with carry-forward items plus new findings from this session's handoffs.
3. At Phase 4 completion, merge back into `.orchestrator/backlog.md`: for rows with a matching `finding_id`, update `status` and `added_at`; for rows with no match, append as new rows.
4. Mark prior-session rows that were not re-reported in this session as `resolved` if the underlying file no longer contains the violation (verified by file content check, not by absence from handoffs alone).

---

## Interim session_id Usage (v1)

- Frankenstein Phase 4 Step 2 reads `$SID` from `.orchestrator/session.id` with a fallback to empty string if the file is absent: `SID=$(cat .orchestrator/session.id 2>/dev/null || echo '')`.
- All pipeline-seeded rows in `.orchestrator/backlog.md` carry this `session_id` in the last column.
- Rows written by the `/backlog` slash command carry empty `session_id`.
- To filter a specific session: `grep '<SESSION_ID>' .orchestrator/backlog.md`
- Phase 0 generates `.orchestrator/session.id` as of 2026-04-12. All rows seeded by the current release carry the session's SESSION_ID. Per-session filtering is available.

---

## Carry-Forward Convention

- Any row in `.orchestrator/backlog.md` with status `open`, `blocked`, or `in-progress` is a carry-forward item at the start of a new session.
  - `in-progress`: Items claimed by an agent mid-session but not yet complete — carrying forward preserves the active-work marker across session boundaries.
- Carry-forward items retain their original `session_id`; they are not re-assigned to the new session's ID.
- The quality-engineer agent should read `.orchestrator/backlog.md` at Phase 4 start to load carry-forward items before processing new findings from handoffs, preventing duplicate entries for unresolved findings.
- Items with status `resolved`, `wont-fix`, `deferred-env`, or `deferred-session` are not carry-forward items and should not be re-processed by the new session.
