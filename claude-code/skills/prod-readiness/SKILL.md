---
name: prod-readiness
description: >
  Full production readiness check — build, lint, audit, test, simplify, final validation (internal
  phase, not a --validate flag), git verify, and ship verdict. Use when preparing code for
  production or before shipping.
disable-model-invocation: true
argument-hint: "[--dry-run] [--ship [--draft] [--auto-merge]]"
metadata:
  version: 1.1.0
---

# Production Readiness

Execute all phases below. Scope resolution, autonomy, and `--dry-run` rules are defined in CLAUDE.md.

Lock the file list at the start. All phases operate on the same set (plus test files created in Phase 3).

**Hard rule: do not print the Ship Verdict until ALL phases have completed and ALL agent results have returned. No early verdicts.**

Read `references/phases.md` for detailed phase instructions. Summary:

1. **Phase 0 — Backlog check**: resolve previously-deferred items, flag carry-forwards
2. **Phase 1 — Build**: fail-fast gate, fix up to 2 iterations
3. **Phase 2 — Lint + Audit** (parallel): auto-fix, report unfixable
4. **Phase 3 — Test**: green baseline, coverage gaps, iterate
5. **Phase 4 — Simplify**: reuse, quality, efficiency. Guard: >10 files or >200 lines → defer
6. **Phase 5 — Final validation**: re-run tests/linters/build, smoke test
7. **Phase 6 — Git verification**: secrets scan (NO-SHIP condition), sensitive files, large files

## Output format

### Final Report

| Phase | Key Metrics |
|---|---|
| Build | PASS/FAIL, size delta |
| Lint | Issues fixed, standards violations, CVEs |
| Audit | Found by severity, fixed |
| Tests | Coverage %, flaky tests |
| Simplify | Changes made, deferred |
| Validation | Tests/Linter/Build/Smoke PASS/FAIL |
| Git | Secrets, sensitive files, large files, commit quality |

Remaining items: anything unresolved, with reason.

## Ship Verdict

### Blocking (NO-SHIP)
- Build doesn't compile
- Test suite not green (excluding flaky)
- Coverage decreased from baseline
- Secrets found
- Unfixed Critical audit findings

### Warning (SHIP WITH CAUTION)
- Unfixed High audit findings
- >5 deferred High items across all phases
- Critical/high CVEs
- New/changed files with <80% line coverage
- Size metric >10% growth vs base branch

### Verdict format
```
VERDICT: NO-SHIP | SHIP WITH CAUTION | CLEAR TO SHIP
[reasons]
```

## Auto-ship

If `$ARGUMENTS` contains `--ship`:

- **CLEAR TO SHIP**: run `/git-ship` with any flags after `--ship` (e.g., `--ship --draft`)
- **SHIP WITH CAUTION**: print warnings, then ask "Ship with these warnings? (yes/no)". Wait for the user's response. If yes, run `/git-ship`. If no, stop.
- **NO-SHIP**: stop. Print blocking reasons.

If `--ship` not present, print verdict and stop.

## Backlog Update

As the final step, write all deferred and unresolved items to `.claude/backlog.md`:
- **Needs Human Decision**: external context required
- **Agent Actionable**: pure code work

Each entry: severity, file, one-line description, phase that flagged it, date. Merge with existing items.

## Gotchas

- **Phase ordering matters**: don't run tests before lint fixes — lint auto-fix may change code that tests depend on.
- **Simplify after test, not before**: simplification can break tests if done before coverage is established.
- **Bundle size delta requires base branch**: if the base branch build isn't cached, this adds significant time. Skip delta if base build fails and note "no baseline available."
- **Flaky tests contaminate the verdict**: always separate flaky from real failures. A flaky test is not a NO-SHIP condition.
- **Secrets scan is absolute**: even a revoked key in a test fixture is a NO-SHIP. The key may be in git history forever.
- **`--dry-run` scope**: in `--dry-run` mode, auto-fix phases (lint, audit, simplify) report findings only — no writes to source files. Build and final validation still execute normally. `/git-ship` is not run even if `--ship` is present.

$ARGUMENTS
