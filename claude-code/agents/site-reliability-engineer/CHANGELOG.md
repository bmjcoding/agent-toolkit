# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: restructured for v3.0 per-tool layout. Claude Code remains under `claude-code/` with all components fully self-contained. Rules and skills relocated to `claude-code/rules/` and `claude-code/skills/` (away from root).

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `agents/site-reliability-engineer/` → `claude-code/agents/site-reliability-engineer/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.3.0] - 2026-04-12

### Added

- Finding discipline section: `findings[]` must contain only actionable items; verified-correct observations belong in `findings_resolved[]` or `notes`. Non-actionable confirmations ("No issue", "Correct as designed") are prohibited in `findings[]`. (R5 from retro 2026-04-12T150000)

## [1.2.0] - 2026-04-12

### Added

- Write-scope constraint: agent is restricted to modifying only files listed in `owned_files`; findings on out-of-scope files are reported but not auto-fixed (REC-1).
- Context-isolation guard: encountering unrelated spec documents during review does not trigger implementation of those specs; agent stays within its assigned subtask boundary (REC-5).
- Tool-use soft budget: agent self-halts at 30 tool uses and emits a `partial` handoff with findings-so-far rather than running over budget (REC-8).

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/site-reliability-engineer-v3.0.0...HEAD
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/site-reliability-engineer-v2.0.0...claude-code/site-reliability-engineer-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/site-reliability-engineer-v1.3.0...claude-code/site-reliability-engineer-v2.0.0
[1.3.0]: https://github.com/bmjcoding/agent-toolkit/compare/site-reliability-engineer-v1.2.0...site-reliability-engineer-v1.3.0
[1.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/site-reliability-engineer-v1.0.0...site-reliability-engineer-v1.2.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/site-reliability-engineer-v1.0.0
