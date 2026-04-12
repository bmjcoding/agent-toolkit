---
name: changelog
description: >
  Canonical CHANGELOG.md standard: Keep a Changelog 1.1.0 + SemVer, required header,
  version sections, categories, per-component tags, comparison links, bump table. Use
  when creating or editing any CHANGELOG.md in the toolkit.
disable-model-invocation: true
argument-hint: "[path to CHANGELOG.md to edit or create]"
metadata:
  version: 3.0.0
---

# Changelog Standard

Canonical definition of `CHANGELOG.md` format for every component in the agent-toolkit
ecosystem (agents, skills, commands, hooks, rules). Read this before creating or editing
any `CHANGELOG.md`.

## Standards

- **Keep a Changelog 1.1.0**: https://keepachangelog.com/en/1.1.0/
- **Semantic Versioning 2.0.0**: https://semver.org/spec/v2.0.0.html

## Required Header Block

Every `CHANGELOG.md` must begin with exactly this block:

```markdown
# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
```

## Version Section Format

```markdown
## [X.Y.Z] - YYYY-MM-DD
```

- Brackets around the version number are **required**.
- Date is **ISO 8601** (`YYYY-MM-DD`) — no other format is acceptable.
- A single space before and after the hyphen separating version from date.
- Versions are listed **newest first** (top = most recent).
- The `[Unreleased]` section has no date: `## [Unreleased]`.

## Change Categories

Use these categories in this exact order. Omit empty categories.

| Category      | Use for                                                    |
|---------------|------------------------------------------------------------|
| `Added`       | New features                                               |
| `Changed`     | Changes to existing functionality                          |
| `Deprecated`  | Features that will be removed in a future release          |
| `Removed`     | Features removed in this release                           |
| `Fixed`       | Bug fixes                                                  |
| `Security`    | Vulnerability fixes; invite users to upgrade               |

Each entry is a Markdown list item (`- `). One idea per bullet. Use a verb-prefixed one-liner.

## Per-Component Tag Format

This toolkit is a monorepo. Each component has its own version and VCS tag. **Do not use
repo-wide (`vX.Y.Z`) tags** — they imply a single release that covers all components,
which is incorrect.

Canonical tag format: `{component-slug}-v{version}`

| Component path                         | Tag slug         | Example tag                        |
|----------------------------------------|------------------|------------------------------------|
| `shared/skills/changelog/`             | `changelog`      | `shared/changelog-v3.0.0`          |
| `claude-code/agents/frankenstein/`     | `frankenstein`   | `claude-code/frankenstein-v1.5.0`  |
| `claude-code/commands/sync-toolkit/`  | `sync-toolkit`   | `claude-code/sync-toolkit-v1.0.0`  |
| `claude-code/hooks/branch-guard/`     | `branch-guard`   | `claude-code/branch-guard-v1.0.0`  |
| `claude-code/rules/docker/`           | `docker`         | `claude-code/docker-v1.0.0`        |

Rules:
- The slug is the component's directory name (the `{name}` segment in `skills/{name}/`).
- Hyphens are allowed in slugs. Do not use slashes, `@`, or spaces — they require URL
  encoding and cause routing issues on Bitbucket Cloud and Datacenter.
- If two components would produce the same slug (e.g., a skill and a hook both named
  `guard`), prefix the slug with the component type: `skill-guard` / `hook-guard`.
- All tags are lowercase: `changelog-v3.0.0`, not `Changelog-V3.0.0`.

## Comparison Links

Place reference-style link definitions at the **bottom** of the file. Template for
GitHub (default platform for this toolkit):

```markdown
[Unreleased]: {BASE_URL}/compare/{slug}-v{latest}...HEAD
[X.Y.Z]: {BASE_URL}/compare/{slug}-v{prev}...{slug}-v{X.Y.Z}
[1.0.0]: {BASE_URL}/tree/{slug}-v1.0.0
```

Rules:
- `[Unreleased]` compares the latest released tag for this component to `HEAD`.
- Each released version compares to its predecessor using per-component tags.
- The oldest release uses a tag-view URL — `tree/{slug}-v{version}` is the always-valid
  default on GitHub (every pushed tag auto-creates a `tree/` view; `releases/tag/` only
  works if a GitHub Release object exists).
- If no VCS tag has been pushed yet for this component, omit link definitions and
  document with: `<!-- No tags pushed yet for this component — compare links omitted until first tag -->`

**Platform-specific URL templates** (GitLab, Bitbucket Cloud, Bitbucket Datacenter) →
see `references/platform-urls.md`.

Run `scripts/detect-platform.sh` to auto-detect the platform from `git remote`. Override
by creating `.changelog-platform.yml` at the repo root: `platform: gitlab` (or `github`,
`bitbucket-cloud`, `bitbucket-datacenter`).

## [Unreleased] Workflow

Always maintain `## [Unreleased]` at the top of the version list. It accumulates changes
that are merged but not yet tagged.

When cutting a release:

1. Rename `## [Unreleased]` to `## [X.Y.Z] - YYYY-MM-DD`.
2. Update the comparison link footer with the new version.
3. Update the `[Unreleased]` link to compare the new tag to `HEAD`.
4. Add a fresh empty `## [Unreleased]` above the newly named section.

**Atomic ordering at tag creation** — edit, commit, tag, push together:

```bash
git commit -m "chore: prepare {slug}-v{X.Y.Z}"
git tag {slug}-v{X.Y.Z}
git push origin HEAD {slug}-v{X.Y.Z}
```

Do not update the CHANGELOG after the tag is pushed — the rename and tag push must be
atomic.

**Monorepo scope:** only the component whose files changed gets its CHANGELOG updated
and its version bumped. Other components' `[Unreleased]` sections are unaffected by an
unrelated component's release.

**Who triggers:** a human developer, the `/sync-toolkit` command, or the
release-engineer agent when dispatched by the orchestrator. Automated CI does not cut
releases without explicit invocation.

## SemVer Bump Table

| Signal | Bump |
|---|---|
| Wording fix, gotcha added, ≤5 lines changed, no new sections | PATCH |
| New section, new reference file, new capability, new rule | MINOR |
| Structural rewrite, output format change, handoff schema change, breaking behavior | MAJOR |

When a single update triggers multiple levels, use the highest applicable bump.

## Routing Rules

Each toolkit component has its own `CHANGELOG.md` in its subdirectory. Paths use the
new per-tool layout (ADR 0005):

- `claude-code/agents/{name}/CHANGELOG.md`
- `claude-code/commands/{name}/CHANGELOG.md`
- `claude-code/hooks/{name}/CHANGELOG.md`
- `claude-code/rules/{name}/CHANGELOG.md`
- `shared/skills/{name}/CHANGELOG.md`
- `github-copilot/skills/{name}/CHANGELOG.md`

Reference files and scripts inside a component directory (e.g.,
`shared/skills/{name}/references/`) use that component's `CHANGELOG.md` — no separate
changelog per subdirectory.

**Aggregated changelogs at the category root are forbidden.** Do not create or write to
`claude-code/agents/CHANGELOG.md`, `shared/skills/CHANGELOG.md`, etc. Each component is
versioned independently using the per-component tag format.

## Gotchas

Common authoring mistakes. See `references/anti-patterns.md` for the full table and the
commit-log-versus-changelog rules.

- `## X.Y.Z` without brackets breaks tooling that parses the `## [x.y.z]` format.
- Non-ISO dates (`04/05/26`) are ambiguous and forbidden.
- Missing `## [Unreleased]` forces readers to diff branches to see in-progress work.
- Do NOT dump commit logs (`git log`) or file paths into entries — summarize the
  user-facing outcome. The Keep a Changelog spec explicitly prohibits commit-log dumps.
- Compare links must reference tags that exist in the repo — verify with
  `git tag -l "{slug}-v*"` before publishing.
- Hardcoding a GitHub compare URL in a GitLab or Bitbucket project — the URL will 404.
  Use `scripts/detect-platform.sh` + the correct template from `references/platform-urls.md`.

## Further Reading

| Topic | File |
|-------|------|
| Platform URL formats (GitHub, GitLab, Bitbucket Cloud, Bitbucket Datacenter) | `references/platform-urls.md` |
| Anti-patterns table, commit-log-vs-changelog rules, yanked releases | `references/anti-patterns.md` |
| Migrating from monolithic tags; version renumbering procedure | `references/migration.md` |
| Drift-prevention hooks; commit classification for automated entries | `references/enforcement.md` |

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/detect-platform.sh` | Detect repo platform (github / gitlab / bitbucket-cloud / bitbucket-datacenter) from `git remote` and `.changelog-platform.yml`. |
| `scripts/backfill-changelog-tags.sh` | Backfill per-component git tags from a CHANGELOG.md during migration from monolithic tag format. |

Both scripts support `--help`.

$ARGUMENTS
