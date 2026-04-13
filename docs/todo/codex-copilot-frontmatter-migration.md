# TODO: Extend Frontmatter-Driven Dependency Migration to openai-codex and github-copilot

**Created:** 2026-04-13
**Context:** The claude-code/ subtree completed its migration to frontmatter-driven per-manifest dependency
aggregation in PR-2 (see ADR-0005, recent CHANGELOG entries). The openai-codex/ and github-copilot/
subtrees have not yet received this treatment.

---

## openai-codex/

**Blockers / differences from claude-code:**

- Agent definitions are TOML files (`openai-codex/agents/*.toml`), not JSON — the dependency
  aggregation script must parse TOML or accept a different manifest format.
- Hooks are flat `.sh` scripts with companion `manifest.json` files rather than the claude-code
  hook structure. Confirm whether manifest.json already carries a `dependencies` key; if not,
  add one before wiring the aggregator.
- `openai-codex/bundles/` and `openai-codex/hooks/hooks.json` serve as the bundle/hook registries;
  update both as part of the migration.

**Work items:**

- [ ] Add TOML-manifest support to the dependency aggregation script (or add a shim that converts
  TOML agent manifests to the expected format).
- [ ] Audit each `hooks/*.sh` companion `manifest.json` for a `dependencies` field; backfill where
  missing.
- [ ] Re-run aggregation and verify `openai-codex/dependencies.json` reflects all per-manifest deps.
- [ ] Add `[Unreleased]` CHANGELOG entries for hooks/ and agents/ CHANGELOGs.

---

## github-copilot/

**Blockers / differences from claude-code:**

- Uses `instructions/`, `prompts/`, and `rules/` directories with `.instructions.md` files and
  `applyTo` frontmatter globs — confirm the aggregator ignores `applyTo` and only reads
  `dependencies` frontmatter keys.
- No hooks equivalent in github-copilot/; skip hooks migration step for this subtree.

**Work items:**

- [ ] Verify manifest format parity (or document divergence) between github-copilot/ and claude-code/.
- [ ] Run aggregator against github-copilot/; produce `github-copilot/dependencies.json`.
- [ ] Update CHANGELOG for any github-copilot/ components that gain frontmatter dependency keys.
