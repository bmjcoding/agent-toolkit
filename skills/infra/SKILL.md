---
name: infra
description: Lightweight infrastructure workflow — implement with SRE review for operational readiness. Use when making config, Docker, CI/CD, or infra changes without the full orchestrator pipeline.
disable-model-invocation: true
---

# Infrastructure Workflow

Implement infrastructure changes with operational readiness enforcement. Lighter than the full orchestration pipeline.
Use this path only when the work stays inside infrastructure scope. If the request
crosses frontend/backend boundaries, needs planning, or includes commit/ship actions,
escalate to the full orchestrator instead.

## Process

1. **Implement**: Spawn `staff-engineer` with the concrete task, target files, and any deployment/runtime constraints. It handles shared types, config, Docker, scripts, CI/CD, and cross-cutting work.

2. **Review**: When implementation completes, spawn `site-reliability-engineer` to review. It checks health endpoints, observability, timeouts, graceful degradation, and deployment readiness. It will fix self-contained issues (missing timeouts, structured logging) inline.

3. **Fix**: If site-reliability-engineer reports critical/high findings that it couldn't fix inline:
   - Spawn `staff-engineer` again with the specific findings and remediation instructions
   - Re-run `site-reliability-engineer` to verify (max 1 retry)

4. **Report**: Present results to the user. Do NOT commit, push, or create PRs.

## Output Format

Present a brief summary: what was changed, SRE findings (severity + category), any inline fixes applied, and whether the fix loop ran. No commit or PR actions taken.

## Gotchas

- SRE review only covers changed files — pre-existing operational gaps in untouched infra are not reported.
- Protected files (lockfiles, migration files, auth modules) are flagged but not auto-modified; surface these to the user.
- Cross-domain requests are out of scope for this lightweight workflow. If the task also changes product logic, UI, release flow, or overall architecture, stop and use the full orchestrator.

## Task

$ARGUMENTS
