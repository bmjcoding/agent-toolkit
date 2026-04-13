# Phase Details

## Phase 0: Backlog Check

Read `.claude/backlog.md` if it exists. Check whether any previously-deferred items have been resolved by changes in the current scope (file modified, dep removed, endpoint added). Mark resolved items and report them. Flag any unresolved Critical/High items as carry-forward findings in the final report.

## Phase 1: Build Verification

**Fail-fast gate. If it doesn't build, stop.**

Detect project type and run the appropriate build. Fix build errors up to 2 iterations. If still broken, stop and report.

## Phase 2: Lint and Audit (parallel)

Run lint and audit in parallel — they are independent:

- **Lint**: project linters with auto-fix, then parallel agents for logging standards (structured logging, correlation IDs), complexity, naming/exports, dependency hygiene/CVEs
- **Audit**: all dimensions (correctness, error handling, security, accessibility, type safety, redundancy, over-engineering, simplicity, responsive, mock data, config, API contracts, observability, operational resilience). Report as severity-grouped table.

Wait for BOTH to complete. Fix everything possible in parallel, partitioned by file ownership.

## Phase 3: Test

Green baseline, reconnaissance, write coverage gaps, run and iterate. Flag flaky tests separately.

## Phase 4: Simplify

Review all code changed during this run for reuse, quality, and efficiency. Fix without changing behavior. Preserve test coverage. Cross-reference lint/audit findings for unused dependencies, dead exports, and redundant code.

**Guards**: if simplify would touch >10 files or >200 net lines changed, split remaining simplifications into a follow-up recommendation and report as "deferred to next pass." For each changed file, include a one-line "behavior preserved because..." note so Phase 5 can validate intent.

## Phase 5: Final Validation

Re-run tests, linters, and build. Captures anything broken by audit fixes or simplification.

- Tests: fix and re-run up to 2 iterations
- Linters: confirm no regressions
- Build: confirm compiles, capture size delta vs Phase 1
- **Smoke test** (server projects only): start server, hit health check endpoint, confirm 2xx, shut down

## Phase 6: Git Verification

Deterministic scan first (gitleaks/trufflehog if available), then agent scan for secrets, sensitive files, large files, commit quality, branch state. **Secrets are a NO-SHIP condition, not a warning.**
