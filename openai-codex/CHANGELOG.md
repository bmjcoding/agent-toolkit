# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
