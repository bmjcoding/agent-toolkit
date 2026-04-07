---
name: observability-patterns
description: Structured logging, health checks, metrics, and runbook patterns for SRE review and remediation.
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
