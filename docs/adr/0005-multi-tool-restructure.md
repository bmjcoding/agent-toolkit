# 0005. Shared-Content Restructure

Date: 2026-04-15

## Status

Accepted

## Context

The earlier multi-tool restructure pushed skills and rules into per-tool copies and
described each tool subtree as fully self-contained. That no longer matched the desired
ownership model:

- shared skill content should be edited once, not copied three times
- shared rule content should be edited once, not copied three times
- shared agent bodies should be edited once, not triplicated across tool formats
- shared workflow bodies should be edited once, not duplicated as Claude commands and Copilot prompts
- `AGENTS.md` should be the primary shared instruction surface
- `CLAUDE.md` should exist only as a one-line Claude compatibility shim
- GitHub Copilot for VS Code should rely on its supported `.github/*` discovery surfaces
  and not on Claude-specific compatibility paths
- OpenAI Codex should point directly at root shared skills and consume shared instructions
  from `AGENTS.md`

## Decision

### 1. Canonical shared content lives at the repo root

- Root `skills/` is the single source of truth for shared skills.
- Root `rules/` is the single source of truth for shared rules.
- Root `agents/` is the single source of truth for shared agent instruction bodies.
- Root `workflows/` is the single source of truth for shared workflow bodies.
- Shared skills are tagged as `skill/<slug>-vX.Y.Z`.
- Shared rules are tagged as `rule/<slug>-vX.Y.Z`.

### 2. Shared instructions are rooted in `AGENTS.md`

- `AGENTS.md` is the canonical shared instruction file for all tools.
- Root `CLAUDE.md` remains only as the one-line compatibility shim `@AGENTS.md`.

### 3. Tool directories contain only tool-native assets or adapters

- `claude-code/` keeps Claude-native agents, commands, hooks, bundles, generated rule
  adapters, and install scripts.
- `github-copilot/` keeps VS Code Copilot-native agents, prompts, generated instruction
  adapters, hooks, and installer assets.
- `openai-codex/` keeps Codex-native agents, hooks, config templates, and rule
  composition assets.

No tool directory owns the canonical content of a shared agent body, workflow body,
shared skill, or shared rule.

### 4. Claude Code consumes root skills and generated rule adapters

- `~/.claude/skills` points to repo-root `skills/`.
- `~/.claude/rules` points to generated adapters under `claude-code/rules/`.

### 5. GitHub Copilot for VS Code uses supported discovery surfaces

- `.github/agents`, `.github/instructions`, `.github/hooks`, and `.github/prompts` come
  from `github-copilot/`.
- Canonical shared content remains at the repo root; Copilot consumes only the
  VS Code-native adapter files under `github-copilot/`.

### 6. OpenAI Codex points directly at root shared skills

- `openai-codex/config.toml.template` references `${AGENT_TOOLKIT_DIR}/skills/<slug>/SKILL.md`
- Codex may also consume `.agents/skills -> skills/`
- `openai-codex/rules/` contains build/composition assets only

### 7. `prod-readiness` is a skill workflow, not a command

All documentation and tool-specific surfaces should refer to `prod-readiness` as a
skill/workflow. Command-style `prod-readiness` wording is retired outside of preserved
historical artifacts.

## Consequences

### Positive

- Shared content is edited once and reused everywhere.
- Version ownership is clearer.
- Tool installers are simpler and more accurate.
- Repo docs match the real filesystem and runtime wiring.

### Costs

- Older wrapper directories and duplicate copies must be removed.
- Tool docs and config templates require coordinated updates.
- Historical references may remain in archived retros or old release notes, but live source
  surfaces should no longer point at deleted tool-local skill trees.
