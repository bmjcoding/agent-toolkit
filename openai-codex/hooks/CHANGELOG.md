# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.3.0] - 2026-04-30

### Added

- Generated Codex adapters for three new canonical hooks: `drift-check/` (PreToolUse, matcher `Agent|Task`), `preflight/` (SessionStart, matcher `.*`), and `validate-plan/` (Stop, matcher `.*`). Each adapter delegates to the canonical root hook script. `hooks.json` registry updated with entries in the correct event buckets.

### Fixed

- `renderCodexHooksJson()` now initialises `SessionStart` and `SubagentStart` keys in its grouped object so hooks that carry those event types (e.g. `preflight`) no longer crash the generator with `TypeError: Cannot read properties of undefined (reading 'push')`.
- `smoke-generated-assets.js` `assertCodexHookInstallContract` now scans `SessionStart` and `SubagentStart` buckets in addition to the original four, so hooks in those buckets are properly covered by the smoke test.

## [3.2.0] - 2026-04-28

### Added

- Generated Codex adapters for three new canonical hooks: `dispatch-validate/` (PreToolUse, matcher `.*`), `post-agent-audit/` (Stop, matcher `.*`), and `printf-lint/` (PostToolUse, matcher `.*`). Each adapter delegates directly to the canonical root hook script. `hooks.json` registry updated with the corresponding entries.
- Generated Codex adapter for `git-signing-preflight/` (PreToolUse, matcher `Bash`). Verifies signing key availability before `git commit -S` / `git tag -s` runs. Delegates to the canonical root hook script. `hooks.json` registry updated.

### Changed

- `post-agent-audit` adapter now also validates the returning agent's handoff JSON against the schema via `validate-handoff.py`. Violations are recorded in the audit JSON the orchestrator inspects.
- The generated `hooks.json` registry now includes explicit `timeoutMs` values for
  every hook command.

## [3.1.2] - 2026-04-17

### Fixed

- Generated Codex hook adapters now preserve executable mode during adapter sync, and
  the install docs call out the one-time permission repair path for older checkouts.

## [3.1.1] - 2026-04-15

### Fixed

- Clarified the Codex hook installation contract so the documented manual setup matches
  the generated fallback runtime layout under `~/.codex/openai-codex/hooks/`.

## [3.1.0] - 2026-04-15

### Changed

- Rebased the Codex hook surface on the canonical root `hooks/` tree and documented the
  generated adapter-plus-`hooks.json` layout as the intended runtime contract.
- Aligned the active Codex hook registry to the final 7-hook set after removing the
  `toolkit-drift-check` and `toolkit-edit-reminder` maintenance hooks.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: `hooks.json` completely rewritten to match the official Codex hooks format. The previous flat structure `{matcher, script, description}` was non-functional; the file now uses a nested `hooks` key with event-keyed arrays of matcher-group objects containing `{type: command, command: ...}` handlers. Parity gap #1 Codex (CRITICAL) resolved.
