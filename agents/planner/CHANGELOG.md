# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added session-aware `plan.json` fields for `session_id`, top-level
  `parallel_groups`, per-subtask `notes`, and `scope_override_note`.

### Changed

- Planner bootstrap guidance now generates missing session context snapshots and treats
  legacy flat orchestrator context as a compatibility fallback instead of a hard
  dependency.
- Updated the Claude adapter reference to the flattened `claude-code/agents/<name>.md`
  layout used by the tool-specific generated surfaces.

## [2.0.0] - 2026-04-15

### Changed

- Declared shared execution metadata in the canonical root definition so model tier, capabilities, subagent routing, and skill dependencies no longer need to be inferred from tool-specific wrappers.

- Moved the canonical agent definition and changelog to `agents/planner/`; Claude, Copilot, and Codex files are now tool-specific adapters generated from the shared source.
- Updated comparison links to use the shared `agent/planner` tag namespace for this root canonical component.

### Removed

- Removed the redundant Claude-specific changelog copy from `claude-code/agents/planner/CHANGELOG.md`.

## [1.10.0] - 2026-04-14

### Added

- Completion-criteria line-count freshness rule: when writing `completion_criteria` with line-count targets, run `wc -l` on each target file immediately before writing the criterion. Do not use counts from prior-session audit documents. Prevents stale count mismatches that cost agents extra verification turns.
- CHANGELOG sequential co-ownership: `changelog_dependency` field for plan.json subtasks — when subtask B appends to a CHANGELOG owned by subtask A, the field makes the sequential single-writer assumption visible and enforced. Subtasks with `changelog_dependency` must appear in a later `parallel_group` and must list the owner in `blockedBy`.
- Plan-reviewer model hint: `plan_reviewer_model` note guidance in `context_summary` — haiku for plans <= 8 subtasks, sonnet with 30-tool budget cap for plans >= 9 subtasks. Prevents opus context-overflow on large plans (101K tokens, no output, 15-subtask plan).

## [1.9.1] - 2026-04-14

### Changed
- Factored standard 4-bullet untrusted-data prelude and instruction sandwich out to `improve/references/security-preamble.md`. Agent-specific preamble, rules, and runaway guard remain inline.

## [1.9.0] - 2026-04-14

### Changed

- PL-1: Download-trigger rule generalized — replaced project-specific identifiers (`window.open(archiveUrl)`, `handleDownload`, `setPhase`) with generic placeholders; principle (verify download trigger fires before phase transition) preserved
- PL-2: Removed duplicate "Pre-description file state verification" bullet (was repeated verbatim at lines 94–95; canonical copy retained)
- PL-3: Format-migration audit grep example generalized — replaced `epics.json|stories.json` with `<old-format-artifact>.json`
- PL-4: Enum-extension rule generalized — replaced `ToolkitCategorySchema` and `bundle` with `[EnumTypeName]` and `<new-variant>`
- PL-6: Catalog-page layout spec rule updated — added "If the project's UX spec defines layout categories, use those" qualifier before the default vocabulary list, removing the ALT Central vocabulary dependency

## [1.8.0] - 2026-04-14

### Added

- Model Hints: extended `model_hint: haiku` to CHANGELOG-only, test-only, and single-constant-edit subtasks — matches frankenstein.md mechanical agent criteria
- Description Derivation Level: new `derivation_level: verbatim` subtask field flags descriptions with >50 lines of verbatim code so dispatcher routes to implementation agents, not transcription agents
- Output schema: added `plan_reviewer_notes` field — populated after plan-reviewer returns with advisory corrections and description changes applied to plan.json

## [1.7.0] - 2026-04-13

### Added

- Framework scaffolding rule — "Download-trigger verification for command-shape changes": when a subtask replaces install-command generation in a consumer dialog, `completion_criteria` must include an explicit `window.open(archiveUrl)` presence check in `handleDownload`.

## [1.6.0] - 2026-04-13

### Added

- QA-fix scope constraint rule: dispatch prompts for quality-fix agents must include an explicit scope boundary preventing modifications outside listed files
- Enum-extension cross-boundary propagation rule: after adding an enum variant, grep for exhaustive maps across all workspaces and run tsc --noEmit on all workspaces
- CHANGELOG pre-insert duplicate check rule: verify target version header does not already exist before inserting it
- Frontmatter field spec completeness rule: enumerate all component types that use a shared frontmatter field in the subtask description

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: restructured for v3.0 per-tool layout. Claude Code remains under `claude-code/` for tool-native assets. At that point in history, shared rules and skills were described as living under `claude-code/rules/` and `claude-code/skills/`.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `agents/planner/` → `claude-code/agents/planner/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.4.0] - 2026-04-12

### Added

- blockedBy/parallel_group consistency self-validation rule — after writing plan.json, verify every subtask in group N>1 has at least one entry in blockedBy from a lower group; empty blockedBy with non-1 group is a scheduling ambiguity

## [1.3.0] - 2026-04-11

### Added

- Pre-description file state verification rule: planner must sample 2-3 files from migration target lists before writing subtask descriptions to confirm described state matches reality

## [1.2.0] - 2026-04-11

### Added

- Visual acceptance criteria rule for layout subtasks: require grid column counts, spacing values, and design references in completion_criteria

## [1.1.0] - 2026-04-11

### Added

- catalog_layout spec field requirement for frontend catalog pages
- fixture_count as machine-readable field in integration contracts
- Changelog cross-subtask validation rule for bracket format
- Test fixture read-before-assert rule — live directory count, not plan.json
- Subtask description length cap at 2,000 words

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/agent/planner-v2.0.0...HEAD
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/agent/planner-v2.0.0
[1.10.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/planner-v1.9.1...agent/planner-v1.10.0
[1.9.1]: https://github.com/bmjcoding/agent-toolkit/compare/agent/planner-v1.9.0...agent/planner-v1.9.1
[1.9.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/planner-v1.8.0...agent/planner-v1.9.0
[1.8.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/planner-v1.7.0...agent/planner-v1.8.0
[1.7.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/planner-v1.6.0...agent/planner-v1.7.0
[1.6.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/planner-v4.0.0...agent/planner-v1.6.0
[4.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/planner-v3.0.0...agent/planner-v4.0.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/planner-v2.0.0...agent/planner-v3.0.0
[1.4.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/planner-v1.3.0...agent/planner-v1.4.0
[1.3.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/planner-v1.2.0...agent/planner-v1.3.0
[1.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/planner-v1.1.0...agent/planner-v1.2.0
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/planner-v1.0.0...agent/planner-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/agent/planner-v1.0.0
