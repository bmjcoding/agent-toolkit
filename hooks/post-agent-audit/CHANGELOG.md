# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-04-27

### Added

- SubagentStop hook that audits a returning subagent for two class-of-error symptoms:
  out-of-scope file modifications (writes to files NOT in the subagent's `owned_files`
  per `plan.json`) and truncation symptoms (no handoff JSON written despite the agent
  stopping). When out-of-scope writes are detected, stashes them as a named patch and
  records an audit JSON under `.orchestrator/sessions/$SID/`. Non-blocking by design —
  the orchestrator decides how to react.

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/hook/post-agent-audit-v1.0.0...HEAD
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/hook/post-agent-audit-v1.0.0
