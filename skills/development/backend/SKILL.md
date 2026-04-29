---
name: backend
description: Lightweight backend workflow — implement with convention awareness, security review, and lint. Use when making backend-led changes directly or inside a larger workflow.
lifecycle: stable
disable-model-invocation: true
dependencies:
  - skill/owasp-reference
---

# Backend Workflow

Implement backend changes with security enforcement. This skill is directly
user-invocable and does not require a separate orchestrator. Use it as the default path
for backend-led work: direct execution in the current session first, optional delegation
second, no shipping automation.

Small adjacent frontend or infra edits are allowed when they are tightly coupled to the
backend change and remain reviewable in one pass. If the request expands into distinct
frontend, infra, or release tracks, say so and recommend pairing this skill with the
matching domain skill or `prod-readiness` rather than refusing the task outright.

## Inputs

Use the current user request as the task input. It may include target paths,
acceptance criteria, API contracts, schemas, or security constraints.

- If target files are provided, scope implementation and review to those files plus
  tightly coupled contract changes.
- If no files are provided, infer the backend surface from the request and existing
  project conventions.
- Shipping, release, or broad production-readiness requests are out of scope for this
  skill; route those to `git-ship` or `prod-readiness`.

## Process

1. **Scope and implement**:
   - Read the request, identify the target backend files, and note any adjacent schema, config, or API contract changes that must land with them.
   - Implement the change directly in the current session, following existing backend conventions (error envelope, pagination, validation, service layer).
   - If your platform supports delegation and the change is large enough to benefit from it, you may optionally hand the implementation to `backend-engineer`, but direct local execution is the default path.

2. **Review**:
   - Run a security review yourself using `owasp-reference`, STRIDE thinking, and dependency awareness on the changed files.
   - If a `security-engineer` specialist is available, you may use it as a second-pass reviewer, but the skill must remain usable without that agent.

3. **Fix**: If the review reports critical/high findings:
   - Remediate the findings directly, or optionally hand them to `backend-engineer` if delegation is available
   - Re-run the relevant review checks once (max 1 retry)

4. **Report**: Present results to the user. Do NOT commit, push, or create PRs.

## Output Format

Present a brief summary: what was implemented, any security findings (severity + category), and whether the fix loop ran. No commit or PR actions taken.

## Gotchas

- Security review only covers changed files — pre-existing vulnerabilities in untouched files are not reported.
- Max 1 retry on the fix loop; unresolved critical findings are surfaced to the user, not silently dropped.
- Cross-domain work is acceptable when backend remains the primary owner and adjacent edits stay small. If the change splits cleanly into separate tracks, call that out and recommend the companion skill instead of blocking the run.
