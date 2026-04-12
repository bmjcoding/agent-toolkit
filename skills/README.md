# skills/

Universal skills — the single source of truth for skill content across all three tools.

| Tool | How skills are loaded |
|---|---|
| Claude Code | `~/.claude/skills` symlink → this directory |
| GitHub Copilot (VS Code) | `.github/skills` symlink → this directory (install-time) |
| OpenAI Codex CLI | `.agents/skills/` symlink → this directory, or `[[skills.config]]` entries in `config.toml` |

**13 skills** (alphabetical):

| Skill | Description |
|---|---|
| `backend` | Backend engineering patterns and conventions |
| `changelog` | Keep a Changelog management and release tooling |
| `design-authority` | Architecture review and design authority protocol |
| `design-lint` | Design consistency and lint rules |
| `frontend` | Frontend engineering patterns and conventions |
| `git-ship` | Git shipping workflow (commit, tag, push) |
| `improve` | Code improvement and refactoring guidance |
| `infra` | Infrastructure and DevOps patterns |
| `observability-patterns` | Logging, tracing, and metrics conventions |
| `owasp-reference` | OWASP Top 10 security reference |
| `prod-readiness` | Production readiness checklist |
| `retro` | Retrospective facilitation protocol |
| `review-skill` | Code review skill and conventions |

## Structure

Each skill lives in its own subdirectory:

```
skills/
  <slug>/
    SKILL.md       # Skill content (read by Claude Code, Copilot, Codex)
    CHANGELOG.md   # Per-skill version history
```

## Tag Format

```
skill/<slug>-v<major>.<minor>.<patch>
```

Example: `skill/changelog-v4.1.0`

## Adding a Skill

1. Create `skills/<slug>/SKILL.md` following the template in `skills/changelog/SKILL.md`.
2. Create `skills/<slug>/CHANGELOG.md` with the initial version entry.
3. If the skill needs Claude Code-specific wiring (a slash command or hook), add those under `claude-code/commands/` or `claude-code/hooks/` separately.
4. If the skill needs a Copilot prompt equivalent, add it under `github-copilot/prompts/`.
5. Add a `[[skills.config]]` entry to `openai-codex/config.toml.template`.
