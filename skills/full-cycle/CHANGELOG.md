# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-04-27

### Added

- Initial release. Autonomous improve → validate loop skill loaded by
  `autoresearch-analyst` in `full-cycle mode`. Carries the iteration termination
  contract (converged / max_iterations / rewrite_verdict / no_progress), the
  single-outcome-file rule, and the handoff schema. Extracted from
  `autoresearch-analyst.md` so the workflow has a single update site.

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/skill/full-cycle-v1.0.0...HEAD
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/skill/full-cycle-v1.0.0
