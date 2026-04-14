---
name: sync-toolkit
description: >
  Detect changed toolkit components, generate user-facing CHANGELOG entries per KaC 1.1.0,
  bump component versions, copy to ~/.claude, commit per-component, and open a PR.
  Use after editing toolkit agents, skills, commands, hooks, or rules.
disable-model-invocation: true
argument-hint: "[--dry-run] [--no-pr] [--component TYPE/NAME]"
metadata:
  version: 1.0.1
---

This command generates CHANGELOG entries following the Keep a Changelog principle: DO NOT use commit logs as changelogs. Every agent spawned by this command MUST produce user-facing summaries, not commit-log dumps.

## Arguments

`$ARGUMENTS` is the literal string the user typed after `/sync-toolkit`.

- **No args** — sync all changed components, generate CHANGELOGs, commit each component separately, open PR
- **`--dry-run`** — report what would change; do not write files, commit, or push
- **`--no-pr`** — commit locally but do not push or open a PR
- **`--component TYPE/NAME`** — scope to one component (e.g., `skills/changelog`, `agents/frankenstein`)

Scope resolution and `--dry-run` rules are defined in CLAUDE.md.

## Phase 0: Detect changes

Resolve toolkit root: use `$TOOLKIT_PATH` env var if set, otherwise `/Users/bmj/Developer/git/agent-toolkit`.

Run: `git -C $TOOLKIT status --porcelain`

Group modified/added files by component directory (the `TYPE/NAME` portion of each path, e.g., `agents/frankenstein`, `skills/design-lint`). A component is a directory under `agents/`, `skills/`, `commands/`, `hooks/`, or `rules/`. Changes to files ONLY within a component's subdirectory count for that component.

If `--component` is given, filter to that component only.

If no changes detected, print "No toolkit changes detected. Nothing to sync." and stop.

## Phase 1: Group and diff

For each changed component, produce a human-readable diff summary: what sections were added, removed, or changed. Identify the SemVer bump level per `skills/changelog/SKILL.md` bump table (PATCH / MINOR / MAJOR).

If `--dry-run`: output a table of components, their changed file count, and the proposed bump level, then stop.

| Component | Files Changed | Proposed Bump |
|-----------|--------------|---------------|

## Phase 2: Generate CHANGELOG entries (parallel agents)

For each changed component, spawn one subagent to:

1. Read the component's existing `CHANGELOG.md`
2. Read the diff for that component's files (do NOT read raw git log — that is a commit-log dump)
3. Write a NEW version section in the `CHANGELOG.md` with the bumped version number and today's date
4. Write verb-prefixed bullet entries under the correct KaC categories (`Added` / `Changed` / `Fixed`) summarizing the USER-FACING meaning of the change — not file names, not line numbers, not git hashes
5. Update the version comment in the component's definition file (`SKILL.md`, agent `.md`, command `.md`, hook `.sh`) to match the new version
6. Update comparison links at the bottom of `CHANGELOG.md`

Do not write "Updated SKILL.md lines 40-55". Do write "Enforced OKLCH-only color notation for all utility classes". Aggregate related changes into a single entry. If an entry you are about to write names a file path, a line number, or a git hash, discard it and replace it with the user-facing outcome of that change. Follow `skills/changelog/SKILL.md` rules.

Run all component agents in parallel.

## Phase 3: Copy to ~/.claude

For each updated component, copy the changed files from the toolkit source to the corresponding `~/.claude/` path using the **Write tool** (not Bash cp/mv — those are blocked by settings.json deny-patterns on `~/.claude/` paths):

- `agents/NAME/NAME.md` → `~/.claude/agents/NAME/NAME.md`
- `skills/NAME/SKILL.md` → `~/.claude/skills/NAME/SKILL.md` (and all reference files)
- `commands/NAME/NAME.md` → `~/.claude/commands/NAME/NAME.md`
- `hooks/NAME/NAME.sh` → `~/.claude/hooks/NAME/NAME.sh` (Write tool; ensure the target file is executable via `chmod +x` after writing)
- `rules/NAME/*` → `~/.claude/rules/NAME/*`

Do NOT overwrite `~/.claude/settings.json` or `~/.claude/CLAUDE.md`. Skip these if they appear in the diff and report them as protected.

## Phase 4: Commit per component

For each updated component, route the commit through `release-engineer` — do not run `git commit` inline. For each component:

1. Stage only that component's files: `git -C $TOOLKIT add TYPE/NAME/`
2. Commit message: `chore(TYPE/NAME): bump to vX.Y.Z — <one-line user-facing summary>`

One commit per component. Do not batch multiple components in one commit.

If `--no-pr`: stop after commits. Report the list of commits made.

## Phase 5: PR

If `--no-pr` is NOT given:

1. Push the current branch
2. Run: `gh pr create --title "chore(toolkit): sync N components" --body "$(cat <<'EOF' ... EOF)"`

PR body must include a table with columns: Component | Old Version | New Version | Summary

## Output

| Component | Files Changed | Version | CHANGELOG Updated | Installed | Status |
|-----------|--------------|---------|-------------------|-----------|--------|

List any skipped files (protected paths) below the table.

## Gotchas

- **Protected paths**: never overwrite `~/.claude/settings.json` or `~/.claude/CLAUDE.md` — these are write-protected by `protect-config.sh` and must be reported as skipped. Files under `~/.claude/hooks/` ARE installable via the Write tool (the protection blocks Bash cp/mv operations, not Write tool writes). Always use the Write tool for all `~/.claude/` installations, not shell copy commands.
- **Changelog bracket format**: all `CHANGELOG.md` entries must use `## [X.Y.Z] - YYYY-MM-DD` bracket format. Bare `## X.Y.Z` headers fail the changelog-check pre-push hook.
- **Dry-run forwarding**: if `--dry-run` is passed, forward it explicitly to all subagents. No files written, no commits, no copies.
- **Version source of truth**: the version comment in the definition file (`# version: X.Y.Z` in frontmatter or YAML) must be updated to match the new CHANGELOG version.
- **Toolkit repo path**: resolve from `$TOOLKIT_PATH` env var if set; otherwise default to `/Users/bmj/Developer/git/agent-toolkit`.
- **Commits route through release-engineer**: do not run `git commit` inline in this command. Phase 4 delegates to `release-engineer` per the frankenstein Ship phase rule.
