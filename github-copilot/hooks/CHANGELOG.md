# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/github-copilot-hooks-v3.1.1...HEAD
[3.1.1]: https://github.com/bmjcoding/agent-toolkit/compare/github-copilot-hooks-v3.1.0...github-copilot-hooks-v3.1.1
[3.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/github-copilot-hooks-v3.0.0...github-copilot-hooks-v3.1.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/github-copilot-hooks-v3.0.0
