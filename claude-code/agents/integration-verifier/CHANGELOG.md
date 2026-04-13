# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: restructured for v3.0 per-tool layout. Claude Code remains under `claude-code/` with all components fully self-contained. Rules and skills relocated to `claude-code/rules/` and `claude-code/skills/` (away from root).

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `agents/integration-verifier/` → `claude-code/agents/integration-verifier/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.3.0] - 2026-04-12

### Added

- Tool-use soft budget: agent self-halts at 30 tool uses and emits a `partial` handoff with verification findings-so-far rather than running over budget (REC-8).

## [1.2.0] - 2026-04-11

### Added

- Full-pass requirement: verification must cover all contracts and owned files before writing the handoff — inline fixes do not terminate the pass early

### Changed

- Partial verdict criteria narrowed: emit `partial` only when the compilation tool is unavailable, not when findings exist or inline fixes were applied

## [1.1.0] - 2026-04-11

### Added

- Add full-pass requirement: verify all contracts before writing handoff, do not stop after inline fix

### Changed

- Narrow partial verdict criteria: emit partial only when compilation tool is unavailable, not when findings exist

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/integration-verifier-v3.0.0...HEAD
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/integration-verifier-v2.0.0...claude-code/integration-verifier-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/integration-verifier-v1.3.0...claude-code/integration-verifier-v2.0.0
[1.3.0]: https://github.com/bmjcoding/agent-toolkit/compare/integration-verifier-v1.2.0...integration-verifier-v1.3.0
[1.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/integration-verifier-v1.1.0...integration-verifier-v1.2.0
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/integration-verifier-v1.0.0...integration-verifier-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/integration-verifier-v1.0.0
