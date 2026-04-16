# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Session-aware handoff wiring is now documented and emitted consistently across the Codex hook surface: `inject-context.sh` points agents at the resolved session-scoped handoff directory, and `extract-handoff.sh` documents the same session-first write target with flat fallback semantics.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: `hooks.json` completely rewritten to match the official Codex hooks format. The previous flat structure `{matcher, script, description}` was non-functional; the file now uses a nested `hooks` key with event-keyed arrays of matcher-group objects containing `{type: command, command: ...}` handlers. Parity gap #1 Codex (CRITICAL) resolved.

<!-- No tags pushed yet for this component — compare links omitted until first tag -->
