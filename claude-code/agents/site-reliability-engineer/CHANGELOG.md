# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Trimmed educational prose: removed Untrusted Data Boundary lede motivation sentence; content now lives in `improve/references/security-preamble.md` reference.

## [1.4.2] - 2026-04-14

### Changed
- Factored standard 4-bullet untrusted-data prelude and instruction sandwich out to `improve/references/security-preamble.md`. Agent-specific preamble, rules, and runaway guard remain inline.
- Softened "identical to security-engineer" cross-reference annotation to "parallel to ..." to reflect that the discipline framework is shared but examples differ by domain.

## [1.4.1] - 2026-04-14

### Removed

- SRE-1: deleted frontmatter comment `# spawned with run_in_background: true by frankenstein Phase 3a` — agent definitions describe behavior, not how a specific orchestrator dispatches them.

### Changed

- SRE-2: added cross-reference comment to the Finding Discipline section noting it is identical to security-engineer's section; prevents future editors from treating independent drift as intentional.

## [1.4.0] - 2026-04-13

### Added

- Handoff-First Rule: agent writes a skeleton handoff JSON as its first write operation before beginning analysis, ensuring the orchestrator has a recoverable artifact even if the agent truncates mid-run.

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: restructured for v3.0 per-tool layout. Claude Code remains under `claude-code/` with all components fully self-contained. Rules and skills relocated to `claude-code/rules/` and `claude-code/skills/` (away from root).

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `agents/site-reliability-engineer/` → `claude-code/agents/site-reliability-engineer/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.3.0] - 2026-04-12

### Added

- Finding discipline section: `findings[]` must contain only actionable items; verified-correct observations belong in `findings_resolved[]` or `notes`. Non-actionable confirmations ("No issue", "Correct as designed") are prohibited in `findings[]`. (R5 from retro 2026-04-12T150000)

## [1.2.0] - 2026-04-12

### Added

- Write-scope constraint: agent is restricted to modifying only files listed in `owned_files`; findings on out-of-scope files are reported but not auto-fixed (REC-1).
- Context-isolation guard: encountering unrelated spec documents during review does not trigger implementation of those specs; agent stays within its assigned subtask boundary (REC-5).
- Tool-use soft budget: agent self-halts at 30 tool uses and emits a `partial` handoff with findings-so-far rather than running over budget (REC-8).

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/site-reliability-engineer-v1.4.2...HEAD
[1.4.2]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/site-reliability-engineer-v1.4.1...claude-code/site-reliability-engineer-v1.4.2
[1.4.1]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/site-reliability-engineer-v1.4.0...claude-code/site-reliability-engineer-v1.4.1
[1.4.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/site-reliability-engineer-v3.0.0...claude-code/site-reliability-engineer-v1.4.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/site-reliability-engineer-v2.0.0...claude-code/site-reliability-engineer-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/site-reliability-engineer-v1.3.0...claude-code/site-reliability-engineer-v2.0.0
[1.3.0]: https://github.com/bmjcoding/agent-toolkit/compare/site-reliability-engineer-v1.2.0...site-reliability-engineer-v1.3.0
[1.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/site-reliability-engineer-v1.0.0...site-reliability-engineer-v1.2.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/site-reliability-engineer-v1.0.0
