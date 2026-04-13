# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0] - 2026-04-12

### Added

- BREAKING: copied to `openai-codex/rules/node/` as part of the v3.0 multi-tool restructure.
- Rules content is now also consumed by OpenAI Codex CLI via `build-agents-md.sh` appending to `AGENTS.md`.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `rules/node/` → `claude-code/rules/node/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/openai-codex/node-v3.0.0...HEAD
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/openai-codex/node-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/node-v1.0.0...claude-code/node-v2.0.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/node-v1.0.0
