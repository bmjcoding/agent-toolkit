# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-04-28

### Added

- Added gotchas for missing repo paths, unavailable remotes, and treating checklist
  gaps as recon data rather than routing them to on-demand review.

### Changed

- Clarified the recon-mode trigger description and renamed the handoff section to the
  shared `Output Format` convention.
- Shortened the trigger description so definition lint output stays focused on
  actionable issues.

## [1.0.0] - 2026-04-27

### Added

- Initial release. Pre-planner reconnaissance skill loaded by `autoresearch-analyst`
  in `recon mode`. Carries the multi-repo toolkit checklist (hook paths, hook
  registration, working-tree state, branch status, changelog versions) and the
  recon-mode handoff schema. Extracted from `autoresearch-analyst.md` so the workflow
  has a single update site instead of being inlined in the agent body.

[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/recon-v1.0.0...skill/recon-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/skill/recon-v1.0.0
