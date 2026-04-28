# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-04-27

### Added

- Initial release. Pre-planner reconnaissance skill loaded by `autoresearch-analyst`
  in `recon mode`. Carries the multi-repo toolkit checklist (hook paths, hook
  registration, working-tree state, branch status, changelog versions) and the
  recon-mode handoff schema. Extracted from `autoresearch-analyst.md` so the workflow
  has a single update site instead of being inlined in the agent body.

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/skill/recon-v1.0.0...HEAD
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/skill/recon-v1.0.0
