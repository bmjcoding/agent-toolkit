# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.7.0] - 2026-04-12

### Added

- Diff-size guard for targeted-edit subtasks in Phase 2: after any subtask declared as footer-only, single-line-fix, or otherwise targeted completes, run `git diff --stat` on its owned files and compare the actual line delta against the declared budget; if the delta exceeds the budget by >50%, revert and re-dispatch with explicit budget constraints or surface to the user for approval (REC-10).

## [1.6.0] - 2026-04-12

### Added

- SESSION_ID generation in Phase 0: `date '+%Y%m%dT%H%M%S'` written via `printf '%s'` to `.orchestrator/session.id` at startup (CLAUD-005).
- Per-session directory isolation: all runtime paths now resolve under `.orchestrator/sessions/<SESSION_ID>/` when `session.id` is present. Handoffs, context, and logs are session-scoped (CLAUD-006).
- Pre-flight WIP audit in Phase 0: run `git status --short` before dispatching any agents; surface untracked and tracked-modified files not related to the current task; block planning until the user acknowledges or stashes prior-session WIP (REC-3).
- Post-truncation git status audit: after any agent returns without a handoff file, immediately run `git status --short`; if files outside the agent's `owned_files` are modified, stash or revert before continuing (REC-2).
- Haiku-eligible role roster: explicit table of 7 confirmed subtask roles (explore-skill, rules-backfill, integration-repair, doc-writer, quality-fix-targeted, subtask-repair, post-validation) that dispatch with `model: haiku` by default, based on pipeline performance data (REC-7).

### Changed

- Phase 4 backlog seed normalizes `source` field to lowercase (`ascii_downcase` + whitespace strip) before writing rows (CLAUD-008).
- SID format validated by regex `^[0-9]{8}T[0-9]{6}$` in Phase 4; malformed value logs a warning and falls back to empty string (sre-008/da-08).
- Phase 2 pre-flight checks for missing `session.id` and warns before group dispatch (sre-007).
- Phase 4 jq extraction validates each handoff file with `jq empty` before parsing; malformed JSON is skipped with `reason=malformed_json` logged to agents.log (sre-004).

### Fixed

- `eval echo` in retro file path replaced with safe `${retro_file/#\~/$HOME}` tilde expansion, eliminating shell injection risk (sec-high-1).
- `printf "%b"` in Phase 4 seed replaced with `printf '%s'` to prevent markdown row injection via `\n` in untrusted finding text (sec-med-3).

## [1.5.0] - 2026-04-12

### Added

- Failure Modes section with classifier outage fallback protocol — when three consecutive agent tool calls fail with classifier errors, emit user-facing recovery message and file user-applied handoff
- Scope constraint instruction for Phase 3a review agents — SRE, security-engineer, and integration-verifier dispatches must include owned_files scope bound from current plan.json
- Multi-repo branch staleness check in Phase 0 — fetch and status-b before creating secondary repo branch; prompt user if behind origin
- Autoresearch scope checklist for multi-repo toolkit pipelines — five required confirmation items (hook paths, settings state, uncommitted changes, branch status, CHANGELOG versions) before planning
- CHANGELOG backfill agents dispatch hint — template-following tasks use concise dispatch prompt; estimated $1.50 savings across 12-skill backfill batch
- doc-writer dispatch hint for Phase 5a — mechanical documentation tasks receive scope-constraining prompt to reduce unnecessary elaboration

## [1.4.0] - 2026-04-11

### Added

- Rename/grep-first rule: fix-agent dispatch prompts for rename findings must include a project-wide grep step to catch all occurrences before editing

### Changed

- Backlog routing now explicitly separates findings with `requires_human: true` into a dedicated "Needs Human Decision" section

## [1.3.0] - 2026-04-11

### Added

- Mechanical agent model override heuristic — dispatch purely mechanical agents at haiku tier to reduce cost

### Removed

- Changelog skill removed from frontmatter — changelog generation delegated to release-engineer

## [1.2.0] - 2026-04-11

### Added

- Explorer model override — read-only inventory agents dispatch as model: haiku
- Post-delivery changelog rule — release-engineer required after every post-delivery commit

## [1.1.0] - 2026-04-11

### Added

- Mandatory release-engineer routing for all commits in Ship phase
- Changelog skill added to skills list

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/claude-toolkit/compare/frankenstein-v1.7.0...HEAD
[1.7.0]: https://github.com/bmjcoding/claude-toolkit/compare/frankenstein-v1.6.0...frankenstein-v1.7.0
[1.6.0]: https://github.com/bmjcoding/claude-toolkit/compare/frankenstein-v1.5.0...frankenstein-v1.6.0
[1.5.0]: https://github.com/bmjcoding/claude-toolkit/compare/frankenstein-v1.4.0...frankenstein-v1.5.0
[1.4.0]: https://github.com/bmjcoding/claude-toolkit/compare/frankenstein-v1.3.0...frankenstein-v1.4.0
[1.3.0]: https://github.com/bmjcoding/claude-toolkit/compare/frankenstein-v1.2.0...frankenstein-v1.3.0
[1.2.0]: https://github.com/bmjcoding/claude-toolkit/compare/frankenstein-v1.1.0...frankenstein-v1.2.0
[1.1.0]: https://github.com/bmjcoding/claude-toolkit/compare/frankenstein-v1.0.0...frankenstein-v1.1.0
[1.0.0]: https://github.com/bmjcoding/claude-toolkit/tree/frankenstein-v1.0.0
