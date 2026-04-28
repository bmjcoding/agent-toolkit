---
name: changelog
description: >
  Canonical CHANGELOG.md standard: Keep a Changelog 1.1.0 + SemVer, required header,
  version sections, categories, version footers, bump table. Use
  when creating or editing any CHANGELOG.md in the toolkit.
lifecycle: stable
disable-model-invocation: true
argument-hint: "[path to CHANGELOG.md to edit or create]"
---

# Changelog Standard

Canonical definition of `CHANGELOG.md` format for every component in the agent-toolkit
ecosystem (agents, skills, commands, hooks, rules). Read this before creating or editing
any `CHANGELOG.md`. Use progressive disclosure: load only the sections needed for the
task at hand.

## Quick Routing

| If you are... | Read |
|---|---|
| Fixing format or writing a new entry | Required Header Block, Version Section Format, Change Categories, Gotchas |
| Appending under `[Unreleased]` | Change Categories, `changelog append <category> <message>`, Gotchas |
| Cutting a release | Version Link Footers, `[Unreleased]` Workflow, Release Subcommand |

Do not load the release sections for a simple entry edit.

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

## Version Ownership

This toolkit is a monorepo. Each component has its own `CHANGELOG.md` and its own SemVer
sequence. Versions live in section headers such as `## [X.Y.Z] - YYYY-MM-DD`.

Rules:
- Do **not** require git tags for changelog versions.
- Do **not** add tag-backed GitHub, GitLab, or Bitbucket comparison URLs.
- A component's latest released version is the first version section in its changelog.
- Root `CHANGELOG.md` tracks repository-level changes. Component changelogs track only
  their component.

## Version Link Footers

Keep a Changelog allows reference-style version link footers, but this repository must be
portable to Bitbucket Data Center. Until a non-tag-backed URL scheme exists for the target
host, omit version link footers entirely.

Allowed:

```markdown
## [1.2.3] - 2026-04-28
```

Rejected:

```markdown
[1.2.3]: https://github.com/org/repo/compare/skill/example-v1.2.2...skill/example-v1.2.3
[1.0.0]: https://github.com/org/repo/tree/skill/example-v1.0.0
```

If a future host provides stable non-tag comparison URLs, add reference-style footers at
the bottom of the file. Do not use release tags as the URL source.

## [Unreleased] Workflow

Always maintain `## [Unreleased]` at the top of the version list. It accumulates
branch-local changes before a PR is opened, and resets to empty after those changes are
promoted into the next versioned section.

When preparing a PR that changes a component:

1. Promote the touched component's non-empty `## [Unreleased]` section to
   `## [X.Y.Z] - YYYY-MM-DD`.
2. Insert a fresh empty `## [Unreleased]` above the new versioned section.
3. Do not add tag-backed comparison links.
4. Continue editing the versioned section for that PR instead of adding new PR-scoped
   bullets back under `## [Unreleased]`.

When cutting a release:

1. Rename `## [Unreleased]` to `## [X.Y.Z] - YYYY-MM-DD`.
2. Add a fresh empty `## [Unreleased]` above the newly named section.
3. Commit the changelog update with the component changes.

**Monorepo scope:** only the component whose files changed gets its CHANGELOG updated
and its version bumped. Other components' `[Unreleased]` sections are unaffected by an
unrelated component's release.

**Who triggers:** a human developer, the `sync-toolkit` workflow, or the
release-engineer agent when dispatched by the orchestrator. Automated CI does not cut
releases, but PR validation may require that touched component changelogs have already
been promoted out of `## [Unreleased]`.

## Release Subcommand

### `changelog release [<component-slug>]`

Promotes non-empty `## [Unreleased]` sections into dated version sections. Without an
argument, operates on every component whose `## [Unreleased]` section is non-empty. With
a slug, operates on that component only.

1. Read `CHANGELOG.md`. Abort if `## [Unreleased]` is empty.
2. Compute bump from category headers (highest level wins):
   - `### Removed` → MAJOR; `### Added` / `### Changed` / `### Security` → MINOR;
     `### Fixed` / `### Deprecated` → PATCH.
3. Prompt for confirmation on MAJOR bumps. Auto-derive for MINOR/PATCH.
4. Promote: rename `## [Unreleased]` → `## [X.Y.Z] - YYYY-MM-DD`; insert fresh empty
   `## [Unreleased]` above; remove tag-backed version footers; write file.

Do not create or push release tags.

**Single-component example:** `changelog release changelog-check` processes only
`claude-code/hooks/changelog-check/CHANGELOG.md`.

### `changelog append <category> <message>`

Appends `- <message>` under `## [Unreleased]` → `### <category>` in the component's
`CHANGELOG.md`. Creates the category heading if absent, in canonical order
(`Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`). Does not commit.

```
changelog append Added "Slug derivation helper now handles bundles/ directory"
```

## SemVer Bump Table

| Signal | Bump |
|---|---|
| Wording fix, gotcha added, ≤5 lines changed, no new sections | PATCH |
| New section, new reference file, new capability, new rule | MINOR |
| Structural rewrite, output format change, handoff schema change, breaking behavior | MAJOR |

When a single update triggers multiple levels, use the highest applicable bump.

## Routing Rules

Each toolkit component has its own `CHANGELOG.md` in its subdirectory. Canonical paths:

- `agents/{name}/CHANGELOG.md`
- `claude-code/hooks/{name}/CHANGELOG.md`
- `rules/{name}/CHANGELOG.md`
- `skills/{category}/{name}/CHANGELOG.md`
- `workflows/{name}/CHANGELOG.md`

Reference files and scripts inside a component directory (e.g.,
`skills/{category}/{name}/references/`) use that component's `CHANGELOG.md` — no separate
changelog per subdirectory.

**Aggregated changelogs at the category root are forbidden.** Do not create or write to
`agents/CHANGELOG.md`, `skills/CHANGELOG.md`, etc. Each component is
versioned independently through its own version sections.

## Gotchas

Common authoring mistakes. See `references/anti-patterns.md` for the full table and the
commit-log-versus-changelog rules.

- `## X.Y.Z` without brackets breaks tooling that parses the `## [x.y.z]` format.
- Non-ISO dates (`04/05/26`) are ambiguous and forbidden.
- Missing `## [Unreleased]` forces readers to diff branches to see in-progress work.
- Do NOT dump commit logs (`git log`) or file paths into entries — summarize the
  user-facing outcome. The Keep a Changelog spec explicitly prohibits commit-log dumps.
- Do not add tag-backed compare links. They do not survive the Bitbucket Data Center
  migration target.
- If version footers are reintroduced later, they must use a non-tag-backed URL scheme
  supported by the target host.

## Further Reading

| Topic | File |
|-------|------|
| Anti-patterns table, commit-log-vs-changelog rules, yanked releases | `references/anti-patterns.md` |
| Drift-prevention hooks; commit classification for automated entries | `references/enforcement.md` |

## Scripts

| Script | Purpose |
|--------|---------|
| None | This skill no longer requires helper scripts for tag or platform URL management. |

$ARGUMENTS
