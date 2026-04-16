# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Replaced Python vulnerability audit guidance with `uvx pip-audit` so the workflow no
  longer assumes `pip`-managed tooling.

## [4.2.0] - 2026-04-15

### Changed

- Declared canonical `lifecycle` metadata in the shared root definition so the distribution catalog can publish maturity separately from per-tool availability for this workflow.

## [4.1.0] - 2026-04-15

### Changed

- Declared the shared argument hint in the canonical root workflow definition so command usage metadata is generated from the source of truth instead of copied back from adapters.

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: restructured for v3.0 per-tool layout. Claude Code remains under `claude-code/` for tool-native assets. At that point in history, shared rules and skills were described as living under `claude-code/rules/` and `claude-code/skills/`.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `commands/lint/` → `claude-code/commands/lint/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/workflow/lint-v4.2.0...HEAD
[4.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/workflow/lint-v4.1.0...workflow/lint-v4.2.0
[4.1.0]: https://github.com/bmjcoding/agent-toolkit/tree/workflow/lint-v4.1.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/workflow/lint-v2.0.0...workflow/lint-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/workflow/lint-v1.0.0...workflow/lint-v2.0.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/workflow/lint-v1.0.0
