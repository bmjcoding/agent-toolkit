---
name: owasp-reference
description: OWASP Top 10, STRIDE threat modeling, and common vulnerability patterns for security review. Use when performing security review on backend code, APIs, or auth flows.
lifecycle: stable
user-invocable: false
---

# OWASP & Security Reference

Load relevant reference files based on what you're reviewing:
- Threat modeling: `references/stride-threats.md`
- Vulnerability scanning: `references/owasp-top10.md`
- Auth review: `references/auth-patterns.md`

Use these as structured checklists — check each item against the code under review. Report findings with the specific OWASP category or STRIDE threat type.

## Steps

1. **Load references** — select the relevant reference files based on the review scope (threat model, vuln scan, auth).
2. **Check each item** — evaluate the code against each checklist entry; note file and line for each violation.
3. **Classify severity** — assign critical/high/medium/low based on exploitability and impact.
4. **Report findings** — present results grouped by OWASP category or STRIDE threat type with remediation guidance.

## Output Format

Report findings as: `[SEVERITY] [CATEGORY] — description — file:line`. Group by category. End with a summary count per severity level.

## Gotchas

- Reference files may not exist in all projects — skip gracefully and note the absence.
- STRIDE threat modeling is architectural; do not flag STRIDE items as code-level vulnerabilities unless there is a concrete code path that enables the threat.

## Behavioral Refusal Inventory

The following security properties in this control plane rely **solely on behavioral refusal** (LLM instruction-following) with no technical enforcement backstop. Any of these can be bypassed if an agent receives a sufficiently crafted prompt injection or malicious instruction. This inventory exists so reviewers and future audits can prioritize adding technical controls.

| Property | Finding ID | Technical Backstop |
|---|---|---|
| Untrusted data boundary enforcement in agents | CLAUD-001 | None — protect-config.sh v2 guards file writes but cannot prevent an agent from acting on injected instructions |
| Remediation scope validation in quality-engineer | CLAUD-003 | None — agent must self-validate that target paths are in plan.json owned_files |
| TeammateIdle firing rate limit | LLM04-C | None — no hook or config throttle on TeammateIdle event frequency |
| Handoff field sanitization in doc-writer | RT-MSA-008 | None — doc-writer must self-sanitize git diff and handoff content before use |
| Handoff field sanitization in release-engineer | CLAUD-001 | None — commit message sanitization relies on agent instruction compliance |
| plan.json trust root validation | CLAUD-001 | Partial — TeammateIdle integrity check (ST-002) validates SHA before eval, but does not cover all consumption paths |
