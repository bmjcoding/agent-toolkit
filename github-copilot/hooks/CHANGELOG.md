# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.2.0] - 2026-04-28

### Added

- Generated Copilot adapters for three new canonical hooks: `dispatch-validate/` (PreToolUse, validates Agent dispatch prompts), `post-agent-audit/` (SubagentStop, audits returning subagent scope), and `printf-lint/` (PostToolUse on Edit/Write of `*.sh`, runs printf-newlines linter). Each adapter delegates directly to the canonical root hook script via `run_root_hook`.
- Generated Copilot adapter for `git-signing-preflight/` (PreToolUse on Bash, verifies SSH/GPG signing key availability before `git commit -S` / `git tag -s` runs). Delegates to the canonical root hook via `run_root_hook`.

### Changed

- `post-agent-audit` adapter now also validates the returning agent's handoff JSON against the schema (severity enum, status enum, files_written type, agent_id format) via `validate-handoff.py`. Violations are recorded in the audit JSON the orchestrator inspects.
- Generated hook manifests now include explicit `timeoutMs` values and use the
  `AGENT_TOOLKIT_DIR` / `TOOLKIT_PATH` fallback when invoking toolkit hook adapters.


## [3.1.2] - 2026-04-17

### Fixed

- Generated Copilot hook adapters now preserve executable mode during adapter sync, and
  the smoke test asserts that the checked-in installer remains directly runnable.

## [3.1.1] - 2026-04-15

### Changed

- Updated `README.md` to keep the installed-layout guidance aligned with the nested
  manifest directories and to clarify that `extract-handoff` writes to the
  session-scoped handoff directory with a flat fallback when no valid session id exists.

## [3.1.0] - 2026-04-15

### Changed

- Rebased the Copilot hook surface on the canonical root `hooks/` tree and documented the
  generated manifest-plus-adapter layout as the intended runtime contract.
- Aligned the retained hook inventory to the final 7-hook set after removing the
  `toolkit-drift-check` and `toolkit-edit-reminder` maintenance hooks.

## [3.0.0] - 2026-04-12

### Added

- 9 hook JSON manifests and 9 shell scripts. Events: PreToolUse (branch-guard, changelog-check, pre-push-secrets, protect-config), PostToolUse (toolkit-edit-reminder), SubagentStart (inject-context), SubagentStop (extract-handoff, integrity-warn, toolkit-drift-check). Parity gap #3 Copilot resolved.

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/github-copilot-hooks-v3.2.0...HEAD
[3.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/github-copilot-hooks-v3.1.2...github-copilot-hooks-v3.2.0
[3.1.2]: https://github.com/bmjcoding/agent-toolkit/compare/github-copilot-hooks-v3.1.1...github-copilot-hooks-v3.1.2
[3.1.1]: https://github.com/bmjcoding/agent-toolkit/compare/github-copilot-hooks-v3.1.0...github-copilot-hooks-v3.1.1
[3.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/github-copilot-hooks-v3.0.0...github-copilot-hooks-v3.1.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/github-copilot-hooks-v3.0.0
