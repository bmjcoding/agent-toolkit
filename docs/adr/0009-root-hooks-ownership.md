# 0009. Promote Root `hooks/` to Canonical Shared Ownership

Date: 2026-04-15

## Status

Accepted

## Migration Complete

As of 2026-04-15, this ADR is implemented for the retained shared hook set:

- root `hooks/` is now the canonical owner of shared hook logic and hook changelogs
- Claude installs `~/.claude/hooks` from repo-root `hooks/`
- GitHub Copilot keeps generated manifest-plus-adapter hook directories under
  `github-copilot/hooks/<slug>/`
- OpenAI Codex keeps generated adapter directories plus `openai-codex/hooks/hooks.json`
- `toolkit-drift-check` and `toolkit-edit-reminder` were removed rather than migrated

Tool-local adapters remain part of the intended end state where runtime differences require
them; completion does **not** mean eliminating Copilot/Codex adapter files.

## Context

ADR-0005 established the core multi-tool ownership model:

- root `skills/` is canonical for shared skills
- root `rules/` is canonical for shared rules
- root `agents/` is canonical for shared agent bodies
- root `workflows/` is canonical for shared workflow bodies
- tool directories contain tool-native adapters and runtime assets

Hooks are now the main remaining mismatch in that model.

Today, the repository carries hook logic under all three tool surfaces:

- `claude-code/hooks/`
- `github-copilot/hooks/`
- `openai-codex/hooks/`

That creates two problems:

1. **Ownership drift**

   Hook policy logic is effectively duplicated across tool directories even though the
   underlying intent is largely shared.

2. **Adapter confusion**

   The repository mixes canonical hook logic with tool-specific packaging concerns such as:

   - Claude settings examples and install paths
   - VS Code Copilot `.json` manifests under `.github/hooks/*.json`
   - Codex `hooks.json` registry wiring

Recent analysis showed the duplication is real and mostly unnecessary:

- all three tools originally exposed the same 9 logical hooks
- `github-copilot/` and `openai-codex/` shell hook bodies were functionally identical after
  stripping comments
- Claude hook bodies were also functionally identical for 5 of the 9 hooks
- the remaining 4 hooks differed mostly due to historical policy drift, not because the
  tools fundamentally needed different policy logic

At the same time, vendor documentation confirms that the runtime adapter surfaces are **not**
identical:

### Claude Code

Official docs confirm:

- hooks are configured in JSON settings files
- handlers can reference scripts by path
- command hooks receive Claude-style JSON on stdin such as `tool_name` and `tool_input`

Source: <https://code.claude.com/docs/en/hooks>

### GitHub Copilot for VS Code

Official docs confirm:

- workspace hooks are discovered from flat `.github/hooks/*.json`
- VS Code also reads Claude-format hook files for compatibility
- VS Code parses Claude matcher syntax but currently ignores matcher values
- VS Code uses different tool names and often camelCase tool input fields

Source: <https://code.visualstudio.com/docs/copilot/customization/hooks>

### OpenAI Codex

Official docs confirm:

- hooks are experimental and gated behind `features.codex_hooks = true`
- Codex discovers `hooks.json` next to active config layers
- current `PreToolUse` and `PostToolUse` runtime only emits `Bash`

Sources:

- <https://developers.openai.com/codex/hooks>
- <https://developers.openai.com/codex/config-reference>

So the repo has both:

- a strong reason to centralize hook ownership
- a strong reason to preserve tool-local adapter layers

## Decision

### 1. Root `hooks/` becomes the canonical shared owner of hook logic

The repository will promote a new root `hooks/` tree to be the single source of truth for
shared hook implementations and hook changelogs.

Canonical shared hook logic should live under:

```text
hooks/<slug>/<slug>.sh
hooks/<slug>/CHANGELOG.md
```

### 2. Tool directories will keep hook adapter surfaces only

Tool directories remain responsible only for the parts required by their documented runtime:

- `claude-code/` keeps Claude-specific install wiring, docs, and examples
- `github-copilot/` keeps VS Code Copilot hook manifests
- `openai-codex/` keeps Codex hook registry assets

Tool directories will no longer be treated as the canonical owner of shared hook logic.

### 3. Standardize on “shared logic, thin adapters”

The target architecture is:

- shared canonical shell logic in root `hooks/`
- thin tool-local adapters only where required by the documented runtime

This means:

- Claude should reference root hook paths directly through its configured command paths
- GitHub Copilot should keep tool-local manifest and adapter surfaces, with adapters
  delegating to root hook scripts
- Codex should keep `hooks.json` plus any required tool-local adapters, with those
  adapters delegating to root hook scripts

### 4. Deduplication must respect documented runtime differences

Promoting root `hooks/` does **not** imply assuming identical hook payloads or matcher
semantics across tools.

The repository must preserve explicit adapter behavior for:

- Copilot’s flat `.github/hooks/*.json` discovery model
- Copilot’s differing tool names and camelCase payload fields
- Copilot’s current behavior of ignoring matcher values
- Codex’s `hooks.json` discovery model
- Codex’s current `Bash`-only runtime for `PreToolUse` and `PostToolUse`

If a shared hook script cannot safely consume multiple tools’ documented payloads directly,
the tool-local adapter should normalize the payload before delegating to the shared logic.

### 5. Hook tag namespace becomes explicit

Shared hooks will use a root-owned namespace:

- `hook/<slug>-vX.Y.Z`

This separates shared hook ownership from the existing tool-local namespaces.

### 6. Migration will be phased, not atomic

The repository will not delete current tool-local hook implementations until:

- root `hooks/` exists
- adapter paths are retargeted
- Copilot payload differences are explicitly handled
- Codex runtime limitations are reflected in the active registry config

## Consequences

### Positive

- hook policy logic can be edited once instead of drifting across tool directories
- the ownership model becomes consistent with ADR-0005
- tool directories become cleaner adapter surfaces instead of mixed ownership zones
- hook changelog ownership becomes explicit

### Neutral

- the repo may temporarily carry both canonical root hooks and tool-local adapter files
  during migration
- some hooks will still require tool-local normalization adapters even after ownership is
  centralized

### Negative

- migration complexity is non-zero because Copilot and Codex do not fully match Claude’s
  runtime model
- some existing Copilot and Codex hook configurations must be corrected before final
  deduplication
- release/tag tooling must be updated to understand the new root hook namespace

## Alternatives Considered

### 1. Keep hooks owned inside each tool directory

Rejected. This preserves current drift and contradicts the repository’s broader ownership
model for shared content.

### 2. Fully unify hook runtime behavior across tools

Rejected. Vendor documentation explicitly shows runtime differences, especially for VS Code
Copilot payloads and Codex event coverage. Treating those as identical would produce a
clean-looking repo with incorrect runtime behavior.

### 3. Keep hook logic duplicated but align directory shapes only

Rejected. Shape-only standardization improves readability but does not solve ownership,
drift, or changelog duplication.

## Follow-Up Work

1. Create root `hooks/` and seed it with the canonical shared implementations.
2. Reconcile the currently drifted hook behaviors that remain in scope:
   - `changelog-check`
   - `protect-config`
3. Retarget GitHub Copilot manifests and adapters to the canonical root `hooks/`, with
   payload normalization where needed.
4. Retarget Codex `hooks.json` and any required adapters to the canonical root `hooks/`,
   and remove non-effective matcher assumptions.
5. Retarget Claude install/docs to root `hooks/`.
6. Move canonical hook changelog ownership to root `hooks/`.
7. Update `AGENTS.md` to include root `hooks/` in the ownership model.

## References

- `AGENTS.md`
- `docs/adr/0005-multi-tool-restructure.md`
- <https://code.claude.com/docs/en/hooks>
- <https://code.visualstudio.com/docs/copilot/customization/hooks>
- <https://developers.openai.com/codex/hooks>
- <https://developers.openai.com/codex/config-reference>
