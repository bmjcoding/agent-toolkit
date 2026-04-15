---
name: sync-toolkit
description: "Detect changed toolkit components, regenerate adapters, update CHANGELOG entries and versions, then commit per-component and open a PR."
argument-hint: "[--dry-run] [--no-pr] [--component TYPE/NAME]"
adapters:
  - claude-code/commands/sync-toolkit/sync-toolkit.md
  - github-copilot/prompts/sync-toolkit.prompt.md
---

<!-- Canonical shared workflow body. Tool-native wrappers live in the listed adapter files. -->

This workflow synchronizes canonical repo content with tool-specific adapters and release
metadata. It generates CHANGELOG entries following the Keep a Changelog principle: DO NOT
use commit logs as changelogs. Commit logs are noisy — merge commits, obscure titles,
file-change lists. A CHANGELOG entry is a USER-FACING summary of a noteworthy difference,
often aggregating multiple commits.

## Arguments

$ARGUMENTS is the literal string the user typed after invoking this prompt.

- **No args** — sync all changed components, generate CHANGELOGs, commit each component separately, open PR
- **`--dry-run`** — report what would change; do not write files, commit, or push
- **`--no-pr`** — commit locally but do not push or open a PR
- **`--component TYPE/NAME`** — scope to one component (e.g., `skills/changelog`, `agents/frankenstein`, `workflows/lint`)

Scope resolution and `--dry-run` rules are defined in AGENTS.md.

## Phase 0: Detect changes

Resolve toolkit root: use `$TOOLKIT_PATH` env var if set, otherwise `/Users/bmj/Developer/git/agent-toolkit`.

Run: `git -C $TOOLKIT status --porcelain`

Group modified/added files by component directory (the `TYPE/NAME` portion of each path, e.g., `agents/frankenstein`, `workflows/lint`, `skills/design-lint`). Canonical shared components live under `agents/`, `workflows/`, `skills/`, and `rules/`. Tool-local adapters and runtime assets live under the tool directories and should be grouped under their own tool-specific component path.

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

**AGENT INSTRUCTION (mandatory for every spawned subagent)**: Generate user-facing summaries, not commit-log dumps. Do not write "Updated SKILL.md lines 40-55". Do write "Enforced OKLCH-only color notation for all utility classes". Aggregate related changes into a single entry. If an entry you are about to write names a file path, a line number, or a git hash, discard it and replace it with the user-facing outcome of that change. Follow `skills/changelog/SKILL.md` rules.

Run all component agents in parallel.

## Phase 3: Regenerate Adapters

If any canonical root agent or workflow changed, run:

```bash
node scripts/sync-canonical-adapters.js
```

Then verify the regenerated adapters match the canonical source changes and include them in the scoped component diff summary.

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

| Component | Files Changed | Version | CHANGELOG Updated | Adapters Synced | Status |
|-----------|--------------|---------|-------------------|-----------|--------|

List any skipped files or blocked adapter follow-ups below the table.

## Gotchas

- **No commit-log dumps**: agents must write user-facing summaries. If an agent proposes a bullet that names a file path or a git hash, reject it and ask for the user-facing outcome instead.
- **Canonical-before-adapter**: edit `agents/` and `workflows/` first, then regenerate tool-native wrappers. Do not hand-edit generated Copilot/Codex/Claude wrappers unless the change is genuinely runtime-specific.
- **Changelog bracket format**: all `CHANGELOG.md` entries must use `## [X.Y.Z] - YYYY-MM-DD` bracket format. Bare `## X.Y.Z` headers fail the changelog-check pre-push hook.
- **Dry-run forwarding**: if `--dry-run` is passed, forward it explicitly to all subagents. No files written, no commits, no copies.
- **Version source of truth**: the version comment in the definition file (`# version: X.Y.Z` in frontmatter or YAML) must be updated to match the new CHANGELOG version.
- **Toolkit repo path**: resolve from `$AGENT_TOOLKIT_DIR` or `$TOOLKIT_PATH` if set; otherwise default to `/Users/bmj/Developer/git/agent-toolkit`.
- **Commits route through release-engineer**: do not run `git commit` inline in this command. Phase 4 delegates to `release-engineer` per the frankenstein Ship phase rule.
