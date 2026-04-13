# github-copilot/skills/

Copilot-surface skill wrappers. Each subdirectory mirrors a skill from `claude-code/skills/`
with a Copilot-compatible frontmatter header.

## Target Surface

**VS Code GitHub Copilot extension only.** Files here are NOT auto-discovered by VS Code.
Run `github-copilot/scripts/install.sh` to symlink them into `.github/skills/` where
Copilot can find them.

## Skill Discovery Paths (VS Code)

Copilot reads skills from these paths (highest priority first):

1. `.github/skills/<name>/SKILL.md`
2. `.agents/skills/<name>/SKILL.md`
3. `.claude/skills/<name>/SKILL.md`

## Strategy: Pointer vs Copy

Skills in this directory use a **pointer strategy**: the SKILL.md file includes the full
body content inline (so VS Code can load it without a symlink) but the canonical source
remains `claude-code/skills/<name>/SKILL.md`.

The frontmatter is adapted for Copilot by keeping only open-standard fields:
- `name` — skill identifier
- `description` — triggers and usage guidance

Claude-specific fields (`metadata.version`, `disable-model-invocation`, `user-invocable`,
`argument-hint`) are stripped. Version is tracked in each skill's `CHANGELOG.md`.

When `claude-code/skills/<name>/SKILL.md` is updated, sync the body content here and
bump the version in `CHANGELOG.md`.

## Contents

| Skill | Description |
|-------|-------------|
| `backend/` | Lightweight backend workflow — implement with convention awareness, security review, and lint. |
| `changelog/` | Canonical CHANGELOG.md standard: Keep a Changelog 1.1.0 + SemVer, required header, version sections, comparison links. |
| `design-authority/` | Design system guidance for generating and modifying frontend components. Provides token references, component patterns, and accessibility rules. |
| `design-lint/` | Deterministic design system linting checks. Use when reviewing Tailwind CSS/React components for standards compliance. |
| `frontend/` | Lightweight frontend workflow — implement with design system enforcement, review, and lint. |
| `git-ship/` | Git shipping workflow — commit, push, open PRs, enable auto-merge, and clean up worktrees. |
| `improve/` | Apply retro recommendations with automated verification. Use after /retro or anytime you want to improve a skill or agent definition. |
| `infra/` | Lightweight infrastructure workflow — implement with SRE review for operational readiness. |
| `observability-patterns/` | Structured logging, health checks, metrics, and runbook patterns for SRE review and remediation. |
| `owasp-reference/` | OWASP Top 10, STRIDE threat modeling, and common vulnerability patterns for security review. |
| `prod-readiness/` | Full production readiness check — build, lint, audit, test, simplify, final validation, git verify, and ship verdict. |
| `retro/` | Run a retrospective on any completed run — single agent, subagent, skill, or orchestration pipeline. |
| `review-skill/` | Review a skill or agent definition for quality and correctness. Supports batch review with parallel dispatch. |
