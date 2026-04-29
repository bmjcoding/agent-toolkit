---
name: infra
description: Lightweight infrastructure workflow — implement with SRE review for operational readiness. Use when making config, Docker, CI/CD, or infra-led changes directly or inside a larger workflow.
lifecycle: stable
disable-model-invocation: true
dependencies:
  - skill/observability-patterns
---

# Infrastructure Workflow

Implement infrastructure changes with operational readiness enforcement. This skill is
directly user-invocable and does not require a separate orchestrator. Use it as the
default path for infra-led work: direct execution in the current session first, optional
delegation second, no shipping automation.

Small adjacent application edits are allowed when they are tightly coupled to the infra
change and remain reviewable in one pass. If the request expands into distinct product,
backend, or release tracks, say so and recommend pairing this skill with the matching
domain skill or `prod-readiness` rather than refusing the task outright.

## Inputs

Use the current user request as the task input. It may include target paths,
environments, deployment constraints, runtime requirements, or operational risks.

- If target files are provided, scope implementation and review to those files plus
  tightly coupled runtime code.
- If no files are provided, infer the infra surface from the request and existing
  project layout.
- Shipping, release, or broad production-readiness requests are out of scope for this
  skill; route those to `git-ship` or `prod-readiness`.

## Process

1. **Scope and implement**:
   - Read the request, identify the target config, Docker, CI/CD, or runtime files, and note any adjacent code paths that must change with them.
   - Implement the change directly in the current session, following existing deployment and runtime conventions.
   - If your platform supports delegation and the change is large enough to benefit from it, you may optionally hand the implementation to `staff-engineer`, but direct local execution is the default path.

2. **Review**:
   - Run an operational-readiness review yourself using `observability-patterns` plus checks for health endpoints, timeouts, graceful degradation, and deployment readiness.
   - If a `site-reliability-engineer` specialist is available, you may use it as a second-pass reviewer, but the skill must remain usable without that agent.

3. **Fix**: If the review reports critical/high findings that were not fixed inline:
   - Remediate the findings directly, or optionally hand them to `staff-engineer` if delegation is available
   - Re-run the relevant review checks once (max 1 retry)

4. **Report**: Present results to the user. Do NOT commit, push, or create PRs.

## Output Format

Present a brief summary: what was changed, review findings (severity + category), any inline fixes applied, and whether the fix loop ran. No commit or PR actions taken.

## Gotchas

- SRE review only covers changed files — pre-existing operational gaps in untouched infra are not reported.
- Protected files (lockfiles, migration files, auth modules) are flagged but not auto-modified; surface these to the user.
- Cross-domain work is acceptable when infrastructure remains the primary owner and adjacent edits stay small. If the change splits cleanly into separate tracks, call that out and recommend the companion skill instead of blocking the run.
