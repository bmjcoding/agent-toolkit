# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/retro-v3.0.0...HEAD
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/shared/retro-v2.0.0...claude-code/retro-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/shared/retro-v1.1.0...shared/retro-v2.0.0
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/shared/retro-v1.0.0...shared/retro-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/retro-v1.0.0
