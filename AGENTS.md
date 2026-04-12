# AGENTS.md — Agent Toolkit

This file follows the [agents.md](https://agents.md) open convention (Agentic AI Foundation / Linux Foundation). It is read natively by OpenAI Codex CLI and GitHub Copilot; Claude Code reads it via `@AGENTS.md` import in `CLAUDE.md`.

---

## Project Overview

**agent-toolkit** is a multi-tool AI agent instruction repository containing agents, skills, commands, hooks, and rules for the Frankenstein orchestration pipeline and related workflows. All content is plain Markdown and Bash — no build system, no package manager.

Directory layout:

```
agent-toolkit/
  shared/          # Tool-agnostic content (skills, rules) — single source of truth
  claude-code/     # Claude Code-specific agents, commands, hooks, bundles
  github-copilot/  # GitHub Copilot-specific agents and instructions
  openai-codex/    # OpenAI Codex CLI-specific agents and config
```

---

## Universal Coding Conventions

These rules apply to all AI tools operating in this repository.

### Worktrees and Ports

- Dev server ports must read from the `$PORT_BASE` env var (set by the `cw` alias), never hardcoded.
- Multi-service setups: offset from `$PORT_BASE` (+0, +1, +2, etc.).
- On first run in a project: patch any hardcoded ports to use `$PORT_BASE` before starting servers.

### Command Scope Resolution

For lint, audit, test, git-verify, and prod-readiness commands, determine scope as follows:

- If file or directory paths are provided as arguments, use those.
- If `--dry-run` is present, report findings without making changes. `--dry-run` applies only to the command that received it — sub-skills must be explicitly forwarded `--dry-run` when that command invokes them.
- If no paths given, run:
  ```sh
  git diff --name-only $(git merge-base HEAD $(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's,refs/remotes/origin/,,' || echo main))
  ```
  to identify files changed on this branch. If already on the default branch, use `git diff --name-only HEAD && git ls-files --others --exclude-standard` for uncommitted changes (includes untracked files).

### Autonomous Execution

When running lint, audit, test, git-verify, or prod-readiness commands:

- Execute to completion without asking for confirmation between steps.
- Fix errors inline rather than stopping to report them.
- Only stop on unrecoverable failures after 2 fix attempts.
- Use parallel agents wherever independent work can be parallelized.

### Auto-fix Safety Rules

These rules apply to ALL commands that auto-fix code:

- **Single writer per file**: when parallel agents fix code, no two agents may modify the same file. Partition by file ownership. If a finding spans files, the agent owning the primary file takes it.
- **Protected files**: do not auto-modify lockfiles (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `uv.lock`, `Cargo.lock`, `poetry.lock`, `go.sum`, `bun.lockb`, `Gemfile.lock`), CI/CD configs (`.github/workflows/**`, `Jenkinsfile`, `.circleci/**`, `.gitlab-ci.yml`), migration files (`migrations/**`, `alembic/**`, `db/migrate/**`), infrastructure code (`*.tf`, `*.tfvars`, Terraform, CloudFormation), or auth/security modules. Report findings on these files but require explicit user intent to change them.
- **Baseline test integrity**: when fixing failing tests in baseline checks, analyze whether the code or the test is wrong. Never rewrite test assertions to match broken code. If unclear, flag for the user rather than auto-fixing.

---

## Security Rules

- Never hardcode secrets — use environment variables or a secrets manager. No API keys or passwords in source files.
- Never use `latest` Docker image tags — always pin to a specific version (e.g., `node:20.11-alpine`).
- Run containers non-root — use `USER` directive in Dockerfiles.

### Pre-push Gate

Secrets scanning before `git commit` and `git push` is enforced by a `PreToolUse` hook (`hooks/pre-push-secrets/`). Before pushing, also run lint on changed files. If lint finds unfixable issues, warn the user before pushing.

---

## Code Signing

Global git config enforces `gpgsign=true` — all commits must be GPG-signed. Platform-level enforcement (requiring signed commits on the main branch in repository settings) must be verified manually.

---

## Component Versioning

All components follow **SemVer 2.0.0** with **Keep a Changelog 1.1.0** format.

- Tag format: `<tool>/<slug>-v<major>.<minor>.<patch>` (e.g., `claude-code/frankenstein-v1.11.0`, `shared/changelog-v4.0.0`)
  - Use `claude-code/<slug>-v<ver>` for agents, commands, hooks, and rules under `claude-code/`
  - Use `shared/<slug>-v<ver>` for skills and rules under `shared/`
- Bump rules:
  - **PATCH**: wording fixes, ≤5 line changes, no new sections
  - **MINOR**: new sections or capabilities
  - **MAJOR**: structural rewrites or breaking changes
- Every component has exactly one `CHANGELOG.md` with bracket-style version headers (`## [X.Y.Z] - YYYY-MM-DD`).

---

## Toolkit Path Configuration

The environment variable `TOOLKIT_PATH` overrides the default local path for toolkit scripts and hooks. Set it in your shell profile if your checkout is not at the default location:

```sh
export TOOLKIT_PATH=/path/to/your/agent-toolkit
```

---

## Explanations and Diagrams

- Complex multi-step scenarios: render a Mermaid diagram (tool-specific invocation path varies per AI assistant).
- Simple questions: answer directly without a diagram.
- Docs with diagrams: include a diagram index table at the top.
