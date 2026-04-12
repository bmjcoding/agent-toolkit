# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.1] - 2026-04-12

### Fixed

- gitleaks scan now uses a dual-path glob covering both flat `.orchestrator/` and session-scoped `.orchestrator/sessions/*/` paths, ensuring secrets introduced in session-isolated files are caught before push.

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/claude-toolkit/compare/pre-push-secrets-v1.0.1...HEAD
[1.0.1]: https://github.com/bmjcoding/claude-toolkit/compare/pre-push-secrets-v1.0.0...pre-push-secrets-v1.0.1
[1.0.0]: https://github.com/bmjcoding/claude-toolkit/tree/pre-push-secrets-v1.0.0
