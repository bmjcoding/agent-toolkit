---
name: frontend
description: Lightweight frontend workflow — implement with design system enforcement, review, and lint. Use when making frontend-led changes directly or inside a larger workflow.
lifecycle: stable
disable-model-invocation: true
---

# Frontend Workflow

Implement frontend changes with design system enforcement. This skill is directly
user-invocable and does not require a separate orchestrator. Use it as the default path
for frontend-led work: direct execution in the current session first, optional delegation
second, no shipping automation.

Small adjacent backend or infra edits are allowed when they are tightly coupled to the
frontend change and remain reviewable in one pass. If the request expands into distinct
backend, infra, or release tracks, say so and recommend pairing this skill with the
matching domain skill or `prod-readiness` rather than refusing the task outright.

## Process

1. **Scope and implement**:
   - Read the request, identify the target UI files, and note any adjacent contracts or config files that must change with them.
   - Implement the change directly in the current session, following `design-authority` and existing project conventions.
   - If your platform supports delegation and the change is large enough to benefit from it, you may optionally hand the implementation to `frontend-engineer`, but direct local execution is the default path.

2. **Review**:
   - Run the relevant `design-lint` checks and perform a semantic design review yourself.
   - If a `design-architect` specialist is available, you may use it as a second-pass reviewer, but the skill must remain usable without that agent.

3. **Fix**: If the review reports findings:
   - Remediate the findings directly, or optionally hand them to `frontend-engineer` if delegation is available
   - Re-run the relevant review checks once (max 1 retry)

4. **Report**: Present results to the user. Do NOT commit, push, or create PRs — the user decides what to do next.

## Output Format

Present a brief summary: what was implemented, review findings (pillar + severity when applicable), and whether the fix loop ran. No commit or PR actions taken.

## Gotchas

- Design review only covers changed files — pre-existing violations in untouched components are not reported.
- Max 1 retry on the fix loop; unresolved design findings are surfaced to the user, not silently dropped.
- Cross-domain work is acceptable when frontend remains the primary owner and adjacent edits stay small. If the change splits cleanly into separate tracks, call that out and recommend the companion skill instead of blocking the run.

## Task

$ARGUMENTS
