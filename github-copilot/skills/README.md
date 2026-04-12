# github-copilot/skills/

Copilot-surface skill wrappers. Each subdirectory mirrors a skill from `shared/skills/`
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
remains `shared/skills/<name>/SKILL.md`.

The frontmatter is adapted for Copilot by:
- Dropping `disable-model-invocation` (no Copilot equivalent)
- Dropping `metadata.version` block (encoded as a comment instead)
- Adding `target: vscode` to document the intended surface

When `shared/skills/<name>/SKILL.md` is updated, sync the body content here and update
the version comment.

## Contents

| Skill | Source | Version |
|-------|--------|---------|
| `changelog/` | `shared/skills/changelog/` | 3.0.0 |
