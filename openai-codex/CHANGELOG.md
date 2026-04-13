# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.1.0] - 2026-04-13

### Added

- `dependencies[]` field on all 15 agent manifests. Each entry declares a required or optional primitive dependency (skill, command, hook, or agent) with an optional `reason` string explaining when that dependency is invoked.
- `components[]` field on all 8 bundle manifests. Each entry declares a constituent primitive with `type`, `id`, and `role` (`core` | `optional` | `dep`). Bundle manifests are now the single source of truth for composition.
- `commands-unsupported/` directory with 6 command-stub manifests (`status: unavailable`, `install_command: ""`). Codex CLI has no user-defined slash-command mechanism; these stubs document the gap and are indexed as unavailable entries in the ALT Central download matrix.

### Removed

- 8 sibling bundle composition files (`bundles/<name>.json`). Composition data has migrated to each bundle's `manifest.json` `components[]` field.

## [3.0.0] - 2026-04-12

### Added

- 13 skills in `openai-codex/skills/`, mirroring the universal skills set.
- 4 rules in `openai-codex/rules/` (docker, logging, node, python).
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

<!-- No tags pushed yet for this component — compare links omitted until first tag -->
