# AGENTS.md — Agent Toolkit

This file follows the [agents.md](https://agents.md) open convention. It is the primary
shared instruction source for this repository. OpenAI Codex, GitHub Copilot, and Claude
Code all consume `AGENTS.md` directly.

---

## Project Overview

**agent-toolkit** is a multi-tool AI agent instruction repository containing shared
skills and rules plus tool-specific agents, commands, hooks, prompts, bundle manifests,
and install assets for the Frankenstein orchestration pipeline and related workflows.

Directory layout:

```text
agent-toolkit/
  docs/
    adr/           # Repo-wide architecture decisions
    todo/          # Working notes and follow-up docs
  agents/          # Canonical shared agent instruction bodies
  skills/          # Canonical shared skills
  rules/           # Canonical shared rules
  workflows/       # Canonical shared workflow definitions
  claude-code/     # Claude-native agents, commands, hooks, bundles, docs, scripts
  github-copilot/  # VS Code Copilot-native agents, prompts, instructions, hooks, scripts
  openai-codex/    # Codex-native agents, hooks, config templates, rule build assets
  AGENTS.md        # Primary shared instructions
```

## Ownership Model

- Root `skills/` is the single source of truth for shared skill content.
- Root `rules/` is the single source of truth for shared rule content.
- Root `agents/` is the single source of truth for shared agent instruction bodies.
- Root `workflows/` is the single source of truth for shared workflow bodies.
- `AGENTS.md` is the canonical shared instruction file.
- Tool directories should contain tool-native runtime assets or adapters only.
- Shared skills are tagged as `skill/<slug>-v<major>.<minor>.<patch>`.
- Shared rules are tagged as `rule/<slug>-v<major>.<minor>.<patch>`.

---

## Universal Coding Conventions

These rules apply to all AI tools operating in this repository.

### Worktrees and Ports

- Dev server ports must read from the `$PORT_BASE` env var, never hardcoded.
- Multi-service setups should offset from `$PORT_BASE` (`+0`, `+1`, `+2`, and so on).
- On first run in a project, patch hardcoded ports to use `$PORT_BASE` before starting servers.

### Scope Resolution

For `lint`, `audit`, `test`, `git-verify`, and the `prod-readiness` workflow:

- If file or directory paths are provided as arguments, use those.
- If `--dry-run` is present, report findings without making changes. It applies only to the
  workflow that received it; sub-skills must be passed `--dry-run` explicitly.
- If no paths are provided, run:
  ```sh
  git diff --name-only $(git merge-base HEAD $(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's,refs/remotes/origin/,,' || echo main))
  ```
  to identify files changed on this branch.
- If already on the default branch, use:
  ```sh
  git diff --name-only HEAD && git ls-files --others --exclude-standard
  ```
  to include uncommitted and untracked files.

### Autonomous Execution

When running `lint`, `audit`, `test`, `git-verify`, or `prod-readiness`:

- Execute to completion without asking for confirmation between steps.
- Fix errors inline rather than stopping to report them.
- Stop only on unrecoverable failures after 2 fix attempts.
- Use parallel agents wherever independent work can be parallelized.

### Auto-fix Safety Rules

These rules apply to all auto-fix workflows:

- **Single writer per file**: no two parallel agents may modify the same file.
- **Protected files**: do not auto-modify lockfiles, CI/CD configs, migration files,
  infrastructure code, or auth/security modules without explicit user intent.
- **Baseline test integrity**: never rewrite tests to match broken code. If unclear, flag it.

---

## Security Rules

- Never hardcode secrets. Use environment variables or a secrets manager.
- Never use `latest` Docker image tags. Pin exact versions.
- Run containers as non-root with a `USER` directive.

### Pre-push Gate

Secrets scanning before `git commit` and `git push` is enforced by the pre-push hook.
Before pushing, also run lint on changed files. If lint finds unfixable issues, warn the
user before pushing.

---

## Code Signing

Global git config enforces `gpgsign=true`, so all commits must be GPG-signed. Platform
branch-protection checks for signed commits still need manual verification.

---

## Toolkit Path Configuration

The environment variable `AGENT_TOOLKIT_DIR` overrides the default local path for toolkit
scripts, hooks, and config templates:

```sh
export AGENT_TOOLKIT_DIR=/path/to/your/agent-toolkit
```

`TOOLKIT_PATH` remains an accepted compatibility alias for older hook assets, but prefer
`AGENT_TOOLKIT_DIR`.

---

## Explanations and Diagrams

- Answer simple questions directly.
- For complex multi-step scenarios, render a Mermaid diagram.
- If a doc contains multiple diagrams, include a diagram index near the top.
