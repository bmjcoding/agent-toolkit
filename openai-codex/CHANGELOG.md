# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.1.3] - 2026-04-17

### Fixed

- `scripts/install.sh` now repairs executable bits on generated Codex hook adapters and
  canonical hook shells after wiring the symlinked hook tree, so the documented install
  flows do not leave Codex with non-runnable hook commands.

## [4.1.2] - 2026-04-15

### Changed

- Clarified the manual Codex install docs so they create the required directories,
  symlink the live `hooks.json` registry, and warn that copying the config template
  directly can overwrite an existing `~/.codex/config.toml`.

### Fixed

- Aligned the Codex hook runtime contract across `hooks.json`, the installer, and the
  distribution catalog so the fallback adapter path under `~/.codex/openai-codex/hooks/`
  is now installed and the machine-readable install metadata includes the companion files
  each hook needs at runtime.

## [4.1.1] - 2026-04-15

### Changed

- Tightened `README.md` so the checked-in Codex surface description matches the current
  layout cleanly and the `Tag format` section remains visually separated from the
  preceding install/reference guidance.

## [4.1.0] - 2026-04-15

### Changed

- Completed the root-hook migration on the Codex surface: `README.md`, `scripts/install.sh`,
  `scripts/integrity-check.sh`, and the generated hook registry/adapters now treat
  repo-root `hooks/` as canonical and the remaining Codex-local hook files as thin
  runtime adapters.

## [4.0.0] - 2026-04-14

### Changed

- BREAKING: `autoresearch-analyst.toml` review mode handoff `results[].required_changes` type changed from integer (count) to array of objects `{what, where, why, priority, type}` to match review-skill JSON output schema (D1-1). Consumers must read `required_changes.length` to obtain the count.
- BREAKING: `autoresearch-analyst.toml` full-cycle mode handoff `review_results[].required_changes` updated to the same array-of-objects shape for consistency with the review mode handoff.
- `autoresearch-analyst.toml` improve mode handoff: added `file_diffs` field (array of `{file, unified_diff_truncated}` objects) matching improve/SKILL.md step 7 schema (D1-3).

## [3.1.0] - 2026-04-13

### Added

- `dependencies[]` field on all 15 agent manifests. Each entry declares a required or optional primitive dependency (skill, command, hook, or agent) with an optional `reason` string explaining when that dependency is invoked.
- `components[]` field on all 8 bundle manifests. Each entry declares a constituent primitive with `type`, `id`, and `role` (`core` | `optional` | `dep`). Bundle manifests are now the single source of truth for composition.
- `commands-unsupported/` directory with 6 command-stub manifests (`status: unavailable`, `install_command: ""`). Codex CLI has no user-defined slash-command mechanism; these stubs document the gap and are indexed as unavailable entries in the ALT Central download matrix.

### Removed

- 8 sibling bundle composition files (`bundles/<name>.json`). Composition data has migrated to each bundle's `manifest.json` `components[]` field.

## [3.0.0] - 2026-04-12

### Added

- 13 shared skills wired into the Codex surface from the canonical repo-root `skills/` source.
- 4 rule composition inputs in `openai-codex/rules/` (docker, logging, node, python).
- 8 bundles in `openai-codex/bundles/` for Codex surface (no command category — Codex has no custom slash commands).
- `dependencies.json` declaring skill and rule dependencies for the Codex surface.
- `build-agents-md.sh` script that composes a `## Rules` block for `AGENTS.md` by concatenating rule bodies.

### Fixed

- BREAKING: `[[skills.config]]` description fields removed from `config.toml.template` (parity gap #2 High resolved).
- Path values in `config.toml.template` updated to point to `SKILL.md` files instead of directories (parity gap #3 High resolved).
- `approval_policy` changed from invalid value `auto` to `on-request` (parity gap #4 High resolved).
- `sandbox_mode` comment corrected — removed erroneous mention of full-network access (parity gap #5 Medium resolved).
- `scripts/install.sh` hooks target corrected to `~/.codex/hooks.json` (parity gap #6 Medium resolved).
- Group-level `description` field removed from `hooks.json` (parity gap #7 Low resolved).

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/openai-codex-v4.1.3...HEAD
[4.1.3]: https://github.com/bmjcoding/agent-toolkit/compare/openai-codex-v4.1.2...openai-codex-v4.1.3
[4.1.2]: https://github.com/bmjcoding/agent-toolkit/compare/openai-codex-v4.1.1...openai-codex-v4.1.2
[4.1.1]: https://github.com/bmjcoding/agent-toolkit/compare/openai-codex-v4.1.0...openai-codex-v4.1.1
[4.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/openai-codex-v4.0.0...openai-codex-v4.1.0
[4.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/openai-codex-v4.0.0
