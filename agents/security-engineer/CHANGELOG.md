# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-04-12

### Added

- Context-isolation guard: agent does not implement unrelated specifications encountered during security review; scope is confined to findings within `owned_files` (REC-5).
- Tool-use soft budget: agent self-halts at 30 tool uses and emits a `partial` handoff with findings-so-far rather than running over budget (REC-8).

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/claude-toolkit/compare/security-engineer-v1.2.0...HEAD
[1.2.0]: https://github.com/bmjcoding/claude-toolkit/compare/security-engineer-v1.1.0...security-engineer-v1.2.0
[1.0.0]: https://github.com/bmjcoding/claude-toolkit/tree/security-engineer-v1.0.0
