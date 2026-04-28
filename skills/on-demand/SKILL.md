---
name: on-demand
description: >
  Handles ad-hoc user requests about skills or agents — "Skill X is too verbose, split
  it up", "review the planner agent's description". Resolves targets from the prompt,
  extracts user concerns, runs review-skill, then conditionally drives improve.
lifecycle: stable
---

# On-Demand

Ad-hoc user requests about skills or agents. Loaded by `autoresearch-analyst` when no
mode keyword is present and a target can be resolved from the prompt.

## Workflow

### 1. Resolve Target(s)

- "the `<name>` skill" → `skills/<name>/SKILL.md`
- "the `<name>` agent" → `agents/<name>/AGENT.md`
- Any absolute path or `~/`-prefixed path → use as-is
- Any `*.md` token in the prompt → try as a literal path
- If multiple targets are named, process each sequentially
- If no target can be resolved, emit the error handoff and stop — do NOT guess

```handoff
{
  "mode": "error",
  "reason": "unresolvable_target",
  "dispatch_prompt_received": "<first 100 chars of dispatch prompt>",
  "hint": "provide a mode keyword (retro/improve/review/full-cycle) or name a target"
}
```

### 2. Extract User Concerns Verbatim

Pull from the prompt: specific complaints (e.g., "too verbose", "needs to be split into
references/scripts"), quality standards cited (e.g., "doesn't follow Keep a Changelog"),
and desired outcomes (e.g., "split it up properly"). These become **P1** entries in the
Required Changes table even if the linter doesn't flag them.

### 3. Run Review-Skill

For each target, run the full review-skill workflow inline (linter + semantic review +
verdict + Required Changes). Merge step-2 user concerns into the Required Changes
table with Priority **P1** and Type `fix` (or `pattern` if the concern is approach
rather than a concrete edit). Label merged rows with `(user-raised)` in the Why column.

### 4. Act on the Verdict

| Verdict | User concerns? | Action |
|---|---|---|
| PASS | none | Report "no action needed" with lint output; stop |
| PASS | yes | Run improve with concerns as a standalone Required Changes; re-review; iterate |
| NEEDS WORK | any | Run improve with merged Required Changes; re-review; iterate up to `max_iterations` |
| REWRITE | any | Do NOT auto-patch. Report the outline + concerns; defer to user |

The improve skill's 5+ findings rewrite gate also applies mid-iteration — if improve
refuses to patch, stop and report.

### 5. Outcome File

Write a single outcome JSON to:
`<retro-dir>/agent-reviews/ondemand-<target-id>/YYYY-MM/YYYYMMDDTHHMMSS-ondemand.json`

Summarize concerns, verdicts, improve iterations, and final state. Update in place
across iterations — do not create separate files per iteration.

### 6. Handoff

```handoff
{
  "mode": "on-demand",
  "targets": ["path1"],
  "target_ambiguity": null,
  "user_concerns": ["concern1 verbatim", "concern2 verbatim"],
  "external_references": ["Keep a Changelog https://keepachangelog.com/en/1.1.0/"],
  "initial_verdict": "PASS|NEEDS WORK|REWRITE",
  "iterations": N,
  "max_iterations": N,
  "converged": true,
  "stopped_reason": "converged|max_iterations|rewrite_verdict|no_progress|pass_no_concerns",
  "improve_outcomes": [
    {"iteration": 0, "accepted": N, "reverted": N, "files_modified": ["path"]}
  ],
  "final_verdict": "PASS|NEEDS WORK|REWRITE",
  "outcome_file": "<retro-dir>/agent-reviews/ondemand-<target-id>/YYYY-MM/YYYYMMDDTHHMMSS-ondemand.json"
}
```

## Gotchas

- **Don't fabricate concerns**: if the user says only "review the X skill" with no
  specifics, run review-skill and let the findings speak. Don't invent concerns.
- **User concerns are P1, not gospel**: review-skill findings take precedence on
  correctness; user concerns add requirements not captured by lint rules.
- **External references are context, not fetches**: if the user cites a standard
  (Keep a Changelog, OWASP, Conventional Commits), record it in `external_references`
  and let improve act on it with existing knowledge. WebFetch is disallowed. If the
  cited standard is unfamiliar, note the gap rather than guessing.
- **Ambiguous targets**: prefer the concrete match, record the ambiguity in
  `target_ambiguity`, and proceed.
- **Never auto-rewrite**: REWRITE verdicts and the improve skill's 5+ findings gate
  both stop the run and defer to the user.
- **Inline review**: use preloaded review-skill knowledge. Do NOT spawn child agents
  for review — run inline within this turn budget.
