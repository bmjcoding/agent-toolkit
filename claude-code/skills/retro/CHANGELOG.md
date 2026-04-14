# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.1.0] - 2026-04-13

### Added

- `metrics` block in retro output JSON schema: five new fields (`frankenstein_line_count`, `dispatcher_tokens_estimated`, `dispatch_count`, `avg_dispatch_prompt_tokens`, `net_line_delta`) added to finalization.md metric fields table.
- Trajectory check step in Trends section: reads last 5 `frankenstein_line_count` values, flags monotonic growth as P1, bakes `net_growth_flag: true` soft budget warning when `net_line_delta > 0`.
- Markdown summary table updated to include all five new metric rows.

## [4.0.1] - 2026-04-13

### Fixed

- `scripts/parse-metrics.py`: null-token guard added around `sum(e.get("tokens", ...) ...)` aggregation — entries with missing `tokens` keys are now filtered out instead of contributing 0, producing an accurate total (Rec #2 from retro 20260413T211547; improve agent falsely claimed fix was pre-existing, Phase A audit confirmed it was not applied until this run).

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: copied from root `skills/` to `claude-code/skills/` in v3.0 per-tool restructure. Root `skills/` deleted.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `skills/retro/` → `shared/skills/retro/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.1.0] - 2026-04-11

### Changed

- Updated retro scripts (parse-metrics.py, retro-history.py, verify-claims.py), evals, and reference files (finalization.md, system-architecture.md) for subdirectory layout

### Added

- Plan inventory accuracy check to orchestration-deep-dive.md Plan Quality section
- Handoff schema contract note in orchestration-deep-dive.md Coordination section — `files_written` must be array not integer
- Security-engineer scope heuristic in orchestration-deep-dive.md Model Selection section — early-exit pattern for docs-only changesets

### Fixed

- parse-metrics.py: handle `files_written` integer gracefully (treat as empty list) instead of crashing with TypeError

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/retro-v4.1.0...HEAD
[4.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/retro-v4.0.1...claude-code/retro-v4.1.0
[4.0.1]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/retro-v4.0.0...claude-code/retro-v4.0.1
[4.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/retro-v3.0.0...claude-code/retro-v4.0.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/shared/retro-v2.0.0...claude-code/retro-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/shared/retro-v1.1.0...shared/retro-v2.0.0
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/shared/retro-v1.0.0...shared/retro-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/retro-v1.0.0
