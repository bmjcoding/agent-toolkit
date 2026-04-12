---
name: changelog
description: >
  Canonical changelog standard for all toolkit components. Defines Keep a Changelog 1.1.0
  + SemVer format, required header block, version section rules, change categories,
  comparison links, per-component tag format, multi-platform URL generation, SemVer bump
  table, and commit classification. Read this before writing any CHANGELOG.md in the toolkit.
disable-model-invocation: true
metadata:
  version: 2.0.0
---

# Changelog Standard

This skill is the canonical definition of the changelog format for every component in the
claude-toolkit ecosystem (agents, skills, commands, hooks, rules). Read it before creating
or editing any `CHANGELOG.md`.

## Standards

- **Keep a Changelog 1.1.0**: https://keepachangelog.com/en/1.1.0/
- **Keep a Changelog — Guiding Principles**: https://keepachangelog.com/en/1.1.0/#how
- **Keep a Changelog — Bad Practices**: https://keepachangelog.com/en/1.1.0/#bad-practices
- **Semantic Versioning 2.0.0**: https://semver.org/spec/v2.0.0.html

---

## Required Header Block

Every `CHANGELOG.md` must begin with exactly this block:

```markdown
# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
```

---

## Version Section Format

```markdown
## [X.Y.Z] - YYYY-MM-DD
```

- Brackets around the version number are **required**.
- Date is **ISO 8601** (`YYYY-MM-DD`) — no other format is acceptable.
- A single space before and after the hyphen separating version from date.
- Versions are listed **newest first** (top = most recent).

The `[Unreleased]` section has no date:

```markdown
## [Unreleased]
```

---

## Change Categories

Use these categories in this exact order. Omit empty categories.

```markdown
### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security
```

| Category      | Use for                                                    |
|---------------|------------------------------------------------------------|
| `Added`       | New features                                               |
| `Changed`     | Changes to existing functionality                          |
| `Deprecated`  | Features that will be removed in a future release          |
| `Removed`     | Features removed in this release                           |
| `Fixed`       | Bug fixes                                                  |
| `Security`    | Vulnerability fixes; invite users to upgrade               |

Each entry is a Markdown list item (`- `). One idea per bullet. Use a verb-prefixed one-liner.

---

## Per-Component Tag Format

This toolkit is a monorepo. Each component has its own version and its own VCS tag.
**Do not use repo-wide (`vX.Y.Z`) tags** — they imply a single release that covers all
components, which is incorrect.

The canonical tag format for all toolkit components is:

```
{component-slug}-v{version}
```

Examples:

| Component path            | Tag slug         | Example tag          |
|---------------------------|------------------|----------------------|
| `skills/changelog/`       | `changelog`      | `changelog-v2.0.0`   |
| `agents/frankenstein/`    | `frankenstein`   | `frankenstein-v1.5.0`|
| `commands/sync-toolkit/`  | `sync-toolkit`   | `sync-toolkit-v1.0.0`|
| `hooks/branch-guard/`     | `branch-guard`   | `branch-guard-v1.0.0`|
| `rules/docker/`           | `docker`         | `docker-v1.0.0`      |

Rules:
- The slug is the component's directory name (the `{name}` segment in `skills/{name}/`).
- Hyphens are allowed in slugs. Do not use slashes, `@`, or spaces — they require URL
  encoding and cause routing issues on Bitbucket Cloud and Datacenter.
- If two components would produce the same slug (e.g., a skill and a hook both named `guard`),
  prefix the slug with the component type: `skill-guard` / `hook-guard`.
- All tags are lowercase. `changelog-v2.0.0`, not `Changelog-V2.0.0`.

---

## Comparison Links

Place reference-style link definitions at the **bottom** of the file:

```markdown
[Unreleased]: {BASE_URL}/compare/{slug}-v{latest}...HEAD
[X.Y.Z]: {BASE_URL}/compare/{slug}-v{prev}...{slug}-v{X.Y.Z}
[1.0.0]: {BASE_URL}/tree/{slug}-v1.0.0
```

For the changelog skill itself, using the GitHub default:

```markdown
[Unreleased]: https://github.com/bmjcoding/claude-toolkit/compare/changelog-v2.0.0...HEAD
[2.0.0]: https://github.com/bmjcoding/claude-toolkit/compare/changelog-v1.2.0...changelog-v2.0.0
[1.2.0]: https://github.com/bmjcoding/claude-toolkit/compare/changelog-v1.1.0...changelog-v1.2.0
[1.1.0]: https://github.com/bmjcoding/claude-toolkit/compare/changelog-v1.0.0...changelog-v1.1.0
[1.0.0]: https://github.com/bmjcoding/claude-toolkit/tree/changelog-v1.0.0
```

Rules:
- `[Unreleased]` compares the latest released tag for this component to `HEAD`.
- Each released version compares to its predecessor using per-component tags.
- The oldest release uses a tag-view URL (no predecessor to diff against).
  For GitHub, use `tree/{slug}-v{version}` — this URL is always valid because every pushed
  git tag automatically creates a `tree/` view. If a GitHub Release object also exists for
  the tag (created via `gh release create` or the GitHub UI), `releases/tag/{slug}-v{version}`
  is also valid, but `tree/` is the recommended default.
- If no VCS tag has ever been pushed for this component, write `[Unreleased]` with no link
  definition — or link to the component subdirectory on the default branch. Document the
  omission with a comment directly above the link section:
  `<!-- No tags pushed yet for this component — compare links omitted until first tag -->`

### Platform URL Formats

Use `scripts/detect-platform.sh` to determine the platform for the current repo. To override
auto-detection, create `.changelog-platform.yml` at the repo root with: `platform: gitlab`
(or `github`, `bitbucket-cloud`, `bitbucket-datacenter`). See `.changelog-platform.yml.example`
for the full schema. When platform is unknown, omit compare links rather than generating broken
ones and document the omission.

**{BASE_URL}** is the remote repository URL with `.git` suffix stripped.

#### GitHub (github.com and GitHub Enterprise)

Three-dot (`...`) semantics: shows commits reachable from the newer ref but not the older.
`HEAD` resolves correctly in GitHub compare URLs (verified live against public repos).

```
Compare:    {BASE_URL}/compare/{slug}-v{old}...{slug}-v{new}
Unreleased: {BASE_URL}/compare/{slug}-v{latest}...HEAD
Tag view:   {BASE_URL}/tree/{slug}-v{version}             (always valid; preferred default)
            {BASE_URL}/releases/tag/{slug}-v{version}     (valid only if a GitHub Release object exists)
```

Note: If a branch and tag share the same name, GitHub uses the branch. Use `tags/{slug}-v{version}`
in the compare URL when there is a collision risk (rare with component-prefixed tags):
```
{BASE_URL}/compare/tags/{slug}-v{old}...tags/{slug}-v{new}
```

#### GitLab (gitlab.com and self-hosted)

Note the `/-/` path separator — required for all GitLab routing.

```
Compare:    {BASE_URL}/-/compare/{slug}-v{old}...{slug}-v{new}
Unreleased: {BASE_URL}/-/compare/{slug}-v{latest}...HEAD
Tag view:   {BASE_URL}/-/tags/{slug}-v{version}
```

GitLab supports nested groups (`group/subgroup/repo`). The `{BASE_URL}` for self-hosted GitLab
may have more than two path segments before the repo name — extract it from `git remote get-url origin`.
For self-hosted instances, override platform detection by creating `.changelog-platform.yml` at
the repo root with `platform: gitlab` (cannot be auto-detected from URL structure alone when the
hostname is not `gitlab.com`). See `.changelog-platform.yml.example` for the full schema.

#### Bitbucket Cloud (bitbucket.org)

IMPORTANT: Bitbucket Cloud uses **two dots** (`..`), not three. The argument **order is reversed**:
newer ref first, older ref second.

```
Compare:    {BASE_URL}/branches/compare/{slug}-v{new}..{slug}-v{old}
Unreleased: {BASE_URL}/branches/compare/main..{slug}-v{latest}
Tag view:   {BASE_URL}/src/{slug}-v{version}/
```

Use the actual default branch name in place of `main` for the Unreleased link. `HEAD` is not
confirmed to work in Bitbucket Cloud compare URLs.

Note: Whether `branches/compare/` accepts tag refs is not officially documented by Atlassian. If the
generated URL returns 404 at click time, use the git log fallback:
```
git log {slug}-v{latest}..HEAD --oneline -- {component-path}/
```

#### Bitbucket Datacenter (self-hosted / Bitbucket Server)

Uses query parameters, not path segments, for the compared refs. `targetBranch` is the **older** ref
(base); `sourceBranch` is the **newer** ref (head). Both require the `refs/tags/` prefix.

```
Compare:    {BASE_URL}/compare/commits?targetBranch=refs%2Ftags%2F{slug}-v{old}&sourceBranch=refs%2Ftags%2F{slug}-v{new}
Unreleased: {BASE_URL}/compare/commits?targetBranch=refs%2Ftags%2F{slug}-v{latest}&sourceBranch=refs%2Fheads%2Fmain
Tag view:   {BASE_URL}/browse?at=refs%2Ftags%2F{slug}-v{version}
```

Where `{BASE_URL}` for Datacenter is: `https://{dc-host}/projects/{PROJECT-KEY}/repos/{repo}`

The `?targetBranch=`/`?sourceBranch=` web UI parameters are from community documentation —
not verified from official Atlassian docs. Use with awareness that the format may behave
differently on custom-proxied Datacenter installations.

For personal repositories on Datacenter, the project key uses a tilde prefix:
`https://{dc-host}/projects/~{userSlug}/repos/{repo}`

Substitute the actual default branch name for `main` in the Unreleased link. Use
`refs/heads/{branch}` format — bare `HEAD` is not confirmed to work in the `sourceBranch` param.

If the Datacenter installation omits `/scm/` from clone URLs (custom proxy), platform auto-detection
may fail. Override by creating `.changelog-platform.yml` at the repo root with:
`platform: bitbucket-datacenter`. See `.changelog-platform.yml.example` for the full schema.

---

## [Unreleased] Workflow

Always maintain `## [Unreleased]` at the top of the version list, above all released versions.
It accumulates changes that are merged but not yet tagged.

When cutting a release:
1. Rename `## [Unreleased]` to `## [X.Y.Z] - YYYY-MM-DD`.
2. Add or update the comparison link for the new version at the bottom using the per-component
   tag format: `{slug}-v{X.Y.Z}`.
3. Update `[Unreleased]` link to compare the new component tag to `HEAD`.
4. Add a new empty `## [Unreleased]` above the newly named section.

### Release Cut — Who, When, and Scope

**Who triggers the release cut:** A human developer or the `/sync-toolkit` command. The
release-engineer agent (when dispatched by the orchestrator) may also perform these steps.
Automated CI does not cut releases without explicit invocation.

**When:** At tag creation — when the component tag is pushed to the remote (`git push origin
{slug}-v{X.Y.Z}`). Do not update the CHANGELOG after the tag is pushed; the rename and tag
push must be atomic. The correct order is:

1. Edit CHANGELOG.md (rename Unreleased, update links).
2. Commit the CHANGELOG update.
3. Tag the commit: `git tag {slug}-v{X.Y.Z}`.
4. Push commit and tag together: `git push origin HEAD {slug}-v{X.Y.Z}`.

**Monorepo scope:** Only the component whose files changed gets its CHANGELOG updated and its
version bumped. Other components' `[Unreleased]` sections are unaffected by an unrelated
component's release. Do not bump a component's version because a sibling component was released.

---

## SemVer Bump Table

| Signal | Bump |
|---|---|
| Wording fix, gotcha added, <=5 lines changed, no new sections | PATCH |
| New section, new reference file, new capability, new rule | MINOR |
| Structural rewrite, output format change, handoff schema change, breaking behavior change | MAJOR |

When a single update triggers multiple levels, use the highest applicable bump.

---

## Commit Classification Rules

Map commits and change descriptions to changelog categories:

| Commit prefix / keyword | Category |
|---|---|
| `feat:` or `Added` prefix | `### Added` |
| `fix:` or `Fixed` prefix | `### Fixed` |
| `refactor:` / `chore:` / `Changed` prefix | `### Changed` |
| `docs:` touching documentation only | `### Changed` (omit if internal-only) |
| `security:` or `Security` prefix | `### Security` |
| `deprecate:` or `Deprecated` prefix | `### Deprecated` |
| `remove:` or `Removed` prefix | `### Removed` |

Collapse multiple related commits for the same version into one entry per logical change.

---

## Routing Rules

Each toolkit component has its own `CHANGELOG.md` in its subdirectory:

- `agents/{name}/CHANGELOG.md`
- `skills/{name}/CHANGELOG.md`
- `commands/{name}/CHANGELOG.md`
- `hooks/{name}/CHANGELOG.md`
- `rules/{name}/CHANGELOG.md`

Reference files and scripts inside a component directory (e.g., `skills/{name}/references/`)
use that component's `CHANGELOG.md`, not a separate one.

**Aggregated changelogs at the category root are forbidden.** Do not create or write to
`agents/CHANGELOG.md`, `skills/CHANGELOG.md`, etc.

Each component is versioned independently. The VCS tag for a component uses the per-component
format defined in the Per-Component Tag Format section: `{component-slug}-v{version}`. See that
section for the slug-derivation rules and naming collision handling.

---

## Drift-Prevention Enforcement

Three layers enforce CHANGELOG hygiene across the toolkit:

**Layer 1 — Drift-check hook (SubagentStop)**: After each subagent completes, `toolkit-drift-check.sh` checks whether any modified component files have a paired CHANGELOG.md update. If not, it prints an advisory to stderr listing the drifted components. Non-blocking. Per-session dedup prevents repeated warnings.

**Layer 2 — Edit-reminder hook (PreToolUse)**: When an agent begins writing or editing a toolkit component file, `toolkit-edit-reminder.sh` injects a reminder into the agent context reinforcing the user-facing summary requirement and the SemVer bump table.

**Layer 3 — /sync-toolkit command**: The `/sync-toolkit` slash command orchestrates full synchronization: detects changes, spawns per-component agents to generate user-facing CHANGELOG entries, bumps versions, copies to ~/.claude, and commits per-component. The command body explicitly prohibits commit-log dumps in every spawned agent prompt.

Additional drift-prevention layers (semantic check, CI validation) are potential future enhancements.

---

## Version Renumbering

When compressing version gaps (e.g., renumbering 1.0.0 → 1.5.0 down to 1.0.0 → 1.3.0), follow these steps in order:

1. Rewrite the version headers in `CHANGELOG.md` using the new numbering.
2. Update the comparison links at the bottom of `CHANGELOG.md` to match the new versions.
3. **Required**: Search the component directory for definition files (`*.md`) and update any `# version:` comment to match the new highest released version. The version comment is the single source of truth visible to agents loading the definition — a mismatch causes confusion about which feature set is loaded.
   ```bash
   grep -l "# version:" agents/{name}/*.md skills/{name}/*.md 2>/dev/null
   ```
4. Verify: `grep "# version:" <definition-file>` matches the highest `## [X.Y.Z]` header in the CHANGELOG.

---

## Migrating from Monolithic Tag Format

If a CHANGELOG was written before per-component tags were adopted, its footers may reference
bare `v{version}` tags (e.g., `compare/v1.0.0...v1.1.0`). Follow these steps to migrate:

1. **Identify old-format CHANGELOGs:**
   ```bash
   grep -r '^\[.*\]: .*compare/v[0-9]' **/CHANGELOG.md
   ```

2. **Rewrite footers to dash-style.** Replace monolithic tag refs with per-component tags
   following the exemplar in `skills/changelog/CHANGELOG.md`. The oldest-version footer
   switches from `releases/tag/v{version}` to `tree/{slug}-v{version}`.

3. **Do NOT delete old monolithic tags.** Old `v{version}` tags can coexist with new
   `{slug}-v{version}` tags indefinitely. Removing them rewrites history and breaks anyone
   referencing them externally (links, CI pipelines, package registries).

4. **Order of operations:**
   - (a) Rewrite all CHANGELOG footers to use `{slug}-v{version}` format.
   - (b) Commit the footer changes.
   - (c) Run `scripts/backfill-changelog-tags.sh` to generate historical per-component tags.
   - (d) Push the new tags: `git push origin --tags`. Existing monolithic tags are untouched.

---

## Anti-patterns

| Anti-pattern | Type | Why it fails |
|---|---|---|
| `## X.Y.Z` without brackets | Formatting | Breaks tooling that parses `## [x.y.z]` format |
| Non-ISO dates (e.g., `04/05/26`) | Formatting | Ambiguous and unacceptable |
| No `## [Unreleased]` section | Formatting | Forces readers to diff branches to see in-progress work |
| Missing comparison links | Formatting | Breaks changelog-as-navigation; diffs are one click away |
| Footer link uses `releases/tag/` when no GitHub Release object exists | Formatting | URL 404s; use `tree/{slug}-v{version}` as the always-valid default |
| Version gaps (1.0.0 to 1.3.0 without 1.1.0 and 1.2.0) | Formatting | Implies undocumented changes; reconstruct or renumber |
| Commit-log dumps (`git log`) | Process | Noise; conflates internal churn with user-facing change |
| Using a future or guessed release date | Process | Date must be the actual tag-push date in ISO 8601; placeholders like `YYYY-MM-DD` left in published CHANGELOGs are invalid |
| Compare link references a tag that does not exist in the repo | Process | Link 404s silently; verify every tag in the link footer exists with `git tag -l "{slug}-v*"` before publishing |
| Hardcoding a GitHub compare URL in a project hosted on GitLab or Bitbucket | Process | URL will 404; use the correct platform template from the Platform URL Formats section |
| Using a monolithic repo tag (`v1.2.0`) in a monorepo with per-component changelogs | Process | Implies a single release covering all components; use per-component tags (`{slug}-v{version}`) |
| Lumping unrelated changes | Semantic | One bullet = one idea; avoid "and also fixed X" entries |
| `## [1.0.1] - 2025-04-11 [YANKED]` without explanation | Semantic | Yanked releases must explain why in the section body |
| Version comment in definition file not updated after renumbering | Semantic | Leaves definition file reporting a version that does not match the CHANGELOG — follow the Version Renumbering steps above |
| Omitting `### Deprecated` entries when features are deprecated | Semantic | Violates KaC bad-practices; users cannot anticipate removals — see https://keepachangelog.com/en/1.1.0/#bad-practices |
| Tagging a pre-release as a stable version (e.g., 1.0.0-rc.1 shipped as 1.0.0) | Semantic | Hides stability status from consumers. Use SemVer pre-release identifiers (-alpha, -beta, -rc.N) and document them under [Unreleased] until promoting to stable. See [KaC bad practices](https://keepachangelog.com/en/1.1.0/#bad-practices). |

See also: https://keepachangelog.com/en/1.1.0/#bad-practices for the upstream bad-practices reference.

---

## Commit Logs vs. Changelog Entries

The Keep a Changelog specification explicitly states: **do not use commit logs as changelogs**. This rule applies to all automated CHANGELOG generation in the toolkit.

| Bad (commit-log dump) | Good (user-facing summary) |
|---|---|
| `Updated SKILL.md lines 40-55` | `Enforced OKLCH-only color notation for all utility classes` |
| `Modified dark-mode-pairs.sh` | `Updated dark-mode lint check to catch missing OKLCH dark counterparts` |
| `feat(f0eda66): restructure toolkit` | `Restructured toolkit into per-component subdirectories` |
| `Added 3 bullets to Section 2` | `Added guidance on post-change compile verification` |

**Rules for automated generation:**
- Do NOT list file names or line numbers in changelog entries
- Do NOT copy commit message titles verbatim
- Do NOT dump raw git diff output
- DO summarize the user-meaningful outcome of a change
- DO aggregate multiple related commits into a single entry
- DO use verb-prefixed one-liners (Added, Changed, Fixed, Removed)

---

## Yanked Releases

A release is yanked when it contains a critical bug or breaking change that must not be consumed by new users. To mark a release as yanked, append `[YANKED]` after the date on the version header:

```markdown
## [1.2.0] - 2026-04-11 [YANKED]
```

Rules:
- The `[YANKED]` tag is appended directly after the date with a single space.
- The section body **must** include a brief explanation of why the release was yanked and, if applicable, which version to use instead.
- Do not delete the section — the entry must remain in the changelog for auditability.
- Update the comparison link at the bottom of the file as normal; yanking does not affect link structure.
