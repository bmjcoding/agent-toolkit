# Finalization: Validation, Output, Trends, Save

Read this after completing the analysis sections. Follow these steps in order.

Canonical retro root:
- `RETRO_ROOT="${AGENT_RETRO_DIR:-$HOME/agent-retros}"`
- Read canonical data first
- Legacy retro roots from prior tool-specific storage, resolved `STATE_ROOT` retro dirs, and flat subject directories remain readable for historical lookups, but new writes always go to `RETRO_ROOT`

---

## Validation

*Standard/full depth only.* Before finalizing, write the retro draft to a **temp path** and run the verification script:

```bash
VERIFY_SCRIPT=$(find skills/retro/scripts -name "verify-claims.py" 2>/dev/null | head -1)
[ -z "$VERIFY_SCRIPT" ] && VERIFY_SCRIPT=$(find .agents/skills/retro/scripts -name "verify-claims.py" 2>/dev/null | head -1)
[ -z "$VERIFY_SCRIPT" ] && VERIFY_SCRIPT=$(find .claude/skills/retro/scripts -name "verify-claims.py" 2>/dev/null | head -1)
[ -z "$VERIFY_SCRIPT" ] && VERIFY_SCRIPT=$(find .codex/skills/retro/scripts -name "verify-claims.py" 2>/dev/null | head -1)
[ -z "$VERIFY_SCRIPT" ] && VERIFY_SCRIPT=$(find ~/.agents/skills/retro/scripts -name "verify-claims.py" 2>/dev/null | head -1)
[ -z "$VERIFY_SCRIPT" ] && VERIFY_SCRIPT=$(find ~/.claude/skills/retro/scripts -name "verify-claims.py" 2>/dev/null | head -1)
[ -z "$VERIFY_SCRIPT" ] && VERIFY_SCRIPT=$(find ~/.codex/skills/retro/scripts -name "verify-claims.py" 2>/dev/null | head -1)
python3 "${VERIFY_SCRIPT:-verify-claims.py}" /tmp/retro-draft-TIMESTAMP.md [--orch-dir DIR]
```

This checks that cited file paths exist, agent IDs match handoff files, git SHAs resolve, and severity counts match the backlog. Fix any failures before saving to the canonical path. After all checks pass, move the draft to the correct `RETRO_ROOT/<type-scoped-retro-dir>/TIMESTAMP.md` location in the Save step — do not write to the final path before verification succeeds.

### Per-Recommendation State Verification

For each recommendation in section 3.7 (the Recommendations table), before finalizing the retro, run a target-file check to confirm the proposed fix is NOT already present. If the fix appears to be present, mark the recommendation as `skipped-already-applied` in the output rather than listing it as an open recommendation.

Verification procedure per recommendation type:

- **fix** type: read the target file specified in the `Where` column. Run a focused grep for a distinctive token from the proposed fix (e.g., a function name, a field name, a key phrase from the `what` description). If the token is found in the file, the fix is likely already applied — mark as `skipped-already-applied`.
- **pattern** type: check `STATE_ROOT/projects/<project-slug>/memory/` or project AGENTS.md for the pattern text. If a semantically equivalent pattern exists, mark as `skipped-already-applied`.

> **Note:**
> - If the target file named in the recommendation does not exist (deleted or moved since the recommendation was recorded), mark the recommendation as `open` with note: `(target file not found — cannot pre-verify)`. Do NOT auto-skip or auto-close.
> - Behavioral recs (e.g., "cap return messages at N sentences") cannot be verified from file contents alone — they require observing agent behavior. For behavioral recs, include them as open recs and add a note: `(behavioral — cannot pre-verify from file state)`.
> - A grep hit is evidence of likely-applied, not proof. If the grep hit is in a comment or in a different context, use judgment. When uncertain, keep the rec open with a note: `(pre-verify: possible match at <file>:<line> — verify before applying)`.

Then manually cross-check what the script can't verify:

1. Every claim that cites a metric (token count, file count, duration) — verify against the source artifact or script output. Don't estimate when data exists.
2. Every root cause classification — re-read the cited artifact and confirm the classification still holds. A "prompt gap" that's actually a "spec gap" leads to the wrong fix location.

---

## Output Format

Use markdown headers matching the analysis sections. Skip sections that don't apply to the run type. End with a summary table — include only rows with available data:

```
| Metric | Value |
|---|---|
| Run type | single / subagent / orchestration |
| Subject | identifier from Scoping |
| Version | current metadata.version of the primary skill/agent (if versioned) |
| Phases completed | N/N |
| Agents spawned | N |
| Total tokens consumed | N |
| Total wall-clock time | Nm Ns |
| Critical path agent | <name> (Nm Ns) |
| Quality loop iterations | N |
| Findings (critical/high/medium/low) | N/N/N/N |
| Spec/plan revisions | N |
| Plan-to-outcome file delta | +N unplanned, -N missed |
| Files changed | N |
| User interventions | N (N planned, N unplanned) |
| Fix churn (files modified 2+ times) | N |
| Model downgrades recommended | N agents |
| Estimated cost | $N.NN |
| frankenstein line count | N |
| dispatcher tokens estimated | N |
| dispatch count | N |
| avg dispatch prompt tokens | N |
| net line delta | +N / -N / null |
| Root causes | type: N, type: N, ... |
```

---

## Trends

After producing the summary, check for historical retro data:

```bash
HISTORY_SCRIPT=$(find skills/retro/scripts -name "retro-history.py" 2>/dev/null | head -1)
[ -z "$HISTORY_SCRIPT" ] && HISTORY_SCRIPT=$(find .agents/skills/retro/scripts -name "retro-history.py" 2>/dev/null | head -1)
[ -z "$HISTORY_SCRIPT" ] && HISTORY_SCRIPT=$(find .claude/skills/retro/scripts -name "retro-history.py" 2>/dev/null | head -1)
[ -z "$HISTORY_SCRIPT" ] && HISTORY_SCRIPT=$(find .codex/skills/retro/scripts -name "retro-history.py" 2>/dev/null | head -1)
[ -z "$HISTORY_SCRIPT" ] && HISTORY_SCRIPT=$(find ~/.agents/skills/retro/scripts -name "retro-history.py" 2>/dev/null | head -1)
[ -z "$HISTORY_SCRIPT" ] && HISTORY_SCRIPT=$(find ~/.claude/skills/retro/scripts -name "retro-history.py" 2>/dev/null | head -1)
[ -z "$HISTORY_SCRIPT" ] && HISTORY_SCRIPT=$(find ~/.codex/skills/retro/scripts -name "retro-history.py" 2>/dev/null | head -1)
python3 "${HISTORY_SCRIPT:-retro-history.py}" trends --history "${AGENT_RETRO_DIR:-$HOME/agent-retros}" --subject SUBJECT
```

Pass the subject identifier from the Scoping step. If history exists (2+ prior retros for this subject), include a **Trends** section after the summary table highlighting:
- Metrics moving in the wrong direction (token consumption increasing, findings not decreasing)
- Recurring root causes across runs
- Any outliers in the current run vs historical averages
- Observations from the script output (it generates actionable callouts automatically)

Also check for improvement records (`*-improve.json` entries in history). If the last retro for this subject had recommendations but no corresponding improve record, flag it:

> Prior retro (DATE) produced N recommendations but improve was not run. The same issues may recur.

If improve WAS run, note the acceptance rate and check if the accepted fixes actually reduced the root causes they targeted. This is the feedback loop — did the treatment work?

### Metrics trajectory check

After running the `retro-history.py trends` script, also check for frankenstein size trajectory:

```bash
python3 "${HISTORY_SCRIPT:-retro-history.py}" trends --history "${AGENT_RETRO_DIR:-$HOME/agent-retros}" --subject SUBJECT --metric frankenstein_line_count --last 5
```

If fewer than 5 prior retros exist for this subject (i.e., `--last 5` returns fewer than 5 non-null `frankenstein_line_count` values), **skip the P1 escalation** and note `"insufficient history"` in the retro output rather than flagging a finding. The trajectory check requires a full window of 5 to be meaningful; sparse history produces false positives.

If the script returns 5 consecutive non-null `frankenstein_line_count` values that are monotonically increasing (each value >= the prior), flag as a **P1 finding** in the retro:

> frankenstein.md has grown monotonically across the last N retros (X → Y lines). Each improve run is adding lines without removing any. Protocol tax is accumulating.

Bake `net_line_delta > 0` as a **soft budget flag**: include `"net_growth_flag": true` in the saved JSON when `net_line_delta` is positive. The trajectory check escalates this flag to P1 only if it persists across 5 or more consecutive retros.

If no history exists, skip the section silently.

---

## Save

**Always complete this before presenting the improve prompt.** Save both the full retro and the summary metrics to `RETRO_ROOT` for long-term retention and trend analysis.

### Save path by retro type

Choose the save path based on what is being retro'd:

| Retro type | Save path |
|---|---|
| Orchestration (pipeline run) | `~/agent-retros/sessions/YYYY-MM/<session-id>/` |
| Skill review | `~/agent-retros/skill-reviews/<skill>/YYYY-MM/` |
| Agent review | `~/agent-retros/agent-reviews/<agent>/YYYY-MM/` |

Use the `session_id` (compact `YYYYMMDDTHHMMSS`) as `<session-id>`. For skill/agent reviews, use the subject identifier as `<skill>` or `<agent>`. Legacy retro roots from prior tool-specific storage, resolved `STATE_ROOT` retro dirs, and flat subject directories remain readable for existing retros, but new saves must use the type-scoped paths above under `RETRO_ROOT`.

1. Create the target directory: `mkdir -p <path>`
2. Write the full retro markdown to `<path>/YYYYMMDDTHHMMSS.md`
3. Write the summary metrics as a v5.0-schema JSON to `<path>/YYYYMMDDTHHMMSS.json`. The JSON must validate against the v5.0 schema:

   ```bash
   python3 ~/agent-retros/tools/retros/validate.py <retro.json>
   ```

   Fix any validation errors before saving to the canonical path.

   **Required fields** (always present, `schema_version` must be first):

   | Key | Type | Notes |
   |---|---|---|
   | `schema_version` | string const `"5.0"` | Always first field |
   | `subject` | string | Retro subject identifier from Scoping |
   | `session_id` | string | Compact ISO-8601: `YYYYMMDDTHHMMSS` |
   | `date` | string | `YYYY-MM-DD` |
   | `run_type` | string enum | `single-agent` / `subagent` / `orchestration` / `custom-pipeline` / `meta` |
   | `depth` | string enum | `lightweight` / `standard` / `full` |
   | `findings` | object | `{"critical": N, "high": N, "medium": N, "low": N}` — no `total` sub-key |
   | `findings_total` | integer | Sum of all severity counts |
   | `recommendations` | object | `{"total": N, "p0": N, "p1": N, "p2": N, "fix": N, "pattern": N}` |
   | `quality_iterations` | integer | Top-level quality loop iterations (not nested) |
   | `agents_spawned` | integer | Use 1 for single-agent runs |
   | `files_changed` | integer | Total files modified |
   | `user_interventions` | integer | Total (planned + unplanned) |
   | `root_causes` | object | `{"prompt_gap": N, "spec_gap": N, ...}` — underscore-keyed |

   **Verdict enum** (all underscore-canonical, or null):
   `CLEAR_TO_SHIP` / `SHIP_WITH_CAUTION` / `BLOCKED` / `SHIPPED_CLEAN` / `null`

   **Optional metric fields** (include when data is available; `retro-history.py trends` reads these exact key names):

   | Key | Type | Description |
   |---|---|---|
   | `version` | string | Current `metadata.version` of the primary skill/agent (if versioned) |
   | `project` | string | Git remote URL or project directory name |
   | `total_tokens` | integer | Total tokens consumed across all agents |
   | `total_cost_usd` | number | Total metered cost in USD |
   | `wall_clock_min` | integer | Wall-clock duration in minutes |
   | `model_downgrades_recommended` | integer | Number of model downgrade recommendations |
   | `fix_churn` | integer | Files modified 2+ times (fix didn't stick) |
   | `frankenstein_line_count` | integer | Current line count of frankenstein.md — read via `wc -l` |
   | `dispatcher_tokens_estimated` | integer | Estimated total tokens consumed by the dispatcher |
   | `dispatch_count` | integer | Number of agent dispatches made in this pipeline run |
   | `avg_dispatch_prompt_tokens` | integer | Average inline prompt tokens per dispatch |
   | `net_line_delta` | integer | Delta vs. prior retro's frankenstein_line_count. Use null if no prior retro exists. |
   | `net_growth_flag` | boolean | `true` when `net_line_delta` is positive; `false` when zero or negative; `null` when null. |
   | `pre_verified_skipped` | integer | Recommendations marked `skipped-already-applied` by pre-verification step. |

   Use `null` for fields where data is unavailable. Do not omit tracked metric fields — `null` is better than missing, because the trends script can distinguish "not logged" from "zero."

4. Append to global trend history:

```bash
python3 "${HISTORY_SCRIPT:-retro-history.py}" save <path>/YYYYMMDDTHHMMSS.json --history "${AGENT_RETRO_DIR:-$HOME/agent-retros}"
```

Use the current timestamp for the filename. The script appends to `RETRO_ROOT/history.jsonl` (global, cross-subject). All writes must complete before moving on.
