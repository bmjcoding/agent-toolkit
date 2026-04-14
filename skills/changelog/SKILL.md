---
name: changelog
description: >
  Canonical CHANGELOG.md standard: Keep a Changelog 1.1.0 + SemVer, required header,
  version sections, categories, per-component tags, comparison links, bump table. Use
  when creating or editing any CHANGELOG.md in the toolkit.
disable-model-invocation: true
argument-hint: "[path to CHANGELOG.md to edit or create]"
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

## Release Subcommand

### `/changelog release [<component-slug>]`

Performs the full promote-and-tag cycle. Without an argument, operates on every
component whose `## [Unreleased]` section is non-empty. With a slug, operates on that
component only.

**Atomicity has two levels:**
- **Per-component:** the commit + tag + push triple for a single component is atomic. If the tag fails after the commit, reset the commit and retry; if the push fails after the tag, delete the local tag and retry. Do not leave a component in a partially-released state.
- **Across components:** there is no cross-component rollback by design. Each component's triple is independent. If component B fails, component A's already-pushed tag is not reverted — partial success means earlier components are live. See [Failure Recovery](#failure-recovery) below.

1. Read `CHANGELOG.md`. Abort if `## [Unreleased]` is empty.
2. Compute bump from category headers (highest level wins):
   - `### Removed` → MAJOR; `### Added` / `### Changed` / `### Security` → MINOR;
     `### Fixed` / `### Deprecated` → PATCH.
3. Prompt for confirmation on MAJOR bumps. Auto-derive for MINOR/PATCH.
4. Promote: rename `## [Unreleased]` → `## [X.Y.Z] - YYYY-MM-DD`; insert fresh empty
   `## [Unreleased]` above; update footer comparison links; write file.
5. Execute the atomic triple:

```bash
git commit -m "chore: release {slug}-v{X.Y.Z}"
git tag {slug}-v{X.Y.Z}
git push origin HEAD {slug}-v{X.Y.Z}
```

**Slug derivation:** strip the `CHANGELOG.md` filename, strip the type-directory segment
(`skills`, `agents`, `commands`, `hooks`, `rules`, `bundles`), prepend the tool prefix.

| CHANGELOG.md path                                   | Slug                           | Example tag                           |
|-----------------------------------------------------|--------------------------------|---------------------------------------|
| `claude-code/skills/changelog/CHANGELOG.md`        | `claude-code/changelog`        | `claude-code/changelog-v7.0.0`        |
| `claude-code/agents/release-engineer/CHANGELOG.md` | `claude-code/release-engineer` | `claude-code/release-engineer-v2.0.0` |
| `claude-code/hooks/changelog-check/CHANGELOG.md`   | `claude-code/changelog-check`  | `claude-code/changelog-check-v3.0.0`  |
| `claude-code/rules/docker/CHANGELOG.md`            | `claude-code/docker`           | `claude-code/docker-v4.0.0`           |

**Multi-component:** each component gets its own commit, tag, and push triple processed
in alphabetical path order. A failure on component B does not roll back component A's
already-pushed tag.

**First-release edge case:** for the first release of a component (no prior `{slug}-v` tag
exists), the comparison footer link uses the `tree/` form per the Comparison Links section
(see the sentinel comment in that section for the no-tags-yet case).

**Single-component example:** `/changelog release changelog-check` processes only
`claude-code/hooks/changelog-check/CHANGELOG.md`.

### Failure Recovery

#### If the per-component triple fails mid-sequence

| State | Recovery |
|-------|----------|
| Promoted file but no commit | `git checkout -- <path>/CHANGELOG.md` to revert, then re-run `/changelog release <slug>` |
| Commit created but tag missing | `git tag {slug}-v{X.Y.Z} HEAD && git push origin HEAD {slug}-v{X.Y.Z}` |
| Commit + tag created but push failed | `git push origin HEAD {slug}-v{X.Y.Z}` (the tag already exists locally) |

#### If a multi-component release partially failed

1. Check which components shipped: `git tag -l '{tool}/*-v*'` and `git log --oneline -5`.
2. **Components that shipped:** do nothing — they are live.
3. **Components with a commit but no tag:** create and push the tag (see table above).
4. **Components with a promoted CHANGELOG but no commit:** revert via `git checkout -- <path>/CHANGELOG.md` and re-run `/changelog release <slug>`.
5. **Components not yet touched:** re-run `/changelog release` with just the unprocessed slugs.

### `/changelog append <category> <message>`

Appends `- <message>` under `## [Unreleased]` → `### <category>` in the component's
`CHANGELOG.md`. Creates the category heading if absent, in canonical order
(`Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`). Does not commit.

```
/changelog append Added "Slug derivation helper now handles bundles/ directory"
```

## SemVer Bump Table

| Signal | Bump |
|---|---|
| Wording fix, gotcha added, ≤5 lines changed, no new sections | PATCH |
| New section, new reference file, new capability, new rule | MINOR |
| Structural rewrite, output format change, handoff schema change, breaking behavior | MAJOR |

When a single update triggers multiple levels, use the highest applicable bump.

Routing rules for changelog findings are defined in improve/SKILL.md step 2f.

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
