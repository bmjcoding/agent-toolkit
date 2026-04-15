# claude-code/bundles/

Bundle manifests group related Claude Code components for cataloging and discovery. Each
bundle lives in its own directory and is described by a checked-in `bundle.yaml`.

## Bundle Format

Each bundle lives at `claude-code/bundles/<slug>/bundle.yaml` and uses this shape:

```yaml
# components[].role values: core | optional | deprecated
id: frankenstein-orchestration
name: Frankenstein Orchestration
description: The full multi-agent orchestration suite.
status: stable
tags:
  - orchestration
  - multi-agent
components:
  - type: agent
    id: frankenstein
    role: core
```

`components[].type` resolves to the checked-in artifact for that component:

| type | resolved path |
|----------|---------------|
| `agent`  | `claude-code/agents/<itemId>.md` |
| `skill`  | `skills/<itemId>/SKILL.md` |
| `command`| `claude-code/commands/<itemId>/<itemId>.md` |
| `hook`   | `hooks/<itemId>/<itemId>.sh` |
| `rule`   | `rules/<itemId>/<itemId>.md` |

## Bundles

| Bundle ID | Name | Status | Description |
|-----------|------|--------|-------------|
| `frankenstein-orchestration` | Frankenstein Orchestration | stable | Full multi-agent delivery pipeline — all orchestrator agents, skills, commands, and hooks. |
| `backend-development` | Backend Development | stable | Backend workflow covering service and API implementation patterns. |
| `frontend-development` | Frontend Development | stable | Frontend workflow covering implementation, design system compliance, and UI quality checks. |
| `code-quality` | Code Quality | stable | Linting, auditing, testing, and definition quality review pipeline. |
| `git-workflow` | Git Workflow | stable | Branching safety, secrets scanning, changelog, and release mechanics. |
| `security-hardening` | Security Hardening | stable | OWASP review, secrets scanning, and config protection. |
| `self-improvement` | Self-Improvement | stable | Autonomous retro, improve, and validate loop for evolving toolkit definitions. |
| `infrastructure` | Infrastructure | stable | Infra, observability, and SRE patterns centered on the site-reliability-engineer surface. |

## Using Bundles

Bundles are consumed by the generated `index.json` distribution catalog and other
metadata-driven tooling. The current `claude-code/scripts/install.sh` script installs the
runtime Claude surfaces directly and does not accept a `--bundle` flag.

## Adding a Bundle

1. Create `claude-code/bundles/<slug>/bundle.yaml` and `CHANGELOG.md`.
2. Use `status: placeholder` only while referenced components are still being authored.
3. Add an entry to the table in this README.
4. Re-run `node scripts/generate-index.js` so the catalog reflects the new bundle.
