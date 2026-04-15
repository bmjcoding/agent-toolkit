# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Updated shared skill wording to reference workflow and skill names in a tool-agnostic way instead of assuming Claude slash-command invocation.
- Added a quick-routing section so simple changelog edits can load only the relevant sections instead of reading the full release workflow every time.
- Updated migration guidance so renumbering removes legacy inline `# version:` markers instead of trying to keep definition files in sync with released versions.

### Added

- `/changelog release` subcommand: one-shot atomic release flow — promotes `[Unreleased]` to a versioned header, commits, applies the per-component tag, and pushes. Replaces the multi-step manual sequence that release-engineer previously executed inline.

## [6.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [5.0.0] - 2026-04-12

### Changed

- Historical note: v3.0 temporarily moved this skill into tool-local copies before root `skills/` was restored as canonical.

## [4.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - Canonical shared-skill path normalized under root `skills/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [3.0.0] - 2026-04-12

### Changed

- Restructured skill into progressive-disclosure layout: `SKILL.md` trimmed to a ~200-line entry point covering the common-case rules (header, version format, categories, per-component tags, GitHub compare links, [Unreleased] workflow, SemVer bump table, routing, gotchas); deep-dive content moved to dedicated reference files
- Shortened skill description to fit under the 250-char listing threshold and added explicit "Use when…" trigger context so the skill loads on the right prompts
- Bumped metadata version to 3.0.0 reflecting the structural rewrite (per the SemVer bump table in SKILL.md)

### Added

- `references/platform-urls.md` with full GitHub / GitLab / Bitbucket Cloud / Bitbucket Datacenter compare-URL templates (previously inline in SKILL.md)
- `references/anti-patterns.md` consolidating the anti-patterns table, the commit-log-vs-changelog rules, and the yanked-release procedure
- `references/migration.md` with the monolithic-to-per-component tag migration procedure and the version renumbering steps
- `references/enforcement.md` documenting the three drift-prevention layers and the commit classification table for automated entry generation
- `scripts/detect-platform.sh` detecting the hosting platform from `git remote` with `.changelog-platform.yml` override (previously referenced from SKILL.md but missing — S08 lint error)
- `scripts/backfill-changelog-tags.sh` backfilling per-component git tags from an existing CHANGELOG.md during monolithic-to-per-component tag migration (previously referenced but missing — S08 lint error)
- `argument-hint` frontmatter field pointing at the target CHANGELOG.md path, so user-invocable runs route input correctly

### Fixed

- Two S08 lint errors caused by `SKILL.md` referencing `scripts/detect-platform.sh` and `scripts/backfill-changelog-tags.sh` that did not exist on disk
- Q01 lint warning (description over 250 chars)
- Q02 lint warning (description lacked trigger context)
- Q05 lint warning (no `references/` directory despite body length)
- Q12 lint warning (disable-model-invocation with no `$ARGUMENTS` slot)

## [2.0.0] - 2026-04-12

### Changed

- Switched comparison link footer format from monolithic repo tags (`v1.0.0`) to per-component dash-style tags (`changelog-v1.0.0`); all existing footers using `vX.Y.Z` are now non-conformant
- Tag view URL for the initial version now uses `tree/` path instead of `releases/tag/` (no GitHub Release object exists for this component)

### Added

- Per-Component Tag Format section defining the canonical `{slug}-v{version}` format, slug-derivation rules, collision-handling, and a complete example table
- Platform URL Formats sub-section with compare-URL templates for GitHub, GitLab, Bitbucket Cloud, and Bitbucket Datacenter (including verified/unverified status for each)
- [Unreleased] Workflow sub-section documenting who triggers a release cut, when, monorepo scope, and the required atomicity ordering (edit → commit → tag → push)
- Rule: when no VCS tag has been pushed for a component yet, omit compare links and document the omission with an inline comment rather than emitting broken URLs
- Yanked Releases section defining the `[YANKED]` marker and requirements for section body explanation and link retention

### Fixed

- Anti-patterns table was missing entries for: non-existent tag references, monolithic tags in monorepo context, wrong-platform URLs, omitted Deprecated entries, and future/guessed release dates

## [1.2.0] - 2026-04-11

### Added

- Commit Logs vs. Changelog Entries section with explicit no-commit-log-dump rules and a good/bad comparison table
- Drift-Prevention Enforcement section documenting Layer 1 (drift-check hook), Layer 2 (edit-reminder hook), and Layer 3 (/sync-toolkit command)

## [1.1.0] - 2026-04-11

### Added

- Version Renumbering section with required 4-step procedure for gap compression including mandatory definition file version comment update

## [1.0.0] - 2026-04-11

### Added

- Initial changelog skill defining Keep a Changelog 1.1.0 + SemVer standard for all toolkit components

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/skill/changelog-v6.0.0...HEAD
[6.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/changelog-v5.0.0...skill/changelog-v6.0.0
[5.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/changelog-v4.0.0...skill/changelog-v5.0.0
[4.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/changelog-v3.0.0...skill/changelog-v4.0.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/changelog-v2.0.0...skill/changelog-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/changelog-v1.2.0...skill/changelog-v2.0.0
[1.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/changelog-v1.1.0...skill/changelog-v1.2.0
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/changelog-v1.0.0...skill/changelog-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/skill/changelog-v1.0.0
