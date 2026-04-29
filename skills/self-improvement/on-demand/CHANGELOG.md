# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-04-28

### Changed

- Added a portable `## Inputs` section describing dispatch-prompt targets,
  user concerns, external standards, and unresolved-target behavior.

## [1.1.0] - 2026-04-28

### Changed

- Updated target skill resolution to prefer categorized
  `skills/*/<name>/SKILL.md` paths with flat-path fallback for migration.
- Shortened the trigger description so definition lint output stays focused on
  actionable issues.
- Renamed ad-hoc review workflow references to `definition-review`.

## [1.0.1] - 2026-04-28

### Changed

- Clarified the skill trigger description and renamed the final handoff section to the
  shared `Output Format` convention.

## [1.0.0] - 2026-04-27

### Added

- Initial release. Ad-hoc skill/agent definition review loaded by `autoresearch-analyst`
  for freeform user requests ("Skill X is too verbose", "review the planner agent").
  Resolves targets, extracts user concerns verbatim, runs definition-review, and routes
  to improve when warranted. Carries the iteration termination contract, the
  external-references handoff field, and the never-auto-rewrite rule. Extracted from
  `autoresearch-analyst.md` so the workflow has a single update site.
