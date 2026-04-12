# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.5.0] - 2026-04-12

### Added

- `on-demand` mode: fallback workflow for freeform user requests (e.g., "the changelog skill is too verbose, split it up"). Resolves target from the prompt, runs review-skill inline, then iterates with improve when the verdict is NEEDS WORK. Preserves explicit mode keywords as fast paths.

### Changed

- Error handoff reason renamed from `unrecognized_mode` to `unresolvable_target`; now fires only when no target can be extracted from the prompt. Includes a `hint` field directing the caller to either a mode keyword or a target identifier.

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/autoresearch-analyst-v1.5.0...HEAD
[1.5.0]: https://github.com/bmjcoding/agent-toolkit/compare/autoresearch-analyst-v1.4.3...autoresearch-analyst-v1.5.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/autoresearch-analyst-v1.0.0
