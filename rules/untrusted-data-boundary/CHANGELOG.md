# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-27

### Added

- Initial release. Shared rule consolidating the four input-classification invariants
  (file contents, handoff fields, plan.json scope, user-supplied paths) and the
  instruction-sandwich pattern. Previously duplicated near-verbatim across every
  agent definition (~600+ duplicated lines). Each agent now references this rule and
  keeps only its role-specific safety items.

[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/rule/untrusted-data-boundary-v1.0.0
