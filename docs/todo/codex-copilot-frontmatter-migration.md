# TODO: Review Dependency-Metadata Gaps for openai-codex and github-copilot

**Created:** 2026-04-13
**Context:** The `claude-code/` subtree completed its migration to frontmatter-driven
dependency metadata in PR-2 (see ADR-0005 and recent CHANGELOG entries). The
`openai-codex/` and `github-copilot/` surfaces still diverge, and the repo no longer
ships separate tool-local bundle registries or `dependencies.json` catalogs for them.

---

## openai-codex/

**Current differences from claude-code:**

- Agent definitions are TOML files (`openai-codex/agents/*.toml`), not Markdown/YAML
  wrappers, so any dependency aggregator must parse TOML or consume the canonical
  `agents/` metadata instead.
- Hooks are a flat shell-script surface plus `openai-codex/hooks/hooks.json`; there is no
  per-hook manifest layer today.
- This subtree currently has no checked-in Codex bundle registry or tool-local
  `dependencies.json`, so the desired output format needs to be decided before any
  migration work starts.

**Work items:**

- [ ] Decide whether Codex dependency metadata should live in `index.json`, in canonical
  frontmatter only, or in a new Codex-local manifest.
- [ ] If Codex-local metadata is still desired, add TOML parsing support or a canonical
  adapter layer for `openai-codex/agents/*.toml`.
- [ ] Define how hook dependency metadata should be represented for the flat
  `openai-codex/hooks/` surface.
- [ ] Add `[Unreleased]` CHANGELOG entries for any Codex components touched by the
  chosen approach.

---

## github-copilot/

**Current differences from claude-code:**

- Uses generated `agents/`, `prompts/`, and `instructions/` Markdown adapters rather than
  bundle manifests or tool-local dependency catalogs.
- Has hook definitions, but they are paired `.sh` and `.json` runtime assets rather than
  the Claude directory layout.

**Work items:**

- [ ] Decide whether GitHub Copilot needs a tool-local dependency catalog at all, or
  whether `index.json` plus canonical metadata is sufficient.
- [ ] Document the intended source of truth for Copilot hook dependency metadata.
- [ ] Update CHANGELOG entries for any Copilot components that gain new metadata fields.
