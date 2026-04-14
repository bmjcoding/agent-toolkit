# Finalization: Validation, Output, Trends, Save

Read this after completing the analysis sections. Follow these steps in order.

---

## Validation

*Standard/full depth only.* Before finalizing, write the retro draft to a **temp path** and run the verification script:

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/verify-claims.py /tmp/retro-draft-TIMESTAMP.md [--orch-dir DIR]
# fallback: python3 ~/.claude/skills/retro/scripts/verify-claims.py /tmp/retro-draft-TIMESTAMP.md [--orch-dir DIR]
```

This checks that cited file paths exist, agent IDs match handoff files, git SHAs resolve, and severity counts match the backlog. Fix any failures before saving to the canonical path. After all checks pass, move the draft to `~/.claude/retros/{subject}/TIMESTAMP.md` in the Save step — do not write to the final path before verification succeeds.

### Per-Recommendation State Verification

For each recommendation in section 3.7 (the Recommendations table), before finalizing the retro, run a target-file check to confirm the proposed fix is NOT already present. If the fix appears to be present, mark the recommendation as `skipped-already-applied` in the output rather than listing it as an open recommendation.

Verification procedure per recommendation type:

- **fix** type: read the target file specified in the `Where` column. Run a focused grep for a distinctive token from the proposed fix (e.g., a function name, a field name, a key phrase from the `what` description). If the token is found in the file, the fix is likely already applied — mark as `skipped-already-applied`.
- **pattern** type: check `~/.claude/skills/memory/` or project CLAUDE.md for the pattern text. If a semantically equivalent pattern exists, mark as `skipped-already-applied`.

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
python3 ${CLAUDE_SKILL_DIR}/scripts/retro-history.py trends --history ~/.claude/retros --subject SUBJECT
# fallback: python3 ~/.claude/skills/retro/scripts/retro-history.py trends --history ~/.claude/retros --subject SUBJECT
```

Pass the subject identifier from the Scoping step. If history exists (2+ prior retros for this subject), include a **Trends** section after the summary table highlighting:
- Metrics moving in the wrong direction (token consumption increasing, findings not decreasing)
- Recurring root causes across runs
- Any outliers in the current run vs historical averages
- Observations from the script output (it generates actionable callouts automatically)

Also check for improvement records (`*-improve.json` entries in history). If the last retro for this subject had recommendations but no corresponding improve record, flag it:

> Prior retro (DATE) produced N recommendations but /improve was not run. The same issues may recur.

If improve WAS run, note the acceptance rate and check if the accepted fixes actually reduced the root causes they targeted. This is the feedback loop — did the treatment work?

### Metrics trajectory check

After running the `retro-history.py trends` script, also check for frankenstein size trajectory:

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/retro-history.py trends --history ~/.claude/retros --subject SUBJECT --metric frankenstein_line_count --last 5
```

If fewer than 5 prior retros exist for this subject (i.e., `--last 5` returns fewer than 5 non-null `frankenstein_line_count` values), **skip the P1 escalation** and note `"insufficient history"` in the retro output rather than flagging a finding. The trajectory check requires a full window of 5 to be meaningful; sparse history produces false positives.

If the script returns 5 consecutive non-null `frankenstein_line_count` values that are monotonically increasing (each value >= the prior), flag as a **P1 finding** in the retro:

> frankenstein.md has grown monotonically across the last N retros (X → Y lines). Each /improve run is adding lines without removing any. Protocol tax is accumulating.

Bake `net_line_delta > 0` as a **soft budget flag**: include `"net_growth_flag": true` in the saved JSON when `net_line_delta` is positive. The trajectory check escalates this flag to P1 only if it persists across 5 or more consecutive retros.

If no history exists, skip the section silently.

---

## Save

**Always complete this before presenting the /improve prompt.** Save both the full retro and the summary metrics to `~/.claude/retros/` for long-term retention and trend analysis.

Files are organized by subject subdirectory: `~/.claude/retros/{subject}/`

1. Create the subject directory: `mkdir -p ~/.claude/retros/{subject}`
2. Write the full retro markdown to `~/.claude/retros/{subject}/YYYY-MM-DDTHHMMSS.md`
3. Write the summary table metrics as JSON to `~/.claude/retros/{subject}/YYYY-MM-DDTHHMMSS.json` — include these required fields plus all applicable metric fields below:

   **Required fields** (always present):
   - `subject`: the retro subject identifier from Scoping
   - `version`: current `metadata.version` from the subject's primary definition file (if versioned)
   - `run_type`: orchestration / custom-pipeline / subagent / single-agent
   - `project`: git remote URL or project directory name

   **Metric fields** (include when data is available; `retro-history.py trends` reads these exact key names):

   | Key | Type | Description |
   |---|---|---|
   | `total_tokens` | integer | Total tokens consumed across all agents |
   | `quality_iterations` | integer | Number of quality loop iterations (top-level, not nested) |
   | `findings` | object | `{"critical": N, "high": N, "medium": N, "low": N}` |
   | `model_downgrades_recommended` | integer | Number of model downgrade recommendations |
   | `root_causes` | object | `{"prompt gap": N, "spec gap": N, ...}` — one key per root cause type found |
   | `files_changed` | integer | Total files modified |
   | `agents_spawned` | integer | Number of agents spawned (use 1 for single-agent runs) |
   | `user_interventions` | integer | Total user interventions (planned + unplanned) |
   | `estimated_cost_usd` | number | Estimated pipeline cost in USD |
   | `frankenstein_line_count` | integer | Current line count of frankenstein.md at retro time — read via `wc -l` |
   | `dispatcher_tokens_estimated` | integer | Estimated total tokens consumed by the dispatcher (from agents.log or manual estimate) |
   | `dispatch_count` | integer | Number of agent dispatches made in this pipeline run |
   | `avg_dispatch_prompt_tokens` | integer | Average inline prompt tokens per dispatch (dispatcher_tokens_estimated / dispatch_count) |
   | `net_line_delta` | integer | Delta vs. the prior retro's frankenstein_line_count (negative = improvement). Use null if no prior retro exists for this subject. |
   | `net_growth_flag` | boolean | `true` when `net_line_delta` is positive (frankenstein.md grew this run); `false` when zero or negative; `null` when `net_line_delta` is null. |
   | `pre_verified_skipped` | integer | Count of recommendations marked `skipped-already-applied` by the per-recommendation state-verification step. Distinguishes verification-time skips from improve-time skips. |

   Use `null` for fields where data is unavailable. Do not omit tracked metric fields — `null` is better than missing, because the trends script can distinguish "not logged" from "zero."

4. Append to global trend history:

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/retro-history.py save ~/.claude/retros/{subject}/YYYY-MM-DDTHHMMSS.json --history ~/.claude/retros
# fallback: python3 ~/.claude/skills/retro/scripts/retro-history.py save ~/.claude/retros/{subject}/YYYY-MM-DDTHHMMSS.json --history ~/.claude/retros
```

Use the current timestamp for the filename. The script appends to `~/.claude/retros/history.jsonl` (global, cross-subject). All writes must complete before moving on.
