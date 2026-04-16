# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Session-aware handoff wiring is now documented and emitted consistently across the Copilot hook surface: `inject-context.sh` points agents at the resolved session-scoped handoff directory, and `extract-handoff.sh` documents the same session-first write target with flat fallback semantics.

## [3.0.0] - 2026-04-12

### Added

- 9 hook JSON manifests and 9 shell scripts. Events: PreToolUse (branch-guard, changelog-check, pre-push-secrets, protect-config), PostToolUse (toolkit-edit-reminder), SubagentStart (inject-context), SubagentStop (extract-handoff, integrity-warn, toolkit-drift-check). Parity gap #3 Copilot resolved.

<!-- No tags pushed yet for this component — compare links omitted until first tag -->
