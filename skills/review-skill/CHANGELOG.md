# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [5.1.0] - 2026-04-15

### Changed

- Declared canonical `lifecycle` metadata in the shared root definition so the distribution catalog can publish maturity separately from per-tool availability for this skill.

- Updated shared review guidance to refer to `retro`, `review-skill`, and `improve` as generic workflows rather than Claude-only slash-command forms.
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

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/skill/review-skill-v5.1.0...HEAD
[5.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/review-skill-v5.0.0...skill/review-skill-v5.1.0
[5.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/review-skill-v4.0.0...skill/review-skill-v5.0.0
[4.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/review-skill-v3.0.0...skill/review-skill-v4.0.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/review-skill-v2.0.0...skill/review-skill-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/review-skill-v1.1.0...skill/review-skill-v2.0.0
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/review-skill-v1.0.0...skill/review-skill-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/skill/review-skill-v1.0.0
