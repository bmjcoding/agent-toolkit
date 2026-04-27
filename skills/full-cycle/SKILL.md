---
name: full-cycle
description: >
  Autonomous improve → validate loop. Applies retro recommendations via the improve
  skill, then validates each modified definition with review-skill, iterating until
  convergence, max iterations, REWRITE verdict, or zero-progress termination.
lifecycle: stable
---

# Full-Cycle

Autonomous improve → validate loop. Loaded by `autoresearch-analyst` when dispatched in
`full-cycle mode`.

## Inputs

- `retro_file` — path to the retro markdown to apply
- `max_iterations` — default 3

## Workflow

1. **Improve**: Run the improve skill from the retro file path. Track which definition
   files (SKILL.md, agent .md) were modified. The improve skill creates the outcome
   JSON. **If all recommendations are patterns** (0 fixes), skip validation — there
   are no modified definitions to review.

2. **Validate**: For each modified definition, run review-skill checks **inline**
   using preloaded review-skill knowledge:
   - linter (`lint-definition.py`)
   - semantic review (description / instruction / architecture / completeness quality)
   - verdict (PASS / NEEDS WORK / REWRITE)

   Do not re-invoke review-skill as a separate workflow — its instructions are already
   loaded.

3. **Iterate**: If any definition gets NEEDS WORK, run improve again using the
   Required Changes as input (same format as retro recommendations).
   - **Skip version bumps** — the initial improve pass owns versioning. Append
     changelog sub-entries under the existing version header.
   - **Update the existing outcome JSON in-place** (add `validation` field). Do not
     create new outcome files per iteration.

4. **Terminate** when:
   - All modified definitions pass review-skill → **converged**
   - Max iterations reached → report what still needs work
   - A definition gets REWRITE verdict → stop and report
   - An iteration accepts 0 changes → stop (no-progress)

## Single Outcome File

One improve run = one outcome file. The initial improve pass creates it; validation
iterations update it with a `validation` field. Do not create additional outcome files
per iteration.

## Handoff

```handoff
{
  "mode": "full-cycle",
  "iterations": N,
  "max_iterations": N,
  "converged": true,
  "stopped_reason": "converged|max_iterations|rewrite_verdict|no_progress",
  "improve_outcomes": [
    {"iteration": 0, "accepted": N, "reverted": N, "files_modified": ["path"]}
  ],
  "review_results": [
    {
      "iteration": 1,
      "file": "path",
      "verdict": "PASS|NEEDS WORK",
      "required_changes": [
        {
          "what": "description",
          "where": "file/path.md",
          "why": "reason",
          "priority": "P0|P1|P2",
          "type": "fix|pattern"
        }
      ]
    }
  ],
  "outcome_file": "<retro-dir>/<type-scoped-retro-dir>/YYYYMMDDTHHMMSS-improve.json"
}
```

## Iteration Budget Discipline

Never exceed `max_iterations`. Each iteration must make forward progress — if an
iteration accepts 0 changes, stop immediately rather than burning remaining budget.
