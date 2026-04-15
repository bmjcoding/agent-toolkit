---
name: frontend
description: Lightweight frontend workflow — implement with design system enforcement, review, and lint. Use when making frontend-only changes without needing the full orchestrator pipeline.
lifecycle: stable
disable-model-invocation: true
---

# Frontend Workflow

Implement frontend changes with design system enforcement. Lighter than the full orchestration pipeline — no planning, no quality loop, no shipping.
Use this path only when the work stays inside frontend scope. If the request crosses
backend/infra boundaries, needs planning, or includes commit/ship actions, escalate to
the full orchestrator instead.

## Process

1. **Implement**: Spawn `frontend-engineer` with the concrete task, target files, and any UX constraints. It has the `design-authority` skill and will follow the design system.

2. **Review**: When implementation completes, spawn `design-architect` to review the changes. It runs structural lint (Pillar 0) and semantic review (Pillars A-C).

3. **Fix**: If design-architect reports findings:
   - Spawn `frontend-engineer` again with the specific findings and remediation instructions
   - Re-run `design-architect` to verify (max 1 retry)

4. **Report**: Present results to the user. Do NOT commit, push, or create PRs — the user decides what to do next.

## Output Format

Present a brief summary: what was implemented, design-architect findings (pillar + severity), and whether the fix loop ran. No commit or PR actions taken.

## Gotchas

- Design review only covers changed files — pre-existing violations in untouched components are not reported.
- Max 1 retry on the fix loop; unresolved design findings are surfaced to the user, not silently dropped.
- Cross-domain requests are out of scope for this lightweight workflow. If the task also changes backend contracts, infra, release flow, or overall architecture, stop and use the full orchestrator.

## Task

$ARGUMENTS
