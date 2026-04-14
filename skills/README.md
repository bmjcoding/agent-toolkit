# skills/

Universal skill definitions — the single source of truth for all skills loaded by Claude Code agents and slash commands. Skills are tool-agnostic and shared across Claude Code, GitHub Copilot, and OpenAI Codex. Skills are symlinked to `~/.claude/skills/` by `install.sh`.

## Skill Format

Each skill lives in its own subdirectory with a required `SKILL.md` and optional supporting files:

```
skills/
  <slug>/
    SKILL.md          # Skill definition (frontmatter + instructions)
    CHANGELOG.md      # Per-skill version history
    evals/
      evals.json      # Eval test cases
    references/
      *.md            # Reference documents loaded on demand
    scripts/
      *.py            # Helper scripts invoked by the skill
```

Frontmatter fields:

```yaml
---
name: kebab-case-slug
description: One-sentence description. Use when ...
metadata:
  version: X.Y.Z
---
```

## Skills

| Skill | Version | Description |
|-------|---------|-------------|
| `backend` | 1.1.0 | Lightweight backend workflow — implement with convention awareness, security review, and lint. |
| `changelog` | 3.0.0 | Canonical CHANGELOG.md standard: Keep a Changelog 1.1.0 + SemVer, required header, version sections, categories, per-component tags, comparison links, bump table. |
| `design-authority` | 1.1.0 | Design system guidance for generating and modifying frontend components. Provides token references, canonical patterns, and anti-convergence rules. |
| `design-lint` | 1.1.0 | Deterministic design system linting checks. Defines grep/regex patterns run by the design-linter agent for Tailwind CSS/React components. |
| `frontend` | 1.1.0 | Lightweight frontend workflow — implement with design system enforcement, review, and lint. |
| `git-ship` | 1.1.0 | Git shipping workflow — commit, push, open PRs, enable auto-merge, and clean up worktrees. |
| `improve` | 1.2.0 | Apply retro recommendations with automated verification. Supports `--validate` for accept/revert confirmation. |
| `infra` | 1.1.0 | Lightweight infrastructure workflow — implement with SRE review for operational readiness. |
| `observability-patterns` | 1.1.0 | Structured logging, health checks, metrics, and runbook patterns for SRE review and remediation. |
| `owasp-reference` | 1.1.0 | OWASP Top 10, STRIDE threat modeling, and common vulnerability patterns for security review. |
| `prod-readiness` | 1.1.0 | Full production readiness check — build, lint, audit, test, simplify, final validation, git verify, and ship verdict. |
| `retro` | 1.1.0 | Run a retrospective on any completed run — single agent, subagent, skill, or orchestration pipeline. |
| `review-skill` | 1.1.0 | Review a skill or agent definition for quality and correctness. Produces PASS / NEEDS WORK / REWRITE verdict. |

## Tag Format

```
skill/<slug>-v<major>.<minor>.<patch>
```

Example: `skill/retro-v1.1.0`

## Adding a Skill

1. Create `skills/<slug>/SKILL.md` following the schema above.
2. Create `skills/<slug>/CHANGELOG.md` with the initial version entry.
3. Add an entry to the table in this README.
4. Re-run `install.sh` to create the `~/.claude/skills/<slug>` symlink.
