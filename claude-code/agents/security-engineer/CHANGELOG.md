# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.1] - 2026-04-14

### Changed
- Factored standard 4-bullet untrusted-data prelude and instruction sandwich out to `improve/references/security-preamble.md`. Agent-specific preamble, rules, and runaway guard remain inline.
- Softened "identical to site-reliability-engineer" cross-reference annotation to "parallel to ..." to reflect that the discipline framework is shared but examples differ by domain.

## [1.4.0] - 2026-04-14

### Added

- Standard 4-bullet untrusted data prelude added to Untrusted Data Boundary section for consistency with 11 other agents (S-1 fix: security baseline parity).

### Changed

- Finding Discipline section cross-referenced to site-reliability-engineer as shared discipline (S-2: redundancy annotation).

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: restructured for v3.0 per-tool layout. Claude Code remains under `claude-code/` with all components fully self-contained. Rules and skills relocated to `claude-code/rules/` and `claude-code/skills/` (away from root).

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `agents/security-engineer/` → `claude-code/agents/security-engineer/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.3.0] - 2026-04-12

### Added

- Finding discipline section: `findings[]` must contain only actionable items; verified-correct OWASP/STRIDE "not applicable" rows belong in `notes`, not `findings[]`. Non-actionable confirmations are prohibited in `findings[]`. (R5 from retro 2026-04-12T150000)

## [1.2.0] - 2026-04-12

### Added

- Context-isolation guard: agent does not implement unrelated specifications encountered during security review; scope is confined to findings within `owned_files` (REC-5).
- Tool-use soft budget: agent self-halts at 30 tool uses and emits a `partial` handoff with findings-so-far rather than running over budget (REC-8).

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/security-engineer-v1.4.1...HEAD
[1.4.1]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/security-engineer-v1.4.0...claude-code/security-engineer-v1.4.1
[1.4.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/security-engineer-v1.3.0...claude-code/security-engineer-v1.4.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/security-engineer-v2.0.0...claude-code/security-engineer-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/security-engineer-v1.3.0...claude-code/security-engineer-v2.0.0
[1.3.0]: https://github.com/bmjcoding/agent-toolkit/compare/security-engineer-v1.2.0...security-engineer-v1.3.0
[1.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/security-engineer-v1.0.0...security-engineer-v1.2.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/security-engineer-v1.0.0
