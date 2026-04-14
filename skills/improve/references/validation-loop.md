# Validation Loop — Full Reference

> Loaded by improve/SKILL.md Step 8 when `--validate` is present.

## Purpose and Scope

`--validate` is intended for **post-review-skill remediation**: when a prior review returned NEEDS WORK, use `--validate` to apply fixes and confirm the definition now passes. It is not meant as a routine add-on to every retro-improve cycle.

If `$ARGUMENTS` contains `--validate`, run a validation loop **after** the main improve workflow (steps 1–7) completes.

---

## Skip-Validation Heuristic

Before starting the loop, check if validation can be skipped. Skip the loop (and inform the user) when **ALL** of the following are true:

- `lines_removed == 0` for all edits in this run (additive-only changes)
- All edits target only the **Gotchas** or **references** sections of the file
- No edit touches workflow steps, output templates, or the handoff schema

When skipping, emit:

> "Skipping --validate loop: all changes are additive-only edits to Gotchas/references sections. No workflow behavior was modified."

---

## Pre-Loop Setup

**Before starting**: Ask the user: "Max validation iterations? (default: 3)" Wait for their response. Accept a number or empty/enter for the default.

Orchestrators and full-cycle agents should pass `--max-iterations N` in `$ARGUMENTS` rather than relying on this interactive prompt, to avoid blocking mid-execution.

---

## Loop Steps (up to max iterations)

1. Collect all definition files (SKILL.md, agent .md) that were modified in the current improve run (or the previous validation iteration).

2. For each modified definition, run the review-skill checks inline:
   - **Structural**: run `lint-definition.py` on the file (same linter resolution as step 2c). Any S-code error = NEEDS WORK.
   - **Semantic**: read the full file and evaluate: description quality (would it trigger correctly?), instruction quality (actionable procedures, not declarations?), architecture (under 500 lines? references loaded conditionally?), completeness (gotchas? output template? $ARGUMENTS handled?). For agent definitions also check: tools scoping, maxTurns, disallowedTools, handoff format.
   - **Verdict**: PASS (0 structural errors, 0 quality gaps), NEEDS WORK (fixable issues), or REWRITE (5+ warnings or fundamentally below bar).

   Running these checks inline avoids the context-switch risk of loading a second skill mid-workflow. The checks above mirror review-skill's workflow — if review-skill's criteria change, update these to match.

3. Evaluate review-skill verdicts per file:
   - **PASS** → no further action needed for this file
   - **NEEDS WORK** → collect the Required Changes table entries
   - **REWRITE** → exit loop immediately, report that the definition needs a full rewrite

4. If all files passed → exit loop, report success.

5. If any files need work → run steps 1–5 of the main improve workflow with the collected Required Changes as input (same format as retro recommendations). **Skip version bump and changelog** — the version was already bumped in the initial improve pass. Validation iterations are corrections to the same logical change, not new changes.

6. If the iteration accepted 0 changes (all reverted or blocked) → exit loop, report no progress.

7. Repeat from step 1.

---

## Version and Changelog Rules

Only the initial improve pass (steps 1–7) bumps versions and writes changelog entries. Validation iterations do **NOT** bump versions again. However, if a validation iteration accepts changes, append a sub-entry to the existing changelog entry (do not create a new version header):

```
### 1.2.1 — 2026-04-07
- Added gotchas section for error handling (retro finding #2)
  - validation: fixed Q04 warning in gotchas wording (iteration 1)
```

This keeps the version history complete without inflating version numbers.

**Edge case — all changes reverted in initial pass**: If the initial improve pass produced no accepted changes for a given file (all reverted), the version was never bumped and no changelog entry was created. If a validation iteration later accepts changes for that file, treat it as the initial change: bump the version and create a new changelog entry (do not append a sub-entry, since no parent entry exists).

---

## Outcome JSON Update

After the loop exits, update the outcome JSON (from step 7) **in-place** — do not create a separate file. Add a `validation` field:

```json
{
  "validation": {
    "iterations": 2,
    "max_iterations": 3,
    "converged": true,
    "stopped_reason": "converged|max_iterations|rewrite_verdict|no_progress",
    "per_iteration": [
      {"iteration": 1, "reviewed": 3, "passed": 1, "needs_work": 2, "changes_applied": 2},
      {"iteration": 2, "reviewed": 2, "passed": 2, "needs_work": 0, "changes_applied": 0}
    ]
  }
}
```

**Single outcome file**: One improve run = one outcome file, regardless of validation iterations.

---

## Report Format

After the validation loop, extend the step 4 summary table with a validation section:

```
## Validation Loop (--validate)

| Iteration | Reviewed | Passed | Needs Work | Changes Applied | Stopped |
|---|---|---|---|---|---|
| 1 | 3 | 1 | 2 | 2 | — |
| 2 | 2 | 2 | 0 | 0 | converged |

All modified definitions pass review-skill quality bar.
```
