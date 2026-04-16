# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.4.1] - 2026-04-15

### Fixed

- Replaced the `remove` subcommand `argument-hint` angle-bracket placeholder with a
  bracket placeholder so the canonical definition passes deterministic `review-skill`
  lint in CI.

## [4.4.0] - 2026-04-15

### Changed

- Declared canonical `lifecycle` metadata in the shared root definition so the distribution catalog can publish maturity separately from per-tool availability for this skill.

- Updated shared wording to refer to `retro`, `review-skill`, and `improve` as cross-tool workflows rather than Claude-specific slash-command forms.
- Clarified improve workflow guidance for runtimes where helper scripts are unavailable,
  so missing script surfaces are treated as warnings instead of implicit fallback paths.
- `argument-hint` now uses bracket placeholders (`[rec-id]`) instead of angle brackets so
  the canonical definition passes the deterministic `review-skill` structural lint used in CI.
- Removed inline definition version ownership from the workflow. `improve` now records changes only in changelogs and explicitly treats any remaining inline version markers as legacy cleanup.

### Changed

- Step 2f now delegates CHANGELOG writes to the `/changelog` skill rather than writing entries inline; this ensures format consistency and keeps the SemVer bump logic in one place.

## [4.3.1] - 2026-04-15

### Fixed

- Replaced the `argument-hint` angle-bracket placeholder for the remove subcommand with a
  bracket placeholder so the frontmatter no longer trips `review-skill` lint rule `S06`.

## [4.3.0] - 2026-04-14

### Added

- `/improve remove <rec-id>` subcommand: additive removal primitive. Requires explicit one-word `yes` confirmation. Deletes rule text from host file using `anchor` locator, marks `status="removed"` in `~/.claude/metadata/rule-expiry.json`, bumps host file's frontmatter `# version:`, appends host changelog entry under `### Removed`.
- Expiry-aware pruning pass in step 5 (Final Quality Gate): reads `~/.claude/metadata/rule-expiry.json` and surfaces entries where `status="active"` AND `review_by < today`. Surfacer-only; does not auto-remove.
- Rule-expiry recording at step 2g (new substep): every accepted `fix` recommendation writes a `~/.claude/metadata/rule-expiry.json` entry with 90-day default `review_by`. Skipped for memory/reference files.
- Frontmatter `# version: 4.3.0` explicit version field, matching the retro skill's v4.2.2 precedent.

### Changed

- `argument-hint` updated: `"remove <rec-id> | [retro-output or recommendation] [--validate] [--skip-validation]"` (was: `"[retro-output or recommendation] [--validate] [--skip-validation]"`).

### Fixed

- Step 5 post-gate revert now rolls back the corresponding rule-expiry.json entry (sets status=reverted) to prevent orphan active entries when an accepted change fails the final lint gate.

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

- Historical note: v3.0 temporarily moved this skill into tool-local copies before root `skills/` was restored as canonical.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - Canonical shared-skill path normalized under root `skills/`
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

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/skill/improve-v4.4.1...HEAD
[4.4.1]: https://github.com/bmjcoding/agent-toolkit/compare/skill/improve-v4.4.0...skill/improve-v4.4.1
[4.4.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/improve-v4.3.1...skill/improve-v4.4.0
[4.3.1]: https://github.com/bmjcoding/agent-toolkit/compare/skill/improve-v4.3.0...skill/improve-v4.3.1
[4.3.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/improve-v4.2.1...skill/improve-v4.3.0
[4.2.1]: https://github.com/bmjcoding/agent-toolkit/compare/skill/improve-v4.2.0...skill/improve-v4.2.1
[4.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/improve-v4.1.0...skill/improve-v4.2.0
[4.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/improve-v4.0.0...skill/improve-v4.1.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/improve-v2.0.0...skill/improve-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/improve-v1.2.0...skill/improve-v2.0.0
[1.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/improve-v1.1.0...skill/improve-v1.2.0
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/improve-v1.0.0...skill/improve-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/skill/improve-v1.0.0
