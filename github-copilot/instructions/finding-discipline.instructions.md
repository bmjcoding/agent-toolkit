---
description: "Finding Discipline"
applyTo: "agents/**/*.md,claude-code/agents/**/*.md,openai-codex/agents/**,github-copilot/agents/**"
---

# Finding Discipline

A `findings[]` entry MUST describe an action item the user or a downstream agent can
execute. Anything else belongs elsewhere in the handoff.

## Routing Rules

| Observation type | Goes in |
|---|---|
| Actionable issue with a clear remediation path | `findings[]` |
| Observation that confirms correct behaviour ("X is sound", "no risk here") | `notes` |
| Item this agent or a peer already resolved during the run | `findings_resolved[]` |
| Architecture / design observation that is not a defect | `notes` (or `architecture_decisions` / `design_decisions` when applicable) |
| OWASP/STRIDE category not applicable to this changeset | `notes` (e.g., `notes: "STRIDE.repudiation: not applicable; no privileged actions in scope"`) |

## The Test

Before adding a row to `findings[]`, ask: **"Can a downstream agent or the user execute
an action to close this?"** If the answer is no, the row does not belong in `findings[]`.

## Anti-Patterns

These produce non-actionable backlog rows with no owner:

- "X is correct as designed"
- "No memory-leak risk identified"
- "Adequate posture in this category"
- "OWASP/<category> not applicable"
- "X is not present" (when the absence is intentional)

If the observation confirms there is no issue, route it to `notes` or
`findings_resolved[]` so the backlog stays focused on work that needs doing.
