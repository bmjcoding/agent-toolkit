# skills/

Shared skill definitions. Root `skills/` is the single source of truth for universal skill content used across the toolkit.

## Contribution Entry Point

Before opening a pull request that touches skills, run the repo-local Claude contribution
assistant at `.claude/agents/contribution-assistant.md`. It runs `definition-review` on
changed definitions, updates versioned changelogs, regenerates generated assets, and runs
the local gate.

## Layout

Skills are categorized on disk, while the frontmatter `name` remains the stable skill id:

```text
skills/
  <category>/
    ...
      <slug>/
        SKILL.md
        CHANGELOG.md
        references/
        scripts/
        evals/
```

Category directories are open-ended and discovered recursively. Adding, renaming, or splitting categories should not require generator changes as long as each skill directory contains `SKILL.md` and `CHANGELOG.md`.

Flat `skills/<slug>/` paths are treated as a legacy migration fallback only.

## Skills

| Category | Skill | Version | Lifecycle | Description |
|---|---|---|---|---|
| delivery | `changelog` | 7.1.0 | stable | Canonical CHANGELOG.md standard: Keep a Changelog 1.1.0 + SemVer, required header, version sections, categories, version footers, bump table. Use when creating or editing any CHANGELOG.md in the toolkit. |
| delivery | `git-ship` | 4.2.0 | stable | Git shipping workflow — commit, push, open PRs, enable auto-merge, and clean up worktrees. Use when the user wants to ship code, open a PR, merge, or clean up branches. |
| delivery | `prod-readiness` | 4.3.0 | stable | Full production readiness check — build, lint, audit, test, simplify, final validation (internal phase, not a --validate flag), git verify, and ship verdict. Use when preparing code for production or before shipping. |
| design | `design-authority` | 4.2.0 | stable | Design system guidance for generating and modifying frontend components. Provides token references, canonical patterns, and anti-convergence rules. Use when creating or editing React/Tailwind UI code. |
| design | `design-lint` | 4.4.0 | stable | Deterministic design system linting checks. Use when reviewing Tailwind CSS/React components for structural violations. Defines grep/regex patterns run by the design-linter agent. |
| development | `backend` | 4.4.0 | stable | Lightweight backend workflow — implement with convention awareness, security review, and lint. Use when making backend-led changes directly or inside a larger workflow. |
| development | `frontend` | 4.4.0 | stable | Lightweight frontend workflow — implement with design system enforcement, review, and lint. Use when making frontend-led changes directly or inside a larger workflow. |
| development | `infra` | 4.4.0 | stable | Lightweight infrastructure workflow — implement with SRE review for operational readiness. Use when making config, Docker, CI/CD, or infra-led changes directly or inside a larger workflow. |
| reference | `observability-patterns` | 4.1.2 | stable | Structured logging, health checks, metrics, and runbook patterns for SRE review and remediation. Use when reviewing services for operational readiness or remediating observability gaps. |
| reference | `owasp-reference` | 4.1.1 | stable | OWASP Top 10, STRIDE threat modeling, and common vulnerability patterns for security review. Use when performing security review on backend code, APIs, or auth flows. |
| self-improvement | `definition-review` | 6.3.0 | stable | Review a skill or agent definition for quality and correctness. Use when evaluating a contribution before merging, after writing a new skill, or when a skill underperforms. Supports batch review of directories with parallel dispatch. |
| self-improvement | `full-cycle` | 1.2.0 | stable | Use when `autoresearch-analyst` runs full-cycle mode. Applies retro recommendations, validates modified definitions with definition-review, and stops on convergence, max iterations, REWRITE verdict, or zero progress. |
| self-improvement | `improve` | 4.8.0 | stable | Apply retro recommendations with automated verification. Use after `retro` or anytime you want to improve a skill/agent. Supports --validate for autonomous improve-then-review validation cycles. |
| self-improvement | `on-demand` | 1.2.0 | stable | Use when `autoresearch-analyst` receives an ad-hoc skill or agent review request. Resolves targets, extracts user concerns, runs definition-review, and conditionally drives improve. |
| self-improvement | `recon` | 1.2.0 | stable | Use when `autoresearch-analyst` runs recon mode before planning, especially for multi-repo toolkit pipelines. Reports branch, hook, working-tree, changelog, and planner-critical operational facts. |
| self-improvement | `retro` | 5.6.0 | stable | Run a retrospective on any completed run — single agent, subagent, skill, or orchestration pipeline. Use when the user wants to debrief, analyze efficiency, or improve a workflow. |

## Category Taxonomy

- Categories are navigation, not identity. The stable skill id is the `name` frontmatter field.
- Reuse an existing category when the new skill fits a contributor-facing domain already present.
- Create a new category when the skill would otherwise make an existing category ambiguous, or when two or more related skills need a clearer home.
- Nested categories are allowed for scale, for example `skills/platform/security/<slug>/`.
- Use kebab-case category names. Do not encode lifecycle, target tool, owner, or release status in the category path.

## Versioning

Skill versions live in each skill's `CHANGELOG.md` section headers. The stable skill id
is the `name` frontmatter field, not the category path, and this repository does not
require release tags for skill versions.

## Adding A Skill

1. Create `skills/<category>/.../<slug>/SKILL.md` with matching `name: <slug>` frontmatter.
2. Create `skills/<category>/.../<slug>/CHANGELOG.md` with the initial version entry.
3. Run `npm run ci` to refresh adapters, catalog inputs, generated inventories,
   and validation before opening a pull request.
