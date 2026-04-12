# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-04-12

### Added

- Write-scope constraint: agent is restricted to modifying only files listed in `owned_files`; findings on out-of-scope files are reported but not auto-fixed (REC-1).
- Context-isolation guard: encountering unrelated spec documents during review does not trigger implementation of those specs; agent stays within its assigned subtask boundary (REC-5).
- Tool-use soft budget: agent self-halts at 30 tool uses and emits a `partial` handoff with findings-so-far rather than running over budget (REC-8).

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/claude-toolkit/compare/site-reliability-engineer-v1.2.0...HEAD
[1.2.0]: https://github.com/bmjcoding/claude-toolkit/compare/site-reliability-engineer-v1.1.0...site-reliability-engineer-v1.2.0
[1.0.0]: https://github.com/bmjcoding/claude-toolkit/releases/tag/v1.0.0
