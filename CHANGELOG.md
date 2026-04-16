# Changelog

All notable changes to **agent-toolkit** (repository-level) are documented here.
Per-component changelogs live in each component's own `CHANGELOG.md`.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This repository adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.7.0] - 2026-04-16

### Added

- Added canonical shared-skill dependency metadata to the distribution catalog so shared skill artifacts now publish prerequisite skills under `metadata.dependencies`.

### Changed

- Tightened the shared definition linter to allow and validate typed `dependencies:` frontmatter entries for shared skills, and regenerated `index.json` with the new metadata contract.

## [4.6.1] - 2026-04-16

### Fixed

- Fixed the GitHub Copilot catalog so shared root skills are emitted alongside Claude Code and Codex entries, and smoke validation now catches regressions in universal skill coverage.

## [4.6.0] - 2026-04-15

### Added

- Added a checked-in reference-integrity validator to the smoke test so broken Markdown
  links and leaked machine-specific absolute repo paths fail repository validation.

### Changed

- Removed the remaining hardcoded local toolkit checkout fallback from the canonical
  `sync-toolkit` workflow and tightened the Codex install docs so the documented manual
  setup matches the live installer behavior more closely.
- Removed the redundant `tools/catalog-metadata.json` hook lifecycle lookup and taught
  the catalog generator/validator to derive hook maturity from per-tool defaults
  instead.
- Switched Python linting from `pip`-managed virtualenv bootstrap to pinned `uvx`
  Ruff invocations in docs, CI, and repo scripts, and dropped the now-unused Python
  Dependabot surface.
- Folded the open Dependabot GitHub Actions major-version bumps into the current CI
  workflow files by upgrading `actions/checkout`, `actions/setup-node`, and the
  remaining `actions/setup-python` usage to `v6`.

### Fixed

- Fixed the Codex hook install contract so the generated registry, installer, and catalog
  agree on the fallback adapter location and the catalog now carries the companion files
  required for standalone hook installs.

## [4.5.0] - 2026-04-15

### Added

- Added generated Claude rule adapters under `claude-code/rules/` so Claude Code and
  GitHub Copilot both consume tool-local rule surfaces derived from canonical root
  `rules/`.
- Added `skills/retro/scripts/validate.py` as the skill-local validator for retro
  summary JSON files after retiring the old `tools/retros/` dependency.
- Added repo-level lint tooling with `eslint`, `markdownlint-cli2`, `prettier`, and Ruff,
  plus a GitHub Actions lint workflow for JavaScript, Markdown, JSON, YAML, and Python.
- Added `requirements-dev.txt` for Python lint bootstrap and a Dependabot config covering
  npm, GitHub Actions, and Python dev dependencies.

### Changed

- Re-established repo-root `skills/` and `rules/` as the canonical shared content
  surfaces, with `AGENTS.md` as the primary shared instruction source and root
  `CLAUDE.md` reduced to the one-line compatibility shim `@AGENTS.md`.
- Extended adapter sync and catalog validation to cover Claude rule adapters and GitHub
  Copilot instruction adapters generated from root `rules/`.
- Removed the redundant `github-copilot/commands/` workflow-manifest surface so GitHub
  Copilot workflow adapters now live only under `github-copilot/prompts/`.
- Removed redundant `claude-code/scripts/{diagnose.sh,backfill-changelog-tags.sh}` copies
  so Claude keeps only live runtime scripts there and changelog helpers stay canonical
  under `skills/changelog/scripts/`.
- Removed stale installer and README references to deleted surfaces such as
  `claude-code/docs`, `docs/todo`, `github-copilot/bundles`, and the old `tools/retros/`
  tree.
- Hardened the generated-asset validation flow so stale generated rule surfaces and
  brittle workflow-version assumptions fail cleanly.
- Updated local setup docs to prefer `npm ci` now that the repo ships a lockfile.

## [4.4.0] - 2026-04-15

### Changed

- Retired overlapping `claude-code/*` tag references for mirrored shared agents and
  workflows. Shared component docs and changelog footers now point only at canonical
  `agent/*`, `workflow/*`, `skill/*`, and `rule/*` tags, leaving `claude-code/*`
  reserved for tool-native Claude hooks and bundles.

## [4.3.0] - 2026-04-15

### Added

- `index.json` artifacts now expose normalized `lifecycle` and `availability` metadata,
  include OpenAI Codex hook entries, validate hook runtime metadata from
  `tools/catalog-metadata.json`, and fail generation when either field is missing.
- GitHub Actions now runs the `skills/review-skill/scripts/lint-definition.py`
  deterministic schema checks for canonical `skills/**` and `agents/**` before the
  generated-asset validation/sync jobs, so malformed definitions fail CI before
  adapter sync proceeds.
- Added a component-specific CI changelog gate. Pull requests and pushes that modify a
  monitored component surface now fail unless the associated `CHANGELOG.md` for that
  exact component is updated in the same diff.
- Pull requests now require touched component changelogs to promote PR-scoped notes out
  of `## [Unreleased]` into a new dated versioned section, so version bumps happen
  before review instead of waiting for merge.
- Fixed the component-changelog CI gate on first pushes to new branches by fetching the
  repository default branch before computing the fallback diff base.
- Normalized the remaining workflow, rule, Claude command, and Claude hook changelog
  footer links to canonical namespaced tags so historical compare/tree links no longer
  depend on obsolete flat component tags.

### Changed

- Canonical shared agents, workflows, skills, and rules now declare `lifecycle` in
  their root definitions so generated adapters and the distribution catalog read
  maturity from one source of truth while tool-local support remains a separate
  availability concern.
- Release-engineer and the changelog skill now treat `## [Unreleased]` as branch-local
  scratch space only: PR-bound work is expected to be promoted into the next versioned
  section before the PR is opened.

## [4.2.1] - 2026-04-15

### Fixed

- Updated the generated-asset smoke test to fall back to a built-in filesystem scan
  when `rg` is unavailable, so `validate-generated-assets` passes on GitHub runners
  without ripgrep installed.

## [4.2.0] - 2026-04-15

### Added

- Added generated hook adapter support to `scripts/sync-canonical-adapters.js` and
  `scripts/smoke-generated-assets.js`, so the canonical root `hooks/` tree now populates
  the GitHub Copilot and OpenAI Codex hook surfaces the same way canonical agents and
  workflows populate their tool-native adapters.

### Changed

- Completed the root-hooks ownership migration: repo-root `hooks/` is now the canonical
  shared hook layer, Claude installs from that root tree, and Copilot/Codex keep
  generated tool-local adapters plus runtime registries where documented payload
  differences still require them.
- Updated ADR-0009 and the active hook READMEs to describe the landed end state instead
  of an in-flight migration, including removal of the `toolkit-drift-check` and
  `toolkit-edit-reminder` maintenance hooks.
- Updated generated-asset validation and catalog tests to match the current workflow
  release versions and the removal of obsolete GitHub Copilot command manifests.

### Removed

- Removed retired hook-local shell copies from `claude-code/hooks/` and the dropped
  `toolkit-drift-check` / `toolkit-edit-reminder` hook surfaces across Claude, Copilot,
  and Codex.
- Removed obsolete GitHub Copilot command manifests and retired `tools/retros/`
  assets that are no longer part of the active toolkit layout.

### Added

- Added a GitHub Actions sync gate that reruns canonical adapter generation on matching
  pushes and pull requests, fails stale PRs, and smoke-tests that generated tool
  surfaces and `index.json` are present and internally consistent.
- Added generated Claude rule adapters under `claude-code/rules/` so both Claude Code
  and GitHub Copilot consume tool-local rule surfaces derived from canonical root
  `rules/`.
- Added `skills/retro/scripts/validate.py` as the skill-local validator for retro
  summary JSON files after retiring the old `tools/retros/` dependency.
- Added canonical lifecycle validation for shared agents, skills, workflows, rules, and
  hook catalog metadata. CI now fails missing or invalid lifecycle values instead of
  allowing them to drift.

### Changed

- Re-established repo-root `skills/` and new repo-root `rules/` as the canonical shared
  content surfaces, with `AGENTS.md` as the primary shared instruction source and root
  `CLAUDE.md` reduced to the one-line compatibility shim `@AGENTS.md`.
- Began ADR-0008 implementation: `index.json` is now generated as a tool-aware
  distribution catalog with component versions, install metadata, bundle membership, and
  checksums instead of a path-only array.
- Aligned the shared orchestration contracts across Frankenstein, planner, verifier,
  remediation, and release flows so session-scoped context, repeated reviewer passes,
  and repair ownership use the same canonical schema.
- Updated the adapter sync generator to support canonical shared execution metadata in
  root agent/workflow definitions when present, while transparently falling back to
  existing adapter metadata during the migration.
- Extended adapter sync to generate rule adapters for both `claude-code/rules/` and
  `github-copilot/instructions/` from canonical root `rules/`.
- Removed the redundant `github-copilot/commands/` workflow-manifest surface so GitHub
  Copilot workflow adapters now live only under `github-copilot/prompts/`.
- Removed redundant `claude-code/scripts/{diagnose.sh,detect-platform.sh,backfill-changelog-tags.sh}` copies so Claude keeps only live runtime scripts there and changelog helpers stay canonical under `skills/changelog/scripts/`.
- Removed stale installer and README references to deleted surfaces such as
  `claude-code/docs`, `github-copilot/bundles`, and absent OpenAI Codex bundle metadata.
- Broadened the generated-asset CI gate to watch rules, skills, indexed hooks, and
  Claude bundle manifests, and removed the brittle hardcoded workflow-version assertion
  from `scripts/generate-index.js --test`.
- Updated generated OpenAI Codex agent adapters to emit readable multiline TOML for
  `developer_instructions` instead of a single escaped line, while preserving the exact
  canonical instruction body in smoke tests.
- Removed the remaining GitHub Copilot command manifest layer and the stale docs,
  installer wiring, integrity checks, and CI expectations that still referenced it.
- Replaced the hardcoded lint workflow version assertion in `scripts/generate-index.js`
  with a dynamic SemVer/parity check so generator smoke tests follow the current release
  state instead of a frozen version constant.
- Normalized retro/improve storage guidance around `~/agent-retros`, added explicit
  pre-planner recon mode for `autoresearch-analyst`, and expanded the generated-asset
  smoke coverage to verify the new release metadata path.

### Removed

- Deleted the last unused `github-copilot/commands/*/manifest.json` files and the
  obsolete migration TODO that still described per-manifest dependency work no longer
  present in the repository.

## [4.1.0] - 2026-04-14

### Added

- `claude-code/tools/retros/`: scrub/normalize/validate/index tooling + JSON Schema for retro corpus migration.
- `claude-code/retros/`: scrubbed public retro corpus (38 retros, PII-redacted with bmjcoding/ and commit SHAs preserved).

### Changed

- `skills/retro` bumped to v5.0.0: finalization Save step updated for canonical v5.0 schema; directory save paths updated for reshaped layout.

## [4.0.0] - 2026-04-13

### Changed — Breaking

- **`manifest.json` files deleted across all 55 claude-code components** (15 agents, 6 commands, 9 hooks, 8 bundles, 4 rules, 13 skills) plus `claude-code/dependencies.json`. Dependency metadata now lives in YAML frontmatter: agents declare peer agents via `tools: Agent(name, ...)` in their `.md` frontmatter; skills and commands declare skill dependencies via a `skills:` list in frontmatter. Hooks carry no dependency metadata (leaf nodes by design).
- **Bundles migrated from `manifest.json` to `bundle.yaml`** — each bundle directory now contains `bundle.yaml` (YAML, not JSON) with `id`, `name`, `description`, `status`, `tags[]`, and `components[]` fields. The old flat JSON `manifest.json` files are deleted.
- **`scripts/generate-index.js` rewritten** to parse YAML frontmatter from `.md` files and `bundle.yaml` files instead of reading `manifest.json`. The generator remains the canonical entry point for rebuilding `index.json`; re-run after any component addition or frontmatter change.
- **`claude-code/README.md` updated** — bundle format description updated from JSON manifest to YAML; frontmatter-driven dependency model documented in the Component Format Reference section.

### Removed

- 55 `manifest.json` files under `claude-code/` (one per component across agents, commands, hooks, bundles, rules, skills).
- `claude-code/dependencies.json` — tool-level external dependency declarations superseded by frontmatter-embedded metadata.

### Migration

No action required for users who install via symlinks (`./claude-code/scripts/install.sh`). The symlink targets are unchanged. If you previously called `generate-index.js` in CI, re-run it after pulling to regenerate `index.json` from frontmatter.

## [3.2.0] - 2026-04-13

### Added

- `components[]` field on all 24 bundle manifests (8 per tool, across claude-code, github-copilot, openai-codex). Each entry carries `type`, `id`, and `role` (`core` | `optional` | `dep`). Bundle manifests are now the single source of truth for composition.
- `dependencies[]` field on all 45 agent manifests (15 per tool). Each entry carries `type`, `id`, `optional`, and an optional `reason` string. The `frankenstein` agent declares 17 primitive dependencies (skills, commands, hooks) and 14 agent-type dependencies; `planner` declares 1 optional agent dependency (`plan-reviewer`).
- `commands-unsupported/` primitive directory for openai-codex, containing 6 command-stub manifests (`status: unavailable`) documenting that Codex CLI has no user-defined slash-command mechanism. These stubs are indexed by `generate-index.js` and surfaced as unavailable options in the ALT Central download matrix.
- Cross-reference validation in `scripts/generate-index.js`: exits with code 1 and names every broken reference when any `components[].id` or `dependencies[].id` does not resolve to a real same-tool manifest entry. Ships with an inline `--test` harness (3 test cases).
- Notes in 3 bundle manifests documenting where openai-codex command primitives diverge from claude-code equivalents (no user-defined slash commands).
- Total manifest count increased from 156 to 165.

### Removed

- 24 sibling composition files (`bundles/<name>.json`) across all three tools. Composition data has migrated to each bundle's `manifest.json` `components[]` field. The sibling files had become a second source of truth and were deleted to prevent drift.

### Changed

- `scripts/generate-index.js` extended with `validateCrossRefs()` — the generator now validates all cross-references before writing `index.json`. The generator remains the canonical entry point for rebuilding the catalog; re-run after any manifest addition or modification.

## [3.1.0] - 2026-04-12

### Added

- `manifest.json` per primitive across all 156 primitives (13 skills × 3 tools + agents, hooks, commands, rules × 3 tools). Each manifest captures `id`, `name`, `type`, `tool`, `version`, `ref`, `download_url`, `install_path`, `install_command`, `files`, `status`, and `experimental` fields.
- `scripts/generate-index.js` — Node.js generator (uses only `fs` and `path` builtins) that walks all `<tool>/<primitive-type>/<name>/manifest.json` paths and writes `index.json` as a root-level JSON array. Re-run after adding any manifest.
- `index.json` at the repository root — machine-readable catalog of all 156 manifests; consumed by ALT Central's backend `fetchInstallOptions` service with a 5-minute cache and 1 MB size cap.

## [3.0.0] - 2026-04-12

### Changed — Breaking

- Historical note: this release temporarily moved shared skills and rules into tool-local
  copies before the canonical root `skills/` and `rules/` ownership model was restored.
- Historical note: Claude installer wiring briefly targeted tool-local rule and skill
  directories before returning to repo-root shared content.
- Historical note: tag ownership guidance briefly shifted toward tool-local shared-content
  namespaces before returning to `skill/<slug>` and `rule/<slug>`.

### Added

- **`/docs` root directory** created with repo-wide ADR files:
  `docs/adr/0004-per-component-changelog-tag-format.md` and
  `docs/adr/0005-multi-tool-restructure.md`.
- **`dependencies.json` per tool** — each tool directory now contains a
  `dependencies.json` (schema v1.0) declaring its external tool dependencies.
- **10 parity gaps resolved across GitHub Copilot and OpenAI Codex CLI:**
  - Copilot: fixed `mode:` → `agent:` field in 6 prompt files.
  - Copilot: added skill-wrapper surfaces during the intermediate per-tool-copy phase.
  - Copilot: added 9 hook equivalent instruction files under `github-copilot/hooks/`.
  - Codex: rewrote `hooks.json` to the nested `{"hooks": [...]}` format required by
    Codex CLI v0.120.0+.
  - Codex: fixed 3 `config.toml.template` schema errors (`[[skills.config]]` table
    format, `instructions_template` key, `timeout` type).
  - Codex: corrected `install.sh` hooks path from the erroneous
    `~/.openai-codex/hooks.json` location to `~/.codex/hooks.json`.

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
  `claude-code/agents/frankenstein.md`
  from integration-verifier review (phase 3a).

## [2.0.0] - 2026-04-12

### Changed — Breaking

- **Repository renamed** on GitHub from `claude-toolkit` to `agent-toolkit`.
- **Top-level layout restructured** into per-tool directories:
  - `claude-code/` — Claude Code agents, commands, hooks, bundles, docs, scripts
  - `github-copilot/` — GitHub Copilot (VS Code / cloud) agents, prompts, instructions
  - `openai-codex/` — OpenAI Codex CLI agents, config templates
  - `shared/` — temporary staging area used during the intermediate migration phase
- **Skills path changed**: `skills/` briefly moved through `shared/skills/` during the
  migration path and was later restored as the root canonical location.
- **Rules path changed**: `rules/` briefly moved through `shared/rules/` during the
  migration path and was later restored as the root canonical location.
- **Tag format changed**: component tags now use `<tool>/<slug>-v<version>` (e.g.
  `agent/frankenstein-v3.0.0`, `skill/changelog-v3.0.0`, `claude-code/branch-guard-v3.0.0`) instead of the
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
- Temporary migration staging for shared rule content during the v2 restructure.

### Migration guide

1. Pull the latest `main` (or `feat/agent-toolkit-layout-v2`).
2. Remove stale symlinks: `rm ~/.claude/{agents,commands,docs,hooks,rules,skills}`.
3. Re-run the install script: `./claude-code/scripts/install.sh`.
4. Verify: `./claude-code/scripts/install.sh --check`.

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/v4.7.0...HEAD
[4.7.0]: https://github.com/bmjcoding/agent-toolkit/compare/v4.6.1...v4.7.0
[4.6.1]: https://github.com/bmjcoding/agent-toolkit/compare/v4.6.0...v4.6.1
[4.6.0]: https://github.com/bmjcoding/agent-toolkit/compare/v4.5.0...v4.6.0
[4.5.0]: https://github.com/bmjcoding/agent-toolkit/compare/v4.4.0...v4.5.0
[4.4.0]: https://github.com/bmjcoding/agent-toolkit/compare/v4.3.0...v4.4.0
[4.3.0]: https://github.com/bmjcoding/agent-toolkit/compare/v4.2.1...v4.3.0
[4.2.1]: https://github.com/bmjcoding/agent-toolkit/compare/v4.2.0...v4.2.1
[4.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/v4.1.0...v4.2.0
[4.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/v4.0.0...v4.1.0
[4.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/v3.2.0...v4.0.0
[3.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/v3.1.0...v3.2.0
[3.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/v2.0.0...v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/releases/tag/v2.0.0
