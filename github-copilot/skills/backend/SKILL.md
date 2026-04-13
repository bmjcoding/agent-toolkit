---
name: backend
description: Lightweight backend workflow — implement with convention awareness, security review, and lint. Use when making backend-only changes without needing the full orchestrator pipeline.
---

# Backend Workflow

Implement backend changes with security enforcement. Lighter than the full orchestration pipeline.

## Process

1. **Implement**: Spawn `backend-engineer` with the task. It reads existing codebase conventions (error envelope, pagination, validation, service layer).

2. **Review**: When implementation completes, spawn `security-engineer` to review. It runs STRIDE threat modeling, OWASP checks, and dependency evaluation on the changed files.

3. **Fix**: If security-engineer reports critical/high findings:
   - Spawn `backend-engineer` again with the specific findings and remediation instructions
   - Re-run `security-engineer` to verify (max 1 retry)

4. **Report**: Present results to the user. Do NOT commit, push, or create PRs.

## Output Format

Present a brief summary: what was implemented, any security findings (severity + category), and whether the fix loop ran. No commit or PR actions taken.

## Gotchas

- Security review only covers changed files — pre-existing vulnerabilities in untouched files are not reported.
- Max 1 retry on the fix loop; unresolved critical findings are surfaced to the user, not silently dropped.

## Task

$ARGUMENTS
