# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-04-12

### Changed

- Step 2c (eval smoke test) now delegates the test-case matching heuristic to `references/eval-matching.md`; SKILL.md carries only the pointer and the 2-minute budget. The new reference consolidates the first-match-wins keyword rules and the five exit labels (`pass` / `fail` / `not applicable` / `stale` / `skipped`) that improve reports emit.
- Step 2e (version bump) now delegates the bump table, tiebreaker, and initialization rule to `references/version-bump.md`; SKILL.md carries only the pointer. The reference notes that the canonical source is `skills/changelog/SKILL.md` — SemVer Bump Table (the changelog skill wins if the two ever diverge).

### Added

- `references/eval-matching.md` — eval test case matching heuristic, budget, and the five exit-label branches
- `references/version-bump.md` — SemVer bump table, tiebreaker, initialization rule, and cross-reference to the canonical changelog-skill table

### Removed

- "Eval test cases may be stale" gotcha from SKILL.md (content relocated to `references/eval-matching.md` → Exit Branches table as the `eval: stale` row)

## [1.1.0] - 2026-04-11

### Changed

- Updated SKILL.md routing logic and eval test cases to reflect subdirectory layout

### Fixed

- Changelog routing updated to use per-component subdirectory paths instead of aggregated category-level changelogs

### Added

- Hooks and rules added to changelog routing (were missing entirely)
- Claude Code changelog format specification added

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/improve-v1.2.0...HEAD
[1.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/improve-v1.1.0...improve-v1.2.0
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/improve-v1.0.0...improve-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/improve-v1.0.0
