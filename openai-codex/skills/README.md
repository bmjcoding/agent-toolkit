# openai-codex/skills/

OpenAI Codex CLI skill copies — ported from the universal `skills/` source at the repo root.

**13 skills** are included, one per subdirectory:

| Skill | Description |
|---|---|
| `backend` | Lightweight backend workflow — implement with convention awareness, security review, and lint. Use when making backend-only changes without needing the full orchestrator pipeline. |
| `changelog` | Canonical CHANGELOG.md standard: Keep a Changelog 1.1.0 + SemVer, required header, version sections, categories, per-component tags, comparison links, bump table. Use when creating or editing any CHANGELOG.md in the toolkit. |
| `design-authority` | Design system guidance for generating and modifying frontend components. Provides token references, canonical patterns, and anti-convergence rules. Use when creating or editing React/Tailwind UI code. |
| `design-lint` | Deterministic design system linting checks. Use when reviewing Tailwind CSS/React components for structural violations. Defines grep/regex patterns run by the design-linter agent. |
| `frontend` | Lightweight frontend workflow — implement with design system enforcement, review, and lint. Use when making frontend-only changes without needing the full orchestrator pipeline. |
| `git-ship` | Git shipping workflow — commit, push, open PRs, enable auto-merge, and clean up worktrees. Use when the user wants to ship code, open a PR, merge, or clean up branches. |
| `improve` | Apply retro recommendations with automated verification. Use after /retro or anytime you want to improve a skill/agent. Supports --validate for autonomous improve-then-review validation cycles. |
| `infra` | Lightweight infrastructure workflow — implement with SRE review for operational readiness. Use when making config, Docker, CI/CD, or infra changes without the full orchestrator pipeline. |
| `observability-patterns` | Structured logging, health checks, metrics, and runbook patterns for SRE review and remediation. Use when reviewing services for operational readiness or remediating observability gaps. |
| `owasp-reference` | OWASP Top 10, STRIDE threat modeling, and common vulnerability patterns for security review. Use when performing security review on backend code, APIs, or auth flows. |
| `prod-readiness` | Full production readiness check — build, lint, audit, test, simplify, final validation, git verify, and ship verdict. Use when preparing code for production or before shipping. |
| `retro` | Run a retrospective on any completed run — single agent, subagent, skill, or orchestration pipeline. Use when the user wants to debrief, analyze efficiency, or improve a workflow. |
| `review-skill` | Review a skill or agent definition for quality and correctness. Use when evaluating a contribution before merging, after writing a new skill, or when a skill underperforms. Supports batch review of directories with parallel dispatch. |

## Structure

Each skill directory contains:

```
<slug>/
  SKILL.md           # Skill definition (name + description frontmatter, instructions body)
  CHANGELOG.md       # Per-skill version history
  evals/
    evals.json       # Eval scenarios
  references/        # Optional: deep-dive reference docs loaded conditionally
  scripts/           # Optional: Python helper scripts
  templates/         # Optional: code templates
```

## How skills are loaded

`config.toml.template` wires all 13 skills via `[[skills.config]]` entries. Each entry's `path` field points to the `SKILL.md` file inside the skill directory:

```toml
[[skills.config]]
path = "${AGENT_TOOLKIT_DIR}/openai-codex/skills/<slug>/SKILL.md"
enabled = true
```

Codex reads the `name` and `description` frontmatter fields from each `SKILL.md` to build its skill index. The body of `SKILL.md` is the instruction set loaded into the model's context when the skill is activated.

## SKILL.md frontmatter

These copies retain only the fields Codex CLI supports:

- `name` — kebab-case identifier (required)
- `description` — trigger description used for skill matching (required)

Claude Code-specific fields (`argument-hint`, `disable-model-invocation`, `metadata`) are stripped. The skill body and all reference/script files are copied byte-for-byte from the universal source in `skills/`.

## Source of truth

The universal source is `skills/` at the repo root. If a skill's content diverges between this directory and `skills/`, the `skills/` version is authoritative. Run `/sync-toolkit` to refresh the install.
