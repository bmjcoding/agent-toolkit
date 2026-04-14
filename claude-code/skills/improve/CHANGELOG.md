# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.2.1] - 2026-04-14

### Changed

- Step 7 `file_diffs` entry shape: `unified_diff_truncated` now holds diff content only (no trailing `[truncated at 200 lines]` sentinel). Added sibling boolean field `truncated` (`true` when diff was cut at 200 lines, `false` otherwise). Diff parsers no longer receive embedded plain-text annotations inside the diff string.

## [4.2.0] - 2026-04-14

### Added

- Step 7 schema: `file_diffs` field (array of `{file, unified_diff_truncated}` objects, max 200 lines per diff). Enables retros to grep expected post-state from improve artifacts without re-reading target files. Use empty array `[]` for pattern-only runs.

## [4.1.0] - 2026-04-13

### Changed

- Step 7 schema: `model_recommendations` field promoted from implicit (JSON example only) to explicitly documented in prose. Required to be included as a top-level array field (empty array `[]` when no recommendations). Resolves schema drift vs. autoresearch-analyst.md improve handoff envelope.
- Step 7 schema: `recommendations_applied` and `recommendations_reverted` documented as required top-level array fields in prose, not just JSON example.

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: copied from root `skills/` to `claude-code/skills/` in v3.0 per-tool restructure. Root `skills/` deleted.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `skills/improve/` → `shared/skills/improve/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

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

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/improve-v4.2.1...HEAD
[4.2.1]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/improve-v4.2.0...claude-code/improve-v4.2.1
[4.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/improve-v4.1.0...claude-code/improve-v4.2.0
[4.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/improve-v4.0.0...claude-code/improve-v4.1.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/shared/improve-v2.0.0...claude-code/improve-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/shared/improve-v1.2.0...shared/improve-v2.0.0
[1.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/shared/improve-v1.1.0...shared/improve-v1.2.0
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/shared/improve-v1.0.0...shared/improve-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/improve-v1.0.0
