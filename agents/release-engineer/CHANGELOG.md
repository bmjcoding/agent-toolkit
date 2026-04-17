# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Step 2 now distinguishes routine PRs from actual release cuts: contributors may keep
  in-flight notes under `## [Unreleased]` until release time instead of promoting every
  PR into a dated version section just to satisfy CI.

## [5.2.0] - 2026-04-16

### Changed

- Release-engineer now records expected tags during changelog promotion, creates signed annotated tags immediately after the matching release commit, and pushes with `--follow-tags` so PR-bound changelog releases cannot land without their tags.
- Manifest-version releases now use signed annotated root tags (`git tag -s -m "vX.Y.Z" "vX.Y.Z"`) instead of unsigned lightweight tags.

## [5.1.0] - 2026-04-15

### Changed

- Declared canonical `lifecycle` metadata in the shared root definition so the distribution catalog can publish maturity separately from per-tool availability for this agent.
- Release-engineer now treats PR-bound changelog promotion as part of Step 2: touched
  components must be moved out of `## [Unreleased]` into a versioned section before the
  PR is opened, while branch-local work can still accumulate under `## [Unreleased]`
  until that promotion point.

- Resolved default-branch handling across PR-description, lint, and publish steps and
  clarified that publish-phase-only runs must not perform version bumps.
- Updated the Claude adapter reference to the flattened `claude-code/agents/<name>.md`
  layout used by the tool-specific generated surfaces.

## [5.0.0] - 2026-04-15

### Changed

- Declared shared execution metadata in the canonical root definition so model tier, capabilities, subagent routing, and skill dependencies no longer need to be inferred from tool-specific wrappers.

- Moved the canonical agent definition and changelog to `agents/release-engineer/`; Claude, Copilot, and Codex files are now tool-specific adapters generated from the shared source.
- Updated comparison links to use the shared `agent/release-engineer` tag namespace for this root canonical component.
- Step 2.4 now calls `/changelog release` to atomically promote `[Unreleased]` entries, create the versioned commit, apply the per-component tag, and push — replacing the previous multi-step inline sequence.

### Added

- Standalone Use section documenting how to invoke release-engineer directly (outside a frankenstein pipeline) with a minimal dispatch prompt.

### Removed

- Removed the redundant Claude-specific changelog copy from `claude-code/agents/release-engineer/CHANGELOG.md`.

### Fixed

- Tag format corrected from bare `v<version>` to the required `<slug>-v<version>` per-component format; bare tags were non-conformant and caused changelog comparison links to resolve to the wrong object.

## [4.0.1] - 2026-04-14

### Fixed

- Publish-phase operating mode: handoff instruction corrected from `status: done` to `status: needs_human` for the publish-phase truncation case. A truncated push/PR-creation phase cannot report done — it requires human intervention to complete.

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- BREAKING: restructured for v3.0 per-tool layout. Claude Code remains under `claude-code/` for tool-native assets. At that point in history, shared rules and skills were described as living under `claude-code/rules/` and `claude-code/skills/`.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - `agents/release-engineer/` → `claude-code/agents/release-engineer/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.3.0] - 2026-04-12

### Changed

- Commit-phase split: commit preparation (staging files and drafting commit message) is now a discrete step separated from commit execution, allowing human review of the staged diff and message before the commit is finalized (REC-6).

## [1.1.0] - 2026-04-11

### Added

- Changelog skill integration — generates CHANGELOG.md entries before commit
- `--no-changelog` flag to skip changelog generation

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/agent/release-engineer-v5.2.0...HEAD
[5.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/release-engineer-v5.1.0...agent/release-engineer-v5.2.0
[5.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/release-engineer-v5.0.0...agent/release-engineer-v5.1.0
[5.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/agent/release-engineer-v5.0.0
[4.0.1]: https://github.com/bmjcoding/agent-toolkit/compare/agent/release-engineer-v4.0.0...agent/release-engineer-v4.0.1
[4.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/release-engineer-v3.0.0...agent/release-engineer-v4.0.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/release-engineer-v2.0.0...agent/release-engineer-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/release-engineer-v1.3.0...agent/release-engineer-v2.0.0
[1.3.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/release-engineer-v1.2.0...agent/release-engineer-v1.3.0
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/agent/release-engineer-v1.0.0...agent/release-engineer-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/agent/release-engineer-v1.0.0
