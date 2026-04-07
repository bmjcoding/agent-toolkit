---
name: infra
description: Lightweight infrastructure workflow — implement with SRE review for operational readiness. Use instead of the orchestrator pipeline for config, Docker, CI/CD, or infra changes.
disable-model-invocation: true
metadata:
  version: 1.0.0
---

# Infrastructure Workflow

Implement infrastructure changes with operational readiness enforcement. Lighter than the full orchestration pipeline.

## Process

1. **Implement**: Spawn `staff-engineer` with the task. It handles shared types, config, Docker, scripts, CI/CD, and cross-cutting work.

2. **Review**: When implementation completes, spawn `site-reliability-engineer` to review. It checks health endpoints, observability, timeouts, graceful degradation, and deployment readiness. It will fix self-contained issues (missing timeouts, structured logging) inline.

3. **Fix**: If site-reliability-engineer reports critical/high findings that it couldn't fix inline:
   - Spawn `staff-engineer` again with the specific findings and remediation instructions
   - Re-run `site-reliability-engineer` to verify (max 1 retry)

4. **Report**: Present results to the user. Do NOT commit, push, or create PRs.

## Task

$ARGUMENTS
