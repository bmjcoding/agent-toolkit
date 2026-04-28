# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-04-28

### Changed

- Resolves `dispatch-validator.py` through toolkit helper paths instead of a
  Claude-local script path, and fails closed when the validator helper is missing.

## [1.0.0] - 2026-04-27

### Added

- PreToolUse hook for `Agent`/`Task` dispatches that validates the dispatch prompt
  against three classes of error programmatically: forbidden retro combinations,
  missing retro suppression on non-retro dispatches, and missing mode words on
  autoresearch-analyst targets. Delegates to `~/.claude/scripts/dispatch-validator.py`
  so the rule has one update site. Denies the dispatch on P0/P1 findings.

[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/hook/dispatch-validate-v1.0.0...hook/dispatch-validate-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/hook/dispatch-validate-v1.0.0
