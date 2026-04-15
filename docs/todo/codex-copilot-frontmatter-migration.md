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
- Canonical shared hook logic now lives under `hooks/<slug>/<slug>.sh`, while
  `openai-codex/hooks/hooks.json` remains the Codex registry surface and
  `openai-codex/hooks/<slug>/` may still carry thin adapters where payload normalization is
  needed. If hook dependency metadata is needed, decide whether it belongs in the shared
  hook owner or in the Codex registry layer before wiring the aggregator.
- `openai-codex/bundles/` and `openai-codex/hooks/hooks.json` serve as the bundle/hook registries;
  update both as part of the migration.

**Work items:**

- [ ] Add TOML-manifest support to the dependency aggregation script (or add a shim that converts
  TOML agent manifests to the expected format).
- [ ] Decide where hook dependency metadata should live for Codex now that hook scripts are
  nested per component and the tool-facing registry is `hooks.json`.
- [ ] Re-run aggregation and verify `openai-codex/dependencies.json` reflects all per-manifest deps.
- [ ] Add `[Unreleased]` CHANGELOG entries for hooks/ and agents/ CHANGELOGs.

---

## github-copilot/

**Blockers / differences from claude-code:**

- Uses `instructions/`, `prompts/`, and `rules/` directories with `.instructions.md` files and
  `applyTo` frontmatter globs — confirm the aggregator ignores `applyTo` and only reads
  `dependencies` frontmatter keys.
- Canonical shared hook logic now lives under `hooks/<slug>/<slug>.sh`, while GitHub
  Copilot keeps `github-copilot/hooks/<slug>/` as the manifest-plus-adapter surface. If
  dependency metadata is needed for hooks, decide whether it belongs on the Copilot
  manifest, the shared hook owner, or both.

**Work items:**

- [ ] Verify manifest format parity (or document divergence) between github-copilot/ and claude-code/.
- [ ] Run aggregator against github-copilot/; produce `github-copilot/dependencies.json`.
- [ ] Update CHANGELOG for any github-copilot/ components that gain frontmatter dependency keys.
