# Changelog

All notable changes to **agent-toolkit** (repository-level) are documented here.
Per-component changelogs live in each component's own `CHANGELOG.md`.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This repository adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.1.0] - 2026-04-12

### Added

- `manifest.json` per primitive across all 156 primitives (13 skills × 3 tools + agents, hooks, commands, rules × 3 tools). Each manifest captures `id`, `name`, `type`, `tool`, `version`, `ref`, `download_url`, `install_path`, `install_command`, `files`, `status`, and `experimental` fields.
- `scripts/generate-index.js` — Node.js generator (uses only `fs` and `path` builtins) that walks all `<tool>/<primitive-type>/<name>/manifest.json` paths and writes `index.json` as a root-level JSON array. Re-run after adding any manifest.
- `index.json` at the repository root — machine-readable catalog of all 156 manifests; consumed by ALT Central's backend `fetchInstallOptions` service with a 5-minute cache and 1 MB size cap.

## [3.0.0] - 2026-04-12

### Changed — Breaking

- **Root `skills/` and `rules/` directories deleted.** All three tool directories are
  now fully self-contained: `claude-code/skills/` (13 skills), `claude-code/rules/`
  (4 rules), `github-copilot/skills/` (13 skills), `github-copilot/rules/` (4 rules),
  `openai-codex/skills/` (13 skills), `openai-codex/rules/` (4 rules).
- **Symlink targets updated** in `claude-code/scripts/install.sh`: `~/.claude/skills`
  now points to `claude-code/skills/`; `~/.claude/rules` now points to
  `claude-code/rules/`.
- **Tag namespace updated**: per-tool skill and rule tags now use the tool's flat
  namespace (e.g., `claude-code/changelog-v3.0.0`, `openai-codex/changelog-v3.0.0`)
  instead of the universal `skill/<slug>-v<ver>` and `rule/<slug>-v<ver>` prefixes.

### Added

- **`/docs` root directory** created with repo-wide ADR files:
  `docs/adr/0004-per-component-changelog-tag-format.md` and
  `docs/adr/0005-multi-tool-restructure.md`. Non-Claude UX doc moved to `docs/ux/`.
- **`dependencies.json` per tool** — each tool directory now contains a
  `dependencies.json` (schema v1.0) declaring its external tool dependencies.
- **10 parity gaps resolved across GitHub Copilot and OpenAI Codex CLI:**
  - Copilot: fixed `mode:` → `agent:` field in 6 prompt files.
  - Copilot: added 12 skill wrapper instruction files under `github-copilot/skills/`.
  - Copilot: added 9 hook equivalent instruction files under `github-copilot/hooks/`.
  - Codex: rewrote `hooks.json` to the nested `{"hooks": [...]}` format required by
    Codex CLI v0.120.0+.
  - Codex: fixed 3 `config.toml.template` schema errors (`[[skills.config]]` table
    format, `instructions_template` key, `timeout` type).
  - Codex: corrected `install.sh` hooks path from `~/.codex/hooks.json` to
    `~/.openai-codex/hooks.json`.

### Changed

- `refactor(layout): move skills + rules to repo root; drop shared/ dir (285f27f)` —
  `skills/` and `rules/` previously under `shared/` are now at the repository root.
  The `shared/` directory is removed. Symlink targets updated: `~/.claude/skills →
  <repo>/skills`, `~/.claude/rules → <repo>/rules`.

### Added (pre-v3.0 unreleased work now captured in this release)

- `feat(github-copilot): full port — 15 agents, 4 instructions, 6 prompts` — Complete
  GitHub Copilot surface port across multiple commits. Agents cover all 15 toolkit roles
  in `.agent.md` format. Instructions adapt the 4 universal rules for Copilot's
  `applyTo` frontmatter. Prompts provide direct Copilot equivalents of the 6 slash
  commands.
- `feat(openai-codex): full port — 15 agents, 9 hooks + hooks.json, 13 skills.config
  entries` — Complete OpenAI Codex CLI surface port. Agents cover all 15 toolkit roles
  in TOML format. Hooks include 9 shell scripts plus `hooks.json` manifest.
  `config.toml.template` exposes all 13 universal skills via `[[skills.config]]` entries.
- `feat(scripts): install.sh expanded for all 3 tools` — Install scripts updated to
  handle root-level skills and rules paths and tool-specific wiring for GitHub Copilot
  and OpenAI Codex CLI (from ST-D1).

### Fixed

- Shell script hardening in `claude-code/scripts/install.sh`,
  `github-copilot/scripts/install.sh`, `openai-codex/scripts/install.sh`,
  `claude-code/hooks/protect-config/protect-config.sh`, and
  `claude-code/hooks/toolkit-edit-reminder/toolkit-edit-reminder.sh`
  based on security, SRE, and design-architect review findings (phase 4-a).
- Documentation corrections to `AGENTS.md`, `CLAUDE.md`, `README.md`,
  ADR 0005, `claude-code/docs/migration-v2.md`, UX design doc,
  `openai-codex/README.md`, and `skills/changelog/SKILL.md`
  based on design-architect and SRE review findings (phase 4-b).
- Minor inline corrections to `CHANGELOG.md` and
  `claude-code/agents/frankenstein/frankenstein.md`
  from integration-verifier review (phase 3a).

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

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/v3.1.0...HEAD
[3.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/v2.0.0...v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/releases/tag/v2.0.0
