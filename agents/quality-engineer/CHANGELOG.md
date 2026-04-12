# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2026-04-12

### Added

- Printf/accumulation end-to-end check in Remediation mode: when applying security fixes that modify `printf` format specifiers (e.g., `printf "%b"` -> `printf '%s'`), also verify accumulation variables use `$'\n'` (ANSI-C quoting) not literal `\n` strings, which `printf '%s'` does not expand; mandatory for fixes to frankenstein.md, hooks, or any shell script building multi-line output strings (REC-14).

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/quality-engineer-v1.3.0...HEAD
[1.3.0]: https://github.com/bmjcoding/agent-toolkit/compare/quality-engineer-v1.0.0...quality-engineer-v1.3.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/quality-engineer-v1.0.0
