---
name: changelog
description: >
  Canonical changelog standard for all toolkit components. Defines Keep a Changelog 1.1.0
  + SemVer format, required header block, version section rules, change categories,
  comparison links, SemVer bump table, and commit classification. Read this before
  writing any CHANGELOG.md in the toolkit.
disable-model-invocation: true
metadata:
  version: 1.0.0
---

# Changelog Standard

This skill is the canonical definition of the changelog format for every component in the
claude-toolkit ecosystem (agents, skills, commands, hooks, rules). Read it before creating
or editing any `CHANGELOG.md`.

## Standards

- **Keep a Changelog 1.1.0**: https://keepachangelog.com/en/1.1.0/
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

## Comparison Links

Place reference-style link definitions at the **bottom** of the file:

```markdown
[Unreleased]: https://github.com/bmjcoding/claude-toolkit/compare/vX.Y.Z...HEAD
[X.Y.Z]: https://github.com/bmjcoding/claude-toolkit/compare/vX.Y.Z-1...vX.Y.Z
[1.0.0]: https://github.com/bmjcoding/claude-toolkit/releases/tag/v1.0.0
```

Rules:
- `[Unreleased]` compares the latest tag to `HEAD`.
- Each released version compares to its predecessor.
- The oldest release uses a `releases/tag/` URL (no predecessor to diff against).
- Base URL for all toolkit components: `https://github.com/bmjcoding/claude-toolkit`

---

## [Unreleased] Workflow

Always maintain `## [Unreleased]` at the top of the version list, above all released versions.
It accumulates changes that are merged but not yet tagged.

When cutting a release:
1. Rename `## [Unreleased]` to `## [X.Y.Z] - YYYY-MM-DD`.
2. Add or update the comparison link for the new version at the bottom.
3. Update `[Unreleased]` link to compare the new tag to `HEAD`.
4. Add a new empty `## [Unreleased]` above the newly named section.

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

---

## Anti-patterns

| Anti-pattern | Why it fails |
|---|---|
| `## X.Y.Z` without brackets | Breaks tooling that parses `## [x.y.z]` format |
| Non-ISO dates (e.g., `04/05/26`) | Ambiguous and unacceptable |
| No `## [Unreleased]` section | Forces readers to diff branches to see in-progress work |
| Missing comparison links | Breaks changelog-as-navigation; diffs are one click away |
| Version gaps (1.0.0 to 1.3.0 without 1.1.0 and 1.2.0) | Implies undocumented changes; reconstruct or renumber |
| Commit-log dumps (`git log`) | Noise; conflates internal churn with user-facing change |
| Lumping unrelated changes | One bullet = one idea; avoid "and also fixed X" entries |
| `## [1.0.1] - 2025-04-11 [YANKED]` without explanation | Yanked releases must explain why in the section body |
| Version comment in definition file not updated after renumbering | Leaves definition file reporting a version that does not match the CHANGELOG |

When renumbering versions to eliminate gaps (e.g., compressing 1.0.0 → 1.5.0 down to 1.0.0 → 1.3.0), also update any `# version:` comment in the component's definition file (e.g., `frankenstein.md`, `planner.md`) to match the new latest version. The version comment is the single source of truth visible to agents loading the definition — a mismatch between it and the CHANGELOG causes confusion about which feature set is loaded.

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
