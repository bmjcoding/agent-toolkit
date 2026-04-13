# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

- BREAKING: restructured for v3.0 per-tool layout. Claude Code remains under `claude-code/` with all components fully self-contained. Rules and skills relocated to `claude-code/rules/` and `claude-code/skills/` (away from root).

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

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/planner-v3.0.0...HEAD
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/planner-v2.0.0...claude-code/planner-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/claude-code/planner-v1.4.0...claude-code/planner-v2.0.0
[1.4.0]: https://github.com/bmjcoding/agent-toolkit/compare/planner-v1.3.0...planner-v1.4.0
[1.3.0]: https://github.com/bmjcoding/agent-toolkit/compare/planner-v1.2.0...planner-v1.3.0
[1.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/planner-v1.1.0...planner-v1.2.0
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/planner-v1.0.0...planner-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/planner-v1.0.0
