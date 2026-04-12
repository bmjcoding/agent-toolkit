# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-04-11

### Added

- PreToolUse hook that injects a CHANGELOG reminder when agents edit toolkit component files
- Scope filter targets agents, skills, hooks, commands, and rules directories in claude-toolkit and ~/.claude
- No-op when editing CHANGELOG.md itself to avoid recursive reminders

[Unreleased]: https://github.com/bmjcoding/claude-toolkit/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/bmjcoding/claude-toolkit/releases/tag/v1.0.0
