---
name: frontend
description: Lightweight frontend workflow — implement with design system enforcement, review, and lint. Use when making frontend-only changes without needing the full orchestrator pipeline.
disable-model-invocation: true
---

# Frontend Workflow

Implement frontend changes with design system enforcement. Lighter than the full orchestration pipeline — no planning, no quality loop, no shipping.

## Process

1. **Implement**: Spawn `frontend-engineer` with the task. It has the `design-authority` skill and will follow the design system.

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

## Task

$ARGUMENTS
