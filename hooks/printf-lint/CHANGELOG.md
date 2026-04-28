# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-04-28

### Changed

- Resolves `lint-printf-newlines.sh` through toolkit helper paths instead of a
  Claude-local script path, and reports a hook failure when the helper is missing.

## [1.0.0] - 2026-04-27

### Added

- PostToolUse hook for `Edit`/`Write`/`MultiEdit` operations on `*.sh` and `*.bash`
  files. Runs `~/.claude/scripts/lint-printf-newlines.sh` against the modified file
  and emits findings on stderr when the printf format/accumulator pairing is unsafe.
  Catches both `printf '%b'` (escape-interpreting injection surface) and `printf '%s'`
  paired with literal-`\n` accumulators class-of-error. Non-blocking; raises
  visibility without reverting the edit.
