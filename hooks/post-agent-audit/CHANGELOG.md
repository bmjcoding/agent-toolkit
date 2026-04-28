# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-04-28

### Added

- Handoff schema validation: hook now invokes `~/.claude/scripts/validate-handoff.py`
  on the returning agent's handoff JSON. Violations (invalid `severity` enum,
  invalid `status` enum, wrong `files_written` type, malformed `agent_id`) are
  recorded under `handoff_schema_violations` in the audit JSON the orchestrator
  inspects. This eliminates the post-completion handoff rejection class that
  previously cost 6+ rejection-and-retry cycles across the prior 10 retros.

### Changed

- Resolves `validate-handoff.py` through toolkit helper paths instead of a
  Claude-local script path, and records a schema violation when the helper is missing.

## [1.0.0] - 2026-04-27

### Added

- SubagentStop hook that audits a returning subagent for two class-of-error symptoms:
  out-of-scope file modifications (writes to files NOT in the subagent's `owned_files`
  per `plan.json`) and truncation symptoms (no handoff JSON written despite the agent
  stopping). When out-of-scope writes are detected, stashes them as a named patch and
  records an audit JSON under `.orchestrator/sessions/$SID/`. Non-blocking by design —
  the orchestrator decides how to react.

[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/hook/post-agent-audit-v1.0.0...hook/post-agent-audit-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/hook/post-agent-audit-v1.0.0
