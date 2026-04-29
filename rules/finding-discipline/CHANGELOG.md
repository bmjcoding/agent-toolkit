# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-04-29

### Changed

- Removed generated Copilot instruction descriptions so rule adapters no longer
  synthesize summaries from rule body text.

## [1.0.0] - 2026-04-27

### Added

- Initial release. Shared rule defining what does and does not belong in a handoff's
  `findings[]` array (the actionable-item test). Replaces duplicated guidance that
  previously lived in both `security-engineer.md` and `site-reliability-engineer.md`.
