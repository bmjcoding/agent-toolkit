---
name: backend
description: Lightweight backend workflow — implement with convention awareness, security review, and lint. Use instead of the orchestrator pipeline for backend-only changes.
disable-model-invocation: true
metadata:
  version: 1.0.0
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

## Task

$ARGUMENTS
