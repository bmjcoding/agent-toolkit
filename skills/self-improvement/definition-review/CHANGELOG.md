# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [6.2.0] - 2026-04-28

### Changed

- Replaced Claude-specific argument metadata and placeholder guidance with a
  portable `## Inputs` contract for targets and JSON output mode.
- Updated `lint-definition.py` rule `Q12` to accept `## Inputs` as the preferred
  portable input contract while preserving `$ARGUMENTS` as legacy compatibility.

## [6.1.0] - 2026-04-28

### Changed

- Updated linter invocation guidance to prefer Claude's active skill directory
  substitution before falling back to repo, project-local, and user-global installs.

## [6.0.0] - 2026-04-28

### Changed

- BREAKING: Renamed the shared definition quality gate to `definition-review`
  and updated invocation examples, eval prompts, linter discovery paths,
  generated catalog references, and CI workflow paths.

## [5.5.0] - 2026-04-28

### Added

- Added a repo-level linter wrapper entrypoint and updated examples for
  categorized skill paths.

### Fixed

- Fixed definition linter path detection so relative `agents/...` targets are
  classified as agents and repo-root `scripts/...` references resolve correctly.
- Reduced false-positive definition warnings for canonical shared agents that
  declare generated adapter metadata instead of Claude-only runtime fields.

## [5.4.0] - 2026-04-28

### Added

- Added `S13` duplicate-frontmatter-key validation to `lint-definition.py`.

## [5.3.0] - 2026-04-16

### Changed

- Added structural validation for shared-skill `dependencies:` frontmatter entries and allowlisted the field so malformed typed dependency references fail lint cleanly.

## [5.2.0] - 2026-04-16

### Changed

- Reworded batch-review and JSON-output guidance so direct invocation and generic automation are first-class, with delegation treated as optional.

## [5.1.1] - 2026-04-15

### Fixed

- Removed stale import noise from `scripts/lint-definition.py` so the shared definition-review
  tooling passes the new repo-wide Ruff baseline cleanly.

## [5.1.0] - 2026-04-15

### Changed

- Declared canonical `lifecycle` metadata in the shared root definition so the distribution catalog can publish maturity separately from per-tool availability for this skill.

- Updated shared review guidance to refer to `retro`, `definition-review`, and `improve` as generic workflows rather than Claude-only slash-command forms.
- Removed inline definition-version enforcement from `lint-definition.py`; released version tracking now lives in component changelogs only.

## [5.0.0] - 2026-04-14

### Added

- JSON output mode (`--format json`): new `### JSON Output Mode` subsection in the Output section specifying the machine-readable schema for review verdicts.
- `required_changes` field in JSON output is an **array of objects** (each with `what`, `where`, `why`, `priority`, `type`), not an integer count. This is the authoritative shape for the field.

### Changed

- BREAKING: `required_changes` type in the JSON output schema is array-of-objects, not integer. Consumers that read `required_changes` as an integer count must migrate to reading `required_changes.length` instead.

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

## [1.1.0] - 2026-04-11

### Changed

- Updated lint-definition.py script and evals for new subdirectory layout
- Revised Q-warning handling: Q-code warnings now required in Required Changes table, not silently absorbed into Lint Results

## [1.0.0] - 2026-04-11

### Added

- Initial release
