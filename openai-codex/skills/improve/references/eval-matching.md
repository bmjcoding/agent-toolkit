# Eval Test Case Matching Heuristic

Used by improve step 2c (eval smoke test) to pick a single, relevant test case from
`evals/evals.json` when verifying a recommendation — without running the full suite.

## Matching Rules (first match wins)

Apply these rules to the finding's text. The first matching row wins.

| Finding keywords | Pick eval id | Name |
|---|---|---|
| "revert" or "structural" | 2 | `revert-on-structural-failure` |
| "pattern" or "memory" | 3 | `short-circuit-patterns-only` |
| "rewrite" or "threshold" | 4 | `rewrite-threshold` |
| "p0" or "carve-out" | 5 | `p0-carve-out` |
| "validate" / "--validate" AND ("rewrite" or "stops") | 7 | `validate-stops-on-rewrite` |
| "validate" / "--validate" AND ("version" or "bump") | 8 | `validate-no-double-version-bump` |
| "validate" / "--validate" AND ("pattern" or "short-circuit") | 9 | `validate-all-patterns-short-circuit` |
| "validate" / "--validate" AND ("skip" or "heuristic") | 10 | `validate-skip-heuristic` |
| "validate" / "--validate" (no further qualifier) | 6 | `validate-converges` |
| Otherwise (default) | 1 | `apply-fix-recommendation` |

## Budget

- Run the matched eval only. Do NOT run the full suite — this is a smoke test, not a
  regression suite.
- Cap at 2 minutes wall clock.

## Exit Branches

Each eval run terminates with exactly one of these labels. Use the label in the improve
report's Verification column.

| Report label | When to use it |
|---|---|
| `eval: pass` | Matched eval ran and its assertions passed. |
| `eval: fail` | Matched eval ran and its assertions failed → revert the change per step 2d. |
| `eval: not applicable` | The finding modifies the matched rule itself — e.g., changes how the rewrite threshold fires (which is what eval id=4 exercises). The matched eval cannot validate the edit. Accept on structural-pass alone and document with this label. |
| `eval: stale` | `evals/evals.json` references files or patterns that no longer exist. Skip the eval and do NOT fail the change because of a broken test fixture. |
| `eval: skipped` | No `evals/evals.json` in the skill directory, so there is no case to run. Skip the smoke test entirely. |

## Why This Heuristic Exists

Running the full eval suite for every change is slow and expensive. The improve
workflow only needs enough confidence to know that the applied change didn't break
operational behavior — one well-matched smoke test per change is enough. The full
suite belongs to the retro / QA step, not the per-change verification step.

When adding new eval cases to `evals/evals.json`, extend the matching table above so
the heuristic continues to pick the most relevant case for each finding keyword.
