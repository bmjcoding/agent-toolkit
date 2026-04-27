# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-04-27

### Added

- Initial release. Ad-hoc skill/agent review skill loaded by `autoresearch-analyst`
  for freeform user requests ("Skill X is too verbose", "review the planner agent").
  Resolves targets, extracts user concerns verbatim, runs review-skill, and routes
  to improve when warranted. Carries the iteration termination contract, the
  external-references handoff field, and the never-auto-rewrite rule. Extracted from
  `autoresearch-analyst.md` so the workflow has a single update site.

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/skill/on-demand-v1.0.0...HEAD
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/skill/on-demand-v1.0.0
