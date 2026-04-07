# Finalization: Validation, Output, Trends, Save

Read this after completing the analysis sections. Follow these steps in order.

---

## Validation

*Standard/full depth only.* Before finalizing, write the retro draft to `~/.claude/retros/` and run the verification script:

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/verify-claims.py ~/.claude/retros/YYYY-MM-DDTHHMMSS.md [--orch-dir DIR]
```

This checks that cited file paths exist, agent IDs match handoff files, git SHAs resolve, and severity counts match the backlog. Fix any failures before presenting the retro.

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
| Root causes | type: N, type: N, ... |
```

---

## Trends

After producing the summary, check for historical retro data:

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/retro-history.py trends --history ~/.claude/retros --subject SUBJECT
```

Pass the subject identifier from the Scoping step. If history exists (2+ prior retros for this subject), include a **Trends** section after the summary table highlighting:
- Metrics moving in the wrong direction (token consumption increasing, findings not decreasing)
- Recurring root causes across runs
- Any outliers in the current run vs historical averages
- Observations from the script output (it generates actionable callouts automatically)

Also check for improvement records (`*-improve.json` entries in history). If the last retro for this subject had recommendations but no corresponding improve record, flag it:

> Prior retro (DATE) produced N recommendations but /improve was not run. The same issues may recur.

If improve WAS run, note the acceptance rate and check if the accepted fixes actually reduced the root causes they targeted. This is the feedback loop — did the treatment work?

If no history exists, skip the section silently.

---

## Save

**Always complete this before presenting the /improve prompt.** Save both the full retro and the summary metrics to `~/.claude/retros/` for long-term retention and trend analysis.

Files are organized by subject subdirectory: `~/.claude/retros/{subject}/`

1. Create the subject directory: `mkdir -p ~/.claude/retros/{subject}`
2. Write the full retro markdown to `~/.claude/retros/{subject}/YYYY-MM-DDTHHMMSS.md`
3. Write the summary table metrics as JSON to `~/.claude/retros/{subject}/YYYY-MM-DDTHHMMSS.json` — include these fields:
   - `subject`: the retro subject identifier from Scoping
   - `version`: current `metadata.version` from the subject's primary definition file (if versioned)
   - `run_type`: orchestration / custom-pipeline / subagent / single-agent
   - `project`: git remote URL or project directory name
4. Append to global trend history:

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/retro-history.py save ~/.claude/retros/{subject}/YYYY-MM-DDTHHMMSS.json --history ~/.claude/retros
```

Use the current timestamp for the filename. The script appends to `~/.claude/retros/history.jsonl` (global, cross-subject). All writes must complete before moving on.
