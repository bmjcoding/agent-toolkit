# 0005. Multi-Tool Restructure: agent-toolkit Layout v2

Date: 2026-04-12

## Status

Accepted

## Context

The toolkit started as a Claude Code-only set of agent definitions, hooks, slash commands, and skills living at the root of the `claude-toolkit` repository. The install convention was six symlinks from `~/.claude/{agents,commands,docs,hooks,rules,skills}` directly into the repo root.

As the toolkit expanded, two new user categories emerged: GitHub Copilot users (VS Code IDE extension) and OpenAI Codex CLI users. Serving all three tools from a single flat layout exposed fundamental incompatibilities:

- **Format divergence**: Claude Code components use Markdown with YAML frontmatter. Codex CLI agents use TOML (`agents/*.toml`). GitHub Copilot instructions use Markdown with a different frontmatter schema (`applyTo`, `description` keys) placed under `.github/`. A single frontmatter schema cannot satisfy all three.
- **Tool-specific semantics**: AGENTS.md is a native convention for Codex CLI and GitHub Copilot (both read it automatically from the project root). Claude Code does NOT natively read AGENTS.md — it reads CLAUDE.md. Skills and reusable rule content is shareable, but the entry-point file and installation path differ per tool.
- **Install path collision**: `~/.claude/` belongs to Claude Code. Codex CLI uses `~/.codex/agents/`. Copilot reads `.github/copilot-instructions.md` and `.github/instructions/*.md` from the project. A single root-level symlink layout cannot serve all three without conflicts.
- **Tag format mismatch**: The per-component tag format `{slug}-v{version}` (ADR 0004) assumed a flat directory structure. In a multi-tool repo, components at `claude-code/agents/frankenstein/frankenstein.md` need either a new tag format or a verified slug-uniqueness guarantee across tool subtrees.

## Decision

### 1. Rename repository

The GitHub repository is renamed from `claude-toolkit` to `agent-toolkit`. This is an infrastructure-level change with a direct GitHub rename (`gh repo rename`) and a local remote URL update. The 58 files that hardcoded the `claude-toolkit` string are updated in commit `e4fb81d`.

### 2. Top-level per-tool directory structure

Updated 2026-04-12 for v3.0.0 restructure.

```
agent-toolkit/
  docs/            # Repo-wide documentation
    adr/           # Architecture Decision Records (repo-wide scope)
    ux/            # UX design specs (multi-tool scope)
  claude-code/     # Claude Code — fully self-contained
    agents/        # 15 agent definitions
    commands/      # 6 slash commands
    hooks/         # 9 shell hooks
    bundles/       # 8 curated install bundles
    skills/        # 13 skill definitions (Claude Code copy)
    rules/         # 4 rule sets (Claude Code copy)
    docs/          # Claude Code-specific ADRs and operational docs
    scripts/
  github-copilot/  # GitHub Copilot (VS Code) — fully self-contained
    agents/        # 15 .agent.md definitions
    instructions/  # 4 path-scoped instruction files
    prompts/       # 6 reusable prompt files
    hooks/         # 9 hook JSON files
    bundles/       # 8 curated install bundles
    skills/        # 13 skill wrappers
    rules/         # 4 rule sets (Copilot copy)
    mcp/           # MCP server config template
    scripts/
  openai-codex/    # OpenAI Codex CLI — fully self-contained
    agents/        # 15 .toml agent definitions
    hooks/         # 9 .sh scripts + hooks.json
    bundles/       # 8 curated install bundles
    skills/        # 13 skill definitions
    rules/         # 4 rule sets (Codex copy)
    scripts/
  AGENTS.md        # Repo-wide instructions (read natively by all 3 tools)
```

Each tool directory is fully self-contained. There are no shared `skills/` or `rules/` directories at the repository root; each tool carries its own copy of skills and rules within its subtree.

### 3. AGENTS.md at repo root

`AGENTS.md` at the repository root contains tool-agnostic rules. It is the native instruction file for both Codex CLI (reads it automatically) and GitHub Copilot (reads it automatically when present). This eliminates the need to duplicate shared rules into each tool-specific directory for those two tools.

### 4. CLAUDE.md imports AGENTS.md via @-import

Claude Code does not natively read `AGENTS.md`. To avoid duplicating the shared rules, `CLAUDE.md` at the repo root begins with:

```
@AGENTS.md
```

This is Claude Code's documented @-import syntax. It instructs Claude Code to read `AGENTS.md` first, then apply any Claude Code-specific additions that follow in `CLAUDE.md`. This is the bridge pattern — not a symlink (see Alternatives Considered).

### 5. Skills and rules embedded within each tool directory

Each tool directory (`claude-code/`, `github-copilot/`, `openai-codex/`) carries its own copy of the 13 skills and 4 rules. There is no shared root-level source of truth; every tool subtree is fully self-contained. Claude Code symlinks point to `claude-code/skills/` and `claude-code/rules/`. GitHub Copilot and Codex install scripts wire their own copies. See Addendum below for the historical record of how this decision evolved from the initial v2.0.0 design.

### 6. Version bumps

All 48 components receive a `v2.0.0` major version bump to mark the breaking layout change. This is consistent with the per-component versioning established in ADR 0004.

### 7. New tag format

Tags use the format `<namespace>/<slug>-v<version>`:
- `claude-code/<slug>-v<ver>` for Claude Code agents, commands, hooks
- `skill/<slug>-v<ver>` for universal skills under `skills/`
- `rule/<slug>-v<ver>` for universal rules under `rules/`
- `github-copilot/<slug>-v<ver>` for Copilot-specific content
- `openai-codex/<slug>-v<ver>` for Codex-specific content

### 8. GitHub Copilot scope

The `github-copilot/` subtree targets VS Code IDE integration only. It does not cover the GitHub Copilot cloud agent (github.com chat) or the GitHub Copilot CLI. This constraint is explicit because the VS Code instruction file format (`.github/instructions/*.md` with `applyTo` frontmatter) is specific to the IDE extension and is not shared with the cloud or CLI surfaces.

## Consequences

### Breaking change: symlink retargeting required

Users with the v1 install have symlinks pointing into the old root-level directories:

```
~/.claude/agents  -> /path/to/claude-toolkit/agents
~/.claude/skills  -> /path/to/claude-toolkit/skills
# etc.
```

After the restructure, these paths no longer exist. Running `claude-code/scripts/install.sh` retargets all six symlinks atomically to the new paths under `claude-code/`, `skills/`, and `rules/`. The script is idempotent and supports `--dry-run` and `--check` flags. Users must run this script to restore a working install. See `claude-code/docs/migration-v2.md` for the full upgrade procedure.

### Bulk reference update

The 58 files containing the `claude-toolkit` literal string required updates. This included 48 CHANGELOG.md comparison URLs, 3 hook scripts with security-critical regex patterns, and several documentation files. All were updated in commit `e4fb81d` on this branch.

### Hook script regex updates

Three hook scripts required regex updates for the new directory structure:

- `protect-config.sh`: the `PROTECTED` path regex updated from `claude-toolkit/` to `agent-toolkit/`.
- `toolkit-drift-check.sh`: the `COMPONENT_PATTERN` updated to match components at their new nested paths under `claude-code/`, `skills/`, and `rules/`.
- `toolkit-edit-reminder.sh`: both the grep pattern and the displayed reminder message updated to reference `agent-toolkit` and the new path conventions.

### Tag lineage

The tag format change means that existing tags like `frankenstein-v1.5.0` do not roll forward to `claude-code/frankenstein-v2.0.0` automatically. `scripts/backfill-changelog-tags.sh` handles creation of the new-format tags. Old-format tags remain in the repository and are not deleted.

## Alternatives Considered

### Flat layout with frontmatter-discriminated tools

Keep all content at the repo root; add a `tool: claude-code | copilot | codex` frontmatter key to discriminate. Rejected because the format differences between tools are structural, not just frontmatter-deep. Codex uses TOML files, not Markdown. Copilot instructions use `applyTo` globs that have no meaning in Claude Code. A flat layout with discriminating frontmatter would require every consumer to parse and filter the full component list rather than navigating to a tool-specific directory.

### `.agent/` unified directory

Place all tool-specific content under a single `.agent/` directory in each project. Rejected because there is no single directory path that works for all three tools: Claude Code reads `~/.claude/`, Codex CLI reads `~/.codex/agents/`, and Copilot reads `.github/`. A `.agent/` directory would require each tool to be configured to look there — which is not supported by any of them without forking or patching.

### AGENTS.md ↔ CLAUDE.md symlink bridge

Symlink one file to the other so they stay in sync. Rejected because neither tool officially supports symlinked instruction files; behavior is undefined when the resolved target is outside the expected lookup path. Claude Code's `@import` directive is the documented mechanism for composing instruction files and is the correct approach for this use case.

## References

- ADR 0001: `claude-code/docs/adr/0001-frankenstein-agent-teams-migration.md` — agent roster and hook inventory
- ADR 0004: `docs/adr/0004-per-component-changelog-tag-format.md` — tag format and changelog URL generation
- Migration guide: `claude-code/docs/migration-v2.md`
- Install script: `claude-code/scripts/install.sh`
- Drift check hook: `claude-code/hooks/toolkit-drift-check/toolkit-drift-check.sh`

---

## Addendum 2026-04-12: Full Port + /skills + /rules Root Relocation

After the initial v2.0.0 restructure (above), the layout underwent a second wave of changes to complete full parity across all three tool surfaces and to relocate shared content from `shared/` to the repository root.

### Scope of changes

**Root relocation of shared content**: `shared/skills/` and `shared/rules/` moved to `/skills/` and `/rules/` at the repository root. The `shared/` directory is removed entirely. This change makes universal content more discoverable and simplifies the install script logic — there is no longer a `shared/` indirection layer. Symlink targets updated from `shared/skills` and `shared/rules` to `skills` and `rules` directly.

**Full GitHub Copilot port**: The `github-copilot/` subtree now contains full parity content:
- 15 agents (`.agent.md` format for VS Code, `.md` for cloud)
- 4 instruction files under `github-copilot/instructions/` — one per universal rule (docker, logging, node, python) adapted to Copilot `applyTo` frontmatter
- 6 prompt files under `github-copilot/prompts/` — direct equivalents of the 6 Claude Code slash commands
- `github-copilot/skills/` retains the `changelog` wrapper; other skills are discoverable via install-time symlink `.github/skills → /skills`

**Full OpenAI Codex CLI port**: The `openai-codex/` subtree now contains:
- 15 agents in TOML format
- 9 hook shell scripts plus `hooks.json` in `openai-codex/hooks/`
- `config.toml.template` with 13 `[[skills.config]]` entries covering all universal skills

**Tag namespace update**: The `shared/<slug>-v<ver>` tag namespace is replaced by:
- `skill/<slug>-v<ver>` for universal skills
- `rule/<slug>-v<ver>` for universal rules

Existing `shared/` tags remain in the repository for lineage but are not used for new releases.
