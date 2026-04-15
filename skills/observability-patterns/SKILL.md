---
name: observability-patterns
description: Structured logging, health checks, metrics, and runbook patterns for SRE review and remediation. Use when reviewing services for operational readiness or remediating observability gaps.
lifecycle: stable
user-invocable: false
---

# Observability Patterns Reference

Load only the references needed for the current review:

| Scope | Load |
|---|---|
| Structured logging fields, request context, correlation IDs | `references/structured-logging.md` |
| Liveness/readiness/startup endpoints | `references/health-checks.md` |
| Operational handoff and on-call documentation | `references/runbook-template.md` |

Reference selection by scope:
- Logging review: `references/structured-logging.md`
- Health endpoints: `references/health-checks.md`
- Oncall documentation: `references/runbook-template.md`

Use these as checklists against the code under review. For self-contained fixes (missing timeout, missing log field), remediate inline.

## Steps

1. **Identify scope** — determine which references apply (logging, health, runbook) based on the files under review.
2. **Check each item** — run each checklist entry against the code; flag violations with file and line reference.
3. **Remediate inline** — apply self-contained fixes (missing timeout, missing log field, missing health route) directly.
4. **Report** — present findings by category with severity; note which were fixed inline vs. requiring follow-up.

## Output Format

Report findings as: `[SEVERITY] [CATEGORY] — description — file:line`.
End with:
- summary counts by category
- fixes applied inline
- follow-up items left for the user

## Gotchas

- Reference files may not exist in all projects — skip gracefully and note the absence rather than erroring out.
- Self-contained fixes only: do not refactor existing logging frameworks or replace health check libraries inline.
