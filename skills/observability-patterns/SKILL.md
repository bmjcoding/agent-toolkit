---
name: observability-patterns
description: Structured logging, health checks, metrics, and runbook patterns for SRE review and remediation. Use when reviewing services for operational readiness or remediating observability gaps.
user-invocable: false
metadata:
  version: 1.0.0
---

# Observability Patterns Reference

Load relevant reference files based on what you're reviewing:
- Logging review: `references/structured-logging.md`
- Health endpoints: `references/health-checks.md`
- Oncall documentation: `references/runbook-template.md`

Use these as checklists against the code under review. For self-contained fixes (missing timeout, missing log field), remediate inline.

## Steps

1. **Identify scope** — determine which references apply (logging, health, runbook) based on the files under review.
2. **Check each item** — run each checklist entry against the code; flag violations with file and line reference.
3. **Remediate inline** — apply self-contained fixes (missing timeout, missing log field, missing health route) directly.
4. **Report** — present findings by category with severity; note which were fixed inline vs. requiring follow-up.

## Gotchas

- Reference files may not exist in all projects — skip gracefully and note the absence rather than erroring out.
- Self-contained fixes only: do not refactor existing logging frameworks or replace health check libraries inline.
