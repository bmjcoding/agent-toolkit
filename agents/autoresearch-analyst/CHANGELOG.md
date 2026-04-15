# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Declared shared execution metadata in the canonical root definition so model tier, capabilities, subagent routing, and skill dependencies no longer need to be inferred from tool-specific wrappers.

- Moved the canonical agent definition and changelog to `agents/autoresearch-analyst/`; Claude, Copilot, and Codex files are now tool-specific adapters generated from the shared source.
- Updated comparison links to use the shared `agent/autoresearch-analyst` tag namespace for this root canonical component.

### Removed

- Removed the redundant Claude-specific changelog copy from `claude-code/agents/autoresearch-analyst/CHANGELOG.md`.

## [5.1.1] - 2026-04-14

### Changed
- Factored standard 4-bullet untrusted-data prelude and instruction sandwich out to `improve/references/security-preamble.md`. Agent-specific preamble, rules, and runaway guard remain inline.
- Added 2-3 sentence agent-specific framing paragraph in Untrusted Data Boundary section to complement the shared preamble pointer.

## [5.1.0] - 2026-04-14

### Changed

- A-1: Consolidated six mode-specific handoff schemas (retro, improve, review, full-cycle, on-demand, error) into one canonical schema block with a mode-notes table. All field names preserved exactly; only structural repetition removed.
- A-2: Removed stale hardcoded figures ("57 files", "maxTurns=80") from the improve batch sizing gotcha. Replaced with a general threshold statement (split when a domain exceeds 20 files).

### Added

- A-3: Runaway guard for maxTurns: 200 — emits `RUNAWAY GUARD: exceeded 190 tool calls. Stopping.` if > 190 tool calls complete without a handoff block.

## [5.0.1] - 2026-04-14

### Fixed

- Improve mode handoff: added `truncated` boolean to `file_diffs` entry shape (`{file, unified_diff_truncated, truncated}`), mirroring the fix-improve-truncation contract addition.
- Improve mode handoff: confirmed `recommendations_applied` and `recommendations_reverted` are present as required top-level array-of-strings fields (per improve/SKILL.md step 7 and PR #17 canonicalization).

## [5.0.0] - 2026-04-14

### Changed

- BREAKING: Review mode handoff `results[].required_changes` type changed from integer (count) to array of objects `{what, where, why, priority, type}` to match review-skill JSON output schema (D1-1). Consumers must read `required_changes.length` to obtain the count.
- Full-cycle mode handoff `review_results[].required_changes` updated to the same array-of-objects shape for consistency with the review mode handoff.
- Improve mode handoff: added `file_diffs` field (array of `{file, unified_diff_truncated}` objects) matching improve/SKILL.md step 7 schema (D1-3).

## [4.1.1] - 2026-04-14

### Added

- Conflict-check baseline gotcha: conflict checks must compare committed HEAD vs. origin/main (not working tree vs. origin/main) to avoid false conflict signals from uncommitted session changes

## [4.1.0] - 2026-04-13

### Changed

- Retro handoff envelope: added `metrics` sub-object with five fields (`frankenstein_line_count`, `dispatcher_tokens_estimated`, `dispatch_count`, `avg_dispatch_prompt_tokens`, `net_line_delta`) to synchronize with retro/references/finalization.md canonical schema (C-1).
- Improve handoff envelope: verified `model_recommendations` and `recommendations_applied` field names match improve/SKILL.md step 7 canonical schema (C-4). Corrected any name mismatches.

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: restructured for v3.0 per-tool layout. Claude Code remains under `claude-code/` for tool-native assets. At that point in history, shared rules and skills were described as living under `claude-code/rules/` and `claude-code/skills/`.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `agents/autoresearch-analyst/` → `claude-code/agents/autoresearch-analyst/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.5.0] - 2026-04-12

### Added

- `on-demand` mode: fallback workflow for freeform user requests (e.g., "the changelog skill is too verbose, split it up"). Resolves target from the prompt, runs review-skill inline, then iterates with improve when the verdict is NEEDS WORK. Preserves explicit mode keywords as fast paths.

### Changed

- Error handoff reason renamed from `unrecognized_mode` to `unresolvable_target`; now fires only when no target can be extracted from the prompt. Includes a `hint` field directing the caller to either a mode keyword or a target identifier.

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/agent/autoresearch-analyst-v5.1.1...HEAD
[5.1.1]: https://github.com/bmjcoding/agent-toolkit/compare/agent/autoresearch-analyst-v5.1.0...agent/autoresearch-analyst-v5.1.1
[5.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/autoresearch-analyst-v5.0.1...agent/autoresearch-analyst-v5.1.0
[5.0.1]: https://github.com/bmjcoding/agent-toolkit/compare/agent/autoresearch-analyst-v5.0.0...agent/autoresearch-analyst-v5.0.1
[5.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/autoresearch-analyst-v4.1.1...agent/autoresearch-analyst-v5.0.0
[4.1.1]: https://github.com/bmjcoding/agent-toolkit/compare/agent/autoresearch-analyst-v4.1.0...agent/autoresearch-analyst-v4.1.1
[4.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/autoresearch-analyst-v4.0.0...agent/autoresearch-analyst-v4.1.0
[4.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/autoresearch-analyst-v3.0.0...agent/autoresearch-analyst-v4.0.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/autoresearch-analyst-v2.0.0...agent/autoresearch-analyst-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/autoresearch-analyst-v1.5.0...agent/autoresearch-analyst-v2.0.0
[1.5.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/autoresearch-analyst-v1.4.3...agent/autoresearch-analyst-v1.5.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/agent/autoresearch-analyst-v1.0.0
