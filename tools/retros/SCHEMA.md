# Retro Schema v5.0

Canonical schema for toolkit retrospective JSON files. Normalizes Gen1–Gen4 format variants into a single queryable structure.

Schema file: `tools/retros/schemas/retro-v5.0.json`

---

## Field Reference

`Req` = required by v5.0 schema. `Opt` = optional (may be null or absent in normalized output).

| Field | Type | Req | Description | Notes |
|---|---|---|---|---|
| `schema_version` | string | Y | Always `"5.0"` | Const value — set by normalize.py rule 1 |
| `subject` | string | Y | Human-readable description of what the session worked on | Free text |
| `session_id` | string | Y | Session identifier: `YYYYMMDDTHHmmss` | Compact ISO-8601, no hyphens; rule 11 strips hyphens |
| `date` | string | Y | Calendar date `YYYY-MM-DD` | Derived from `session_id` if absent (rule 12) |
| `run_type` | string | Y | Execution model | Enum: `single-agent`, `subagent`, `orchestration`, `meta`, `custom-pipeline` |
| `depth` | string | Y | Retrospective analysis depth | Enum: `lightweight`, `standard`, `full` |
| `findings` | object | Y | Finding counts by severity | Keys: `critical`, `high`, `medium`, `low` (all int ≥ 0) |
| `findings_total` | integer | Y | Sum of all severity counts | Must equal sum of `findings.*` |
| `recommendations` | object | Y | Recommendation counts | Keys: `total`, `p0`, `p1`, `p2`, `fix`, `pattern` (all int or null) |
| `quality_iterations` | integer | Y | Quality-improvement loop count | 0 for single-pass sessions |
| `agents_spawned` | integer | Y | Total agent dispatches including stubs | |
| `files_changed` | integer | Y | Files written or modified | |
| `user_interventions` | integer | Y | Times user had to intervene to unblock | |
| `root_causes` | object | Y | Root cause category counts | Keys: `prompt_gap`, `spec_gap`, `context_overflow`, `tool_failure`, `external` (int or null); `additionalProperties: true` |
| `verdict` | string or null | Opt | Ship-gate verdict | Enum: `CLEAR_TO_SHIP`, `SHIP_WITH_CAUTION`, `BLOCKED`, `SHIPPED_CLEAN`, or null |
| `total_tokens` | integer or null | Opt | Total tokens across all agents | Null when not captured |
| `total_cost_usd` | number or null | Opt | Total metered cost in USD | Understates by ~5–15% (dispatcher tokens excluded) |
| `agents_metered` | integer or null | Opt | Agents with non-null token entries in agents.log | |
| `wall_clock_min` | integer or null | Opt | Wall-clock duration in minutes | Derivable from agents.log timestamp span |
| `plan_revisions` | integer or null | Opt | Plan revisions during session | |
| `model_downgrades_recommended` | integer or null | Opt | Model-downgrade recommendations made | |
| `metrics` | object | Opt | Extended per-pipeline metrics block | Contains most numeric fields mirrored plus `root_cause_counts`; `additionalProperties: true` |
| `frankenstein` | object | Opt | Orchestrator health block (orchestration retros only) | Keys: `line_count`, `net_line_delta`, `net_growth_flag`, `dispatch_count`, `dispatcher_tokens_estimated` (always null — known gap) |
| `agents` | array | Opt | Per-agent performance records | Items: `agent_id`, `tokens_in`, `tokens_out`, `tool_uses`, `duration_ms`, `status` |
| `finding_list` | array | Opt | Detailed individual findings | Items required: `severity` (critical/high/medium/low), `finding`; optional: `file`, `finding_id`, `resolved` |

---

## Schema Evolution

The corpus spans four generations of retro format before v5.0. Key diffs:

| Generation | Date Range | Key Characteristics |
|---|---|---|
| Gen1 | Apr 07–08 | `session` field (not `session_id`); `estimated_cost_usd`; `gate_verdict`; `wall_clock_minutes`; `fix_churn_files`; timestamp with hyphens (`YYYY-MM-DDTHHMMSS`) |
| Gen2 | Apr 09–11 | Mixed: some files renamed fields, some did not; `recommendations` as bare integer count; findings occasionally includes `total` key (Schema B) |
| Gen3 | Apr 11–12 | `review-skill/` introduced `{p0, p1, p2}` findings structure (Schema C); `recommendations` as dict with `p0/p1/p2`; `fix_count`/`pattern_count` keys |
| Gen4 | Apr 13–14 | Flat findings (`findings_critical`, `findings_high`, etc. at root); `total_cost_usd` replaces `estimated_cost_usd`; compact timestamps (`YYYYMMDDTHHMMSS`) |
| **v5.0** | — | Normalized output of all four gens; all renames applied; findings always `{critical, high, medium, low}`; recommendations always a dict; timestamps always compact |

---

## Normalization Rules

Applied by `tools/retros/normalize.py` to produce v5.0 output. Rules run in order:

1. Set `schema_version = "5.0"`.
2. Rename `session` → `session_id` (Gen1 field name).
3. Rename `gate_verdict` → `verdict` (Gen1 field name).
4. Rename `wall_clock_minutes` → `wall_clock_min` (and `duration_min` → `wall_clock_min`).
5. Rename `estimated_cost_usd` → `total_cost_usd` when `total_cost_usd` is absent.
6. Rename `fix_churn_files` → `fix_churn` when `fix_churn` is absent.
7. *(Covered by rule 4.)* Additional duration alias handled in the same pass.
8. Findings normalization — four input shapes:
   - Schema A/B (`{critical, high, medium, low[, total]}`): strip `total` key, keep severity keys.
   - Schema C (`{total, p0, p1, p2}`): remap `p0→critical`, `p1→high`, `p2→medium`, `low=0`.
   - Schema D (flat root scalars `findings_critical` etc.): fold into `findings` object.
   - Absent/null: default to all-zero severity object.
9. Recommendations normalization:
   - int → `{total: N, p0: null, p1: null, p2: null, fix: null, pattern: null}`.
   - null → all-null dict.
   - dict: normalize `fix_count`→`fix`, `pattern_count`→`pattern`; fold root-level `p0/p1/p2` if present.
10. `root_causes`: default to `{}` if absent or null.
11. Timestamp strip-hyphens: `YYYY-MM-DDTHHMMSS` → `YYYYMMDDTHHMMSS`; full ISO-8601 with colons also handled. Derive `session_id` from `timestamp` field if `session_id` absent.
12. Derive `date` from `session_id` if `date` absent or contains a time component.
13. Apply required-field defaults for any remaining missing required fields.
14. Write output as `<input>.normalized.json` alongside original (or to `--output-dir`).
15. Verdict canonicalization: replace spaces with underscores (`CLEAR TO SHIP` → `CLEAR_TO_SHIP`, etc.). Null preserved as-is.

---

## CLI Examples

```bash
# Redact PII from a single retro file
python3 tools/retros/scrub.py ~/.claude/retros/sessions/2026-04/20260414T100456/retro.json \
  $HOME/Developer/git/agent-toolkit/claude-code/retros/sessions/2026-04/20260414T100456/retro.json

# Normalize a Gen1 retro to v5.0
python3 tools/retros/normalize.py \
  $HOME/Developer/git/agent-toolkit/claude-code/retros/sessions/2026-04/20260407T164326/retro.json \
  --output-dir /tmp/normalized/

# Validate a file against the v5.0 schema
python3 tools/retros/validate.py \
  $HOME/Developer/git/agent-toolkit/claude-code/retros/sessions/2026-04/20260414T100456/retro.json

# Rebuild the full local index
bash tools/retros/index.sh ~/.claude/retros ~/.claude/retros/index
```

---

## Rule Ordering

The redaction rules in `scrub.py` must be applied in a specific order to avoid partial substitutions and malformed output. This constraint is codified in the source comments in `scrub.py` but is reproduced here for documentation purposes.

**Required ordering**:

| Must Come Before | Rules | Reason |
|---|---|---|
| R-03 (catch-all path), R-12 (narrative codename) | R-10, R-11 (JSON project-field rules) | R-10 and R-11 match `"project": "/Users/bmj/..."` and `"project": "alt-central..."` as complete JSON field patterns. If R-03 runs first, it consumes the `/Users/bmj/` portion before R-10 can match the full structure, producing malformed JSON. |
| R-03 (catch-all `/Users/bmj/`) | R-01 (`/Users/bmj/Developer/git/`), R-02 (`/Users/bmj/.claude/`) | R-01 and R-02 map specific path prefixes to distinct placeholders. R-03 would subsume them if it ran first. |
| R-12 (narrative `alt-central`) | R-06 (`bmjcoding/alt-central` compound) | R-06 must consume the compound form before R-12 processes the standalone name. |

This ordering was identified and fixed during the 2026-04-14 migration pipeline. Any future rule additions that introduce new specific-before-catch-all dependencies must be documented in this table and in the `scrub.py` source comments.

---

## Known Permanent Gaps

1. **`dispatcher_tokens_estimated` always null**: The Frankenstein orchestrator dispatcher does not write token counts to any hook-visible location. Every retro in the corpus carries `null` for this field. True session costs are understated by an estimated 5–15%.

2. **5 orphan sessions**: Five `<project>` pipeline sessions appear in `agents.log` with no paired retro file. They ran successfully but were never reviewed. These sessions are absent from all index slices and from `all.jsonl`.
