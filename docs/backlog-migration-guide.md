# Backlog Migration Guide — Unified Schema

## Overview

The unified 12-column backlog schema replaces two incompatible formats that diverged across the claude-toolkit and Frankenstein pipeline: the 6-column slash command format (`.claude/backlog.md`) and the 5-column Frankenstein format (`.orchestrator/backlog.md`). This guide covers converting existing backlog files to the new 12-column format, handling data quality issues found in live files, and tracking migration status per repository. Both backlog file locations now use the same schema as defined in `/Users/bmj/Developer/git/claude-toolkit/commands/backlog/backlog.md` (version 2.0.0).

---

## Schema Mapping Table

| Old field (toolkit command) | Old field (frankenstein) | New unified field | Notes |
|---|---|---|---|
| `#` | (none) | `#` | Retain existing numbers; renumber per section if merging two files |
| `Severity` | `severity` | `severity` | Normalize to lowercase: critical/high/medium/low. Convert ALL-CAPS. |
| `File` | `file` | `file` | No change |
| `Item` | `finding` | `item` | Rename `finding` column header to `item`; values unchanged |
| `Phase` | (none) | `phase` | Populate from known phase label if present; empty string otherwise |
| `Added` / `Date added` | (none) | `added_at` | Convert `YYYY-MM-DD` to `YYYY-MM-DDTHH:MM` by appending `T00:00` |
| (none) | `finding_id` | `finding_id` | Retain existing IDs; leave empty string if not assigned |
| (none) | `source` | `source` | Retain agent-role labels; replace commit hash values with `unknown` |
| (none) | (none) | `status` | Set to `open` for all existing rows |
| (none) | (none) | `environment` | Set to `any` for all existing rows |
| (none) | (none) | `deferred_reason` | Empty string for all existing rows |
| (none) | (none) | `session_id` | Empty string for all existing rows |

---

## Manual Migration Steps

1. Back up the file before making any changes: `cp backlog.md backlog.md.bak`
2. Replace the old column header in each section table with the new 12-column header:
   ```
   | # | status | severity | environment | file | item | deferred_reason | source | finding_id | phase | added_at | session_id |
   |---|--------|----------|-------------|------|------|-----------------|--------|------------|-------|----------|------------|
   ```
3. For each data row, insert the new columns in the correct positions:
   - Insert `status=open` after `#`
   - Insert `environment=any` after `severity`
   - Insert `deferred_reason=` (empty string) after `item`
   - Append `phase=`, `added_at=<value>`, `session_id=` (empty string) at the end
4. Normalize severity to lowercase: `CRITICAL` → `critical`, `HIGH` → `high`, `MEDIUM` → `medium`, `LOW` → `low`.
5. Rename the column header `finding` to `item` (column header text only — row values are unchanged).
6. Populate `added_at` from the existing `Added` or `Date added` column if present, converting `YYYY-MM-DD` to `YYYY-MM-DDTHH:MM` by appending `T00:00`. If no date exists, use the current timestamp in `YYYY-MM-DDTHH:MM` format.
7. For `source` values that appear to be git commit hash prefixes (8 or more consecutive hexadecimal characters): replace with `unknown`.
8. Re-assign `#` sequentially per section (1, 2, 3... independently within each section). The two sections (`## Needs Human Decision` and `## Agent Actionable`) each maintain their own numbering starting from 1.

### Migrating from the 6-column toolkit command format

The toolkit command schema (`# | Severity | File | Item | Phase | Added`) has two columns that the generic steps above do not account for. When migrating from this specific format:

- **Phase (col 5)** maps to `phase` (col 10 in the unified schema) — move the value into `phase`; do not duplicate it.
- **Added (col 6)** maps to `added_at` (col 11) — convert the existing date from `YYYY-MM-DD` to ISO-8601 `YYYY-MM-DDTHH:MM` by appending `T00:00`.
- The **6 new columns to INSERT** (in the positions required by the unified schema) are:
  - `status` — default: `open`
  - `environment` — default: `any`
  - `deferred_reason` — empty string
  - `source` — default: `prod-readiness`
  - `finding_id` — empty string
  - `session_id` — empty string

The resulting per-row column order is: `# | status | severity | environment | file | item | deferred_reason | source | finding_id | phase | added_at | session_id`

---

## Ghost Rows (unspecified values)

Rows where severity, file, and item (or finding) are all `unspecified` are artifacts of failed agent runs — the agent wrote the table structure but produced no findings. These rows carry no actionable information.

**Default action**: delete ghost rows before migration. They should not be carried into the unified schema.

**Exception**: if a ghost row has a non-empty `finding_id`, retain a placeholder row rather than deleting it, so that any external references to the `finding_id` remain resolvable:
- Set `status=wont-fix`
- Set `deferred_reason=ghost row from failed agent run`
- Set all other fields to their empty/default values

---

## Per-Repo Migration Status

| File | Current schema | Migration status |
|---|---|---|
| `/Users/bmj/.claude/.orchestrator/backlog.md` | frankenstein v1 (4-col: severity, file, finding, source — no finding_id) | Needs migration |
| `/Users/bmj/Developer/git/ftb-automation/.orchestrator/backlog.md` | frankenstein v1 (5-col: severity, file, finding, finding_id, source) | Needs migration |
| `/Users/bmj/Developer/git/ftb-automation/.orchestrator/backlog.prior-session.md` | frankenstein v1 (5-col, archival) | Needs migration or archive as-is |
| `/Users/bmj/Developer/git/alt-central/.orchestrator/backlog.md` | frankenstein v1 (5-col, commit-hash source, ~7 ghost rows) | Needs migration — remove ghost rows and normalize source (commit hash → `unknown`) first. **NOTE: live session active — do not migrate until session complete.** |
| `/Users/bmj/Developer/git/alt-central/.claude/backlog.md` | toolkit command schema (5-col, closest to canonical spec) | Needs migration — add 7 new columns. **NOTE: live session active — do not migrate until session complete.** |

> **Note on claude-code-prod-pipeline**: `/Users/bmj/Developer/git/claude-code-prod-pipeline/commands/quality/backlog.md` is an outdated duplicate of the toolkit command at `commands/backlog/backlog.md`. It defines the same schema but has not been updated to v2.0.0. This file is out of scope for the current migration and will require a separate update pass to align with the unified schema.

---

## Automated Migration Snippet (advisory)

The following awk snippet converts a 5-column frankenstein backlog (the most common live format) to the 12-column unified schema.

**ADVISORY: test this on a copy before running on live files. The snippet makes assumptions about column structure that may not hold for all variants. Review the output file before replacing the original.**

```bash
# ADVISORY: test this on a copy before running on live files
# Converts a 5-column frankenstein backlog (severity | file | finding | finding_id | source)
# to the 12-column unified schema

cp .orchestrator/backlog.md .orchestrator/backlog.md.bak

TS=$(date '+%Y-%m-%dT%H:%M')
awk -v ts="$TS" '
  /^[[:space:]]*$/ { print; next }
  /^#/ { print; next }
  /^Last updated/ { print; next }
  /^## / { print; next }
  /^\| severity/ {
    print "| # | status | severity | environment | file | item | deferred_reason | source | finding_id | phase | added_at | session_id |"
    next
  }
  /^\|---/ {
    print "|---|--------|----------|-------------|------|------|-----------------|--------|------------|-------|----------|------------|"
    next
  }
  /^\|/ {
    n++
    split($0, f, "|")
    sev = f[2]; gsub(/^ +| +$/, "", sev); sev = tolower(sev)
    if (sev == "") sev = "low"
    fil = f[3]; gsub(/^ +| +$/, "", fil)
    itm = f[4]; gsub(/^ +| +$/, "", itm)
    fid = f[5]; gsub(/^ +| +$/, "", fid)
    src = f[6]; gsub(/^ +| +$/, "", src)
    # replace commit hash source with unknown
    if (src ~ /^[0-9a-f]{8}/) src = "unknown"
    printf "| %d | open | %s | any | %s | %s | | %s | %s | | %s | |\n", \
      n, sev, fil, itm, src, fid, ts
    next
  }
  { print }
' .orchestrator/backlog.md.bak > .orchestrator/backlog.md.new

echo "Review .orchestrator/backlog.md.new before replacing the original."
```

For the 4-column `.claude/.orchestrator/backlog.md` variant (which has no `finding_id` column), adjust the `split` field indices: `fid=""` and `src = f[5]`.

For the toolkit command schema (5-col: `# | Severity | File | Item | Phase | Added`), the column order differs. Use the manual migration steps above rather than this snippet.

---

## Future Work

- **CLAUD-005**: Wire SESSION_ID generation into Frankenstein Phase 0. Currently, `.orchestrator/session.id` is not created at pipeline startup, which means all pipeline-seeded rows carry an empty `session_id`. Phase 0 should run `SESSION_ID=$(date '+%Y%m%dT%H%M%S') && echo "$SESSION_ID" > .orchestrator/session.id` before dispatching agents.
- **CLAUD-006**: Implement v2 per-session directory layout and merge protocol. Each Frankenstein session should write findings to `.orchestrator/sessions/<SESSION_ID>/backlog.md` and merge back into `.orchestrator/backlog.md` at Phase 4 completion, following the four-step merge protocol defined in the session isolation spec.
