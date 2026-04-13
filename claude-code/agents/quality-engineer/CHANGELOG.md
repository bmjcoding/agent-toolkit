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
  - `agents/quality-engineer/` → `claude-code/agents/quality-engineer/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.3.0] - 2026-04-12

### Added

- Printf/accumulation end-to-end check in Remediation mode: when applying security fixes that modify `printf` format specifiers (e.g., `printf "%b"` -> `printf '%s'`), also verify accumulation variables use `$'\n'` (ANSI-C quoting) not literal `\n` strings, which `printf '%s'` does not expand; mandatory for fixes to frankenstein.md, hooks, or any shell script building multi-line output strings (REC-14).

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/quality-engineer-v3.0.0...HEAD
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/quality-engineer-v2.0.0...claude-code/quality-engineer-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/quality-engineer-v1.3.0...claude-code/quality-engineer-v2.0.0
[1.3.0]: https://github.com/bmjcoding/agent-toolkit/compare/quality-engineer-v1.0.0...quality-engineer-v1.3.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/quality-engineer-v1.0.0
