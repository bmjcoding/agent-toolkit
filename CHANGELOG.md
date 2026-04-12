# Changelog

All notable changes to **agent-toolkit** (repository-level) are documented here.
Per-component changelogs live in each component's own `CHANGELOG.md`.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This repository adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-04-12

### Changed — Breaking

- **Repository renamed** on GitHub from `claude-toolkit` to `agent-toolkit`.
- **Top-level layout restructured** into per-tool directories:
  - `claude-code/` — Claude Code agents, commands, hooks, bundles, docs, scripts
  - `github-copilot/` — GitHub Copilot (VS Code / cloud) agents, prompts, instructions
  - `openai-codex/` — OpenAI Codex CLI agents, config templates
  - `shared/` — tool-agnostic skills and rules (single source of truth for all tools)
- **Skills path changed**: `skills/` (old monolithic root) is now `shared/skills/`.
  Users with existing `~/.claude/skills` symlinks must re-run
  `claude-code/scripts/install.sh` to retarget.
- **Rules path changed**: `rules/` (old monolithic root) is now `shared/rules/`.
  Existing `~/.claude/rules` symlinks must also be retargeted.
- **Tag format changed**: component tags now use `<tool>/<slug>-v<version>` (e.g.
  `claude-code/frankenstein-v3.0.0`, `shared/changelog-v3.0.0`) instead of the
  previous flat `<slug>-v<version>` format.
- **All 48 components bumped to next major version** to signal the breaking layout
  change. Each component's own `CHANGELOG.md` records the specific version bump.

### Added

- `claude-code/scripts/install.sh` — symlink manager for `~/.claude/`. Supports
  `--dry-run`, `--check`, and `AGENT_TOOLKIT_DIR` override. Creates or retargets
  6 symlinks: agents, commands, docs, hooks, rules (→ shared/rules), skills
  (→ shared/skills).
- `AGENTS.md` at repo root — unified agent instruction file read natively by
  Claude Code, GitHub Copilot (VS Code), and OpenAI Codex CLI.
- `github-copilot/` directory with per-format agent, prompt, and instruction stubs
  targeting the VS Code Copilot extension and GitHub.com cloud agent model.
- `openai-codex/` directory with TOML agent definitions and config templates for
  the Codex CLI (v0.120.0+).
- `shared/rules/` housing Docker, Node, Python, and logging rule sets previously
  under the monolithic `rules/` root.

### Migration guide

1. Pull the latest `main` (or `feat/agent-toolkit-layout-v2`).
2. Remove stale symlinks: `rm ~/.claude/{agents,commands,docs,hooks,rules,skills}`.
3. Re-run the install script: `./claude-code/scripts/install.sh`.
4. Verify: `./claude-code/scripts/install.sh --check`.

[Unreleased]: https://github.com/bmjcoding/claude-toolkit/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/bmjcoding/claude-toolkit/releases/tag/v2.0.0
