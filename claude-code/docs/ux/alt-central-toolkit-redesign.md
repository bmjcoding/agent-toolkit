# ALT Central — Agent Toolkit Page: Multi-Tool Redesign Plan

**Status:** Draft — for stakeholder review before implementation
**Date:** 2026-04-12
**Scope:** `/toolkit`, `/toolkit/:category/:itemId`, `/toolkit/bundle/:bundleId`

---

## 1. Summary

The current Agent Toolkit page at `/toolkit` is built exclusively around Claude Code: install paths reference `.claude/` directories, install commands use `claude skill install`, and the download dialog assumes a single tool audience. This redesign makes the toolkit page tool-agnostic by adding first-class support for GitHub Copilot (VS Code) and OpenAI Codex CLI alongside Claude Code. The goal is a unified catalog that surfaces the same components across all three tools — giving each tool equal visual weight, correct per-tool install paths, and a clear "shared vs tool-specific" badge system — without breaking the existing Claude Code experience. Users who only care about one tool should be able to filter to it and see exactly what applies to them; users who work across tools should be able to browse the full catalog and understand compatibility at a glance.

---

## 2. Design Principles

### 2.1 Unbiased Tool Treatment

- Items are sorted **alphabetically by name** within each category, regardless of tool. No tool receives a visual preference in ordering.
- All three tool badges — `claude-code`, `github-copilot`, `openai-codex` — use the **same visual weight** (identical chip size, identical typography). The only distinction is color hue, chosen to map to each tool's brand identity while remaining accessible at WCAG AA.
- A filtered view for any single tool must produce a grid that is visually indistinguishable in layout from any other filtered view. No tool-specific layout branches.
- The default view is "All tools" — no tool is pre-selected or given home-page prominence.

### 2.2 Install-Path Clarity

Every catalog card and detail page shows the install location for the **currently selected tool scope**. Install paths differ materially across tools:

| Tool | Project scope | Global scope |
|---|---|---|
| Claude Code | `.claude/<type>/` | `~/.claude/<type>/` |
| GitHub Copilot (VS Code) | `.github/<type>/` | `~/.copilot/<type>/` |
| Copilot Cloud Agent | `.github/agents/` or `.github/instructions/` | N/A |
| OpenAI Codex | `.codex/<type>/` | `~/.codex/<type>/` |

The `ToolkitDownloadDialog` must always show the resolved absolute path for the selected scope, never just a generic "install here" instruction.

### 2.3 Shared vs Per-Tool Differentiation

Items that work identically across all three tools (e.g., plain Markdown instruction files, AGENTS.md-compatible rules) are tagged `shared`. Items with tool-specific format requirements (e.g., a hook that uses `.claude/settings.json`, a Copilot `.agent.md`, a Codex `agents/` TOML) are tagged with one or more specific tools.

- A `shared` badge signals: copy this file anywhere — it will work.
- A tool chip (`claude-code`, `github-copilot`, `openai-codex`) signals: this item is adapted for this tool's format.
- Items may carry multiple tool chips when the format is compatible but the install path differs.
- The `namespace` field (see Section 3) captures this distinction in the data layer.

---

## 3. Schema Extension (`@alt-central/types`)

The following Zod delta extends `ToolkitItemSummary` and `ToolkitItemEntity`. All new fields are **optional** to remain non-breaking with existing mock data. Backend can populate them incrementally (see Section 9 Phase 1).

```ts
// packages/types/src/schemas/toolkit.ts — additions only

/** The three supported tools */
const ToolNameSchema = z.enum([
  "claude-code",
  "github-copilot",
  "openai-codex",
])
export type ToolName = z.infer<typeof ToolNameSchema>

/**
 * Which tools this item is compatible with.
 * Empty array or undefined = Claude Code only (backward-compatible default).
 */
const compatibleWithSchema = z.array(ToolNameSchema).optional()

/**
 * Per-tool filesystem install path (relative to project root for project scope,
 * relative to ~ for global scope). Used to generate install snippets.
 * Keys are ToolName values.
 */
const installPathsSchema = z.record(ToolNameSchema, z.string()).optional()

/**
 * Whether this item is shared across tools or specific to one.
 * "shared"       = works identically across all three tools
 * "claude-code"  = Claude Code-only (existing behavior)
 * "github-copilot" = Copilot-only
 * "openai-codex"   = Codex-only
 */
const namespaceSchema = z
  .enum(["shared", "claude-code", "github-copilot", "openai-codex"])
  .optional()

// Apply to ToolkitItemSummarySchema:
//   .extend({ compatibleWith: compatibleWithSchema, namespace: namespaceSchema })

// Apply to ToolkitItemEntitySchema:
//   .extend({ compatibleWith: compatibleWithSchema, installPaths: installPathsSchema, namespace: namespaceSchema })
```

**Migration notes:**

- `compatibleWith` absent or `[]` is treated as `["claude-code"]` by the frontend for backward compatibility.
- `namespace` absent is treated as `"claude-code"` for backward compatibility.
- `installPaths` is only needed on `ToolkitItemEntity` (detail page), not the summary (catalog). No over-fetching.
- The `ToolkitCategory` enum does not change; categories (skill, agent, command, hook, rule) remain tool-neutral because the category describes the _function_, not the tool format.

---

## 4. Component Reuse Map

| Existing Component | Adaptation Needed |
|---|---|
| `ToolkitCard` | Add a compact chip row below the category/status badges showing `compatibleWith` tool icons (1–3 chips). No layout change. |
| `ToolkitFilterBar` | Add a `ToolScopeSwitcher` above (or integrated into) the existing pill row. Existing category/status pills unchanged. |
| `BundleCard` | Add aggregate compatible-tool chips derived from items in the bundle. No structural change. |
| `FeaturedBundles` | No change — the horizontal scroll row is layout-only. |
| `CopyButton` | No change — already reusable for any snippet. |
| `ToolkitDownloadDialog` | Add tool dimension to install snippet generation (see Section 7). Phase layout to show per-tool tabs/segments. |
| `BundleDownloadDialog` | Add per-tool tab in multi-command block (same approach as `ToolkitDownloadDialog`). |
| `EmptyState` | No change — already has icon/title/message/action props. |
| `StatCard` | No change. |
| `Tooltip` | No change — available for tool chip hover labels. |
| `SearchModal` | Low priority: add `compatibleWith` as a searchable metadata field. No structural change required. |
| `CopyButton` | No change. |
| `Pagination` | No change. |

---

## 5. New Components Needed

### 5.1 `ToolScopeSwitcher`

**Location:** `src/components/toolkit/ToolScopeSwitcher.tsx`

A persistent pill-tab bar placed above `ToolkitFilterBar` on the `/toolkit` catalog page. Represents the "All tools" default plus one pill per supported tool.

```
[ All tools ]  [ Claude Code ]  [ GitHub Copilot ]  [ OpenAI Codex ]
```

**Behavior:**
- Selecting a tool filters the catalog to items where `compatibleWith` includes that tool (or `namespace === tool`).
- "All tools" (default) shows everything.
- Selection is URL-backed via `?tool=claude-code` (see Section 6).
- On the item detail page (`/toolkit/:category/:itemId`), the switcher controls which install snippet is shown in `ToolkitDownloadDialog`.

**Props:**
```ts
interface ToolScopeSwitcherProps {
  value: ToolName | "all"
  onChange: (tool: ToolName | "all") => void
}
```

**Styling:** Uses the existing `Pill` active/inactive classes from `ToolkitFilterBar`. No new style token needed.

### 5.2 `ToolChip`

**Location:** `src/components/toolkit/ToolChip.tsx`

A small inline badge displayed on `ToolkitCard` and in the detail page header, listing each tool this item is compatible with.

```
[ CC ]  [ GH ]  [ OAI ]
```

- Each chip is a `<span>` with a `Tooltip` showing the full tool name on hover.
- Icon: use existing `lucide-react` icons (`Bot` for Claude Code, `Github` for Copilot, `Cpu` for Codex). No new icon library.
- Accessible: each chip has `aria-label="Compatible with <tool name>"`.

**Props:**
```ts
interface ToolChipProps {
  tool: ToolName
  size?: "sm" | "md"  // sm for card chips, md for detail header
}
```

### 5.3 `InstallSnippet`

**Location:** `src/components/toolkit/InstallSnippet.tsx`

An extracted sub-component wrapping the install command block (previously inline in `ToolkitDownloadDialog`). Renders a `<pre>` code block with a `CopyButton`. Accepts a `tool` prop and renders the correct snippet for that tool.

```ts
interface InstallSnippetProps {
  item: ToolkitItemEntity
  tool: ToolName
  scope: "project" | "global"
}
```

Used by both `ToolkitDownloadDialog` and `BundleDownloadDialog`.

---

## 6. Tool-Switcher UX Specification

### 6.1 Placement and Default

- The `ToolScopeSwitcher` is rendered **above** the `ToolkitFilterBar` on `/toolkit`, immediately below the `FeaturedBundles` row.
- Default selection: **"All tools"**. No tool is pre-selected on first visit.
- On the detail page (`/toolkit/:category/:itemId`), the same switcher appears in the install block, scoped to tools listed in `item.compatibleWith`. If the item supports only one tool, the switcher is hidden (no single-option selector).

### 6.2 URL Persistence

The selected tool is persisted in the URL via a `tool` query param:

| State | URL |
|---|---|
| All tools (default) | `/toolkit` (no param) |
| Claude Code only | `/toolkit?tool=claude-code` |
| GitHub Copilot only | `/toolkit?tool=github-copilot` |
| OpenAI Codex only | `/toolkit?tool=openai-codex` |

The existing `useSearchParams` pattern (already used for `category` and `status` filters) handles this. No new state management needed.

When navigating from catalog to detail page, the `tool` param is carried forward:
```
/toolkit?tool=github-copilot → /toolkit/agent/deploy-agent?tool=github-copilot
```
The detail page reads `tool` from search params to pre-select the correct install tab.

### 6.3 Keyboard Accessibility

- The switcher is a `role="tablist"` with each pill as `role="tab"`.
- Arrow keys (`←` / `→`) cycle between tabs.
- `Enter` or `Space` selects the focused tab.
- `Home` jumps to "All tools"; `End` jumps to the last tool.

### 6.4 ARIA Attributes

```html
<div role="tablist" aria-label="Filter by tool">
  <button role="tab" aria-selected="true"  id="tab-all"     aria-controls="toolkit-grid">All tools</button>
  <button role="tab" aria-selected="false" id="tab-cc"      aria-controls="toolkit-grid">Claude Code</button>
  <button role="tab" aria-selected="false" id="tab-copilot" aria-controls="toolkit-grid">GitHub Copilot</button>
  <button role="tab" aria-selected="false" id="tab-codex"   aria-controls="toolkit-grid">OpenAI Codex</button>
</div>
<div role="tabpanel" id="toolkit-grid" aria-labelledby="tab-all">
  <!-- catalog grid -->
</div>
```

The `toolkit-grid` panel is always rendered (no panel mounting/unmounting on tab switch) — the tab just updates the filter applied to the catalog query.

### 6.5 Focus Ring

Use the project's existing focus ring pattern:
```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950
dark:focus-visible:ring-white focus-visible:ring-offset-2
```

---

## 7. Install-Snippet Generator

The `ToolkitDownloadDialog` currently has two phases: `confirm` and `instructions`. Under the redesign, the `instructions` phase gains a **tool-scoped tab row** rendered by `ToolScopeSwitcher` (inline variant, restricted to `item.compatibleWith`).

### 7.1 Claude Code Snippets

For category `skill`:
```bash
claude skill install <repo>/<path>
```

For category `agent`, `command`, `hook`, `rule` — project scope:
```bash
# 1. Download and extract the ZIP
unzip <name>.zip

# 2. Copy to project directory
cp -r <name>.md .claude/<type>/

# 3. (Optional) copy to global directory
cp -r <name>.md ~/.claude/<type>/
```

Install paths:
```
skill   → .claude/skills/<name>/SKILL.md   | ~/.claude/skills/<name>/SKILL.md
agent   → .claude/agents/<name>.md         | ~/.claude/agents/<name>.md
command → .claude/commands/<name>.md       | ~/.claude/commands/<name>.md
hook    → (entry in .claude/settings.json) | (entry in ~/.claude/settings.json)
rule    → .claude/rules/<name>.md          | ~/.claude/rules/<name>.md
```

Note: hooks are not file-copy installs — they require editing `settings.json`. The install instructions for hooks must show the JSON fragment to add to `settings.json`, not a `cp` command.

### 7.2 GitHub Copilot (VS Code) Snippets

Copilot install is a file-copy into `.github/<type>/` (project scope) or `~/.copilot/<type>/` (personal scope):

```bash
# Project scope
cp github-copilot/<type>/<name>.* .github/<type>/
```

Type-to-path mapping:
```
agent       → .github/agents/<name>.agent.md       | ~/.copilot/agents/<name>.agent.md
instructions → .github/instructions/<name>.instructions.md | ~/.copilot/instructions/<name>.instructions.md
prompt      → .github/prompts/<name>.prompt.md     | (VS Code only, no global equivalent)
skill       → .github/skills/<name>/SKILL.md        | ~/.copilot/skills/<name>/SKILL.md
rule        → .github/copilot-instructions.md       | (repo-wide, single file — append, not copy)
```

For `rule` items (append pattern), the snippet changes:
```bash
# Append to existing copilot-instructions.md
cat github-copilot/rules/<name>.md >> .github/copilot-instructions.md
```

### 7.3 OpenAI Codex CLI Snippets

Codex install is a file-copy into `.codex/<type>/` (project scope) or `~/.codex/<type>/` (global scope):

```bash
# Project scope
cp openai-codex/<type>/<name>.* .codex/<type>/
```

Type-to-path mapping:
```
agent       → .codex/agents/<name>.toml        | ~/.codex/agents/<name>.toml
instructions → AGENTS.md (repo root)           | ~/.codex/AGENTS.md
hook        → .codex/hooks.json (append entry) | ~/.codex/hooks.json (append entry)
skill       → .agents/skills/<name>/           | ~/.agents/skills/<name>/
```

For `agent` items, the Codex format is TOML, not Markdown. The snippet shows a TOML file copy:
```bash
cp openai-codex/agents/<name>.toml .codex/agents/
```

For `instructions` (AGENTS.md-compatible), the snippet is an append, identical to the Copilot rule pattern:
```bash
cat openai-codex/instructions/<name>.md >> AGENTS.md
```

### 7.4 Snippet Selection Logic in `InstallSnippet`

```ts
function resolveInstallSnippet(
  item: ToolkitItemEntity,
  tool: ToolName,
  scope: "project" | "global",
): { command: string; note?: string } {
  // 1. If item.installPaths[tool] is present, use it directly
  // 2. Otherwise, derive from INSTALL_PATH_MAP[tool][item.category]
  // 3. Return { command, note } where note is a human-readable caveat
  //    (e.g., "hooks require editing settings.json — see note below")
}
```

This function lives in `src/lib/toolkit-install.ts` as a pure, unit-testable utility.

---

## 8. API Changes

### 8.1 Response Shape Delta

`GET /api/v1/toolkit` — list endpoint, returns `PaginatedResponse<ToolkitItemSummary>`

New fields on each `ToolkitItemSummary` element (all optional, non-breaking):
```json
{
  "compatibleWith": ["claude-code", "github-copilot"],
  "namespace": "shared"
}
```

`GET /api/v1/toolkit/:category/:itemId` — detail endpoint, returns `ToolkitItemEntity`

New fields (optional, non-breaking):
```json
{
  "compatibleWith": ["claude-code", "github-copilot", "openai-codex"],
  "namespace": "shared",
  "installPaths": {
    "claude-code": ".claude/agents/deploy-agent.md",
    "github-copilot": ".github/agents/deploy-agent.agent.md",
    "openai-codex": ".codex/agents/deploy-agent.toml"
  }
}
```

### 8.2 Filter Query Parameters

`GET /api/v1/toolkit` gains one new optional query parameter:

| Param | Type | Behavior |
|---|---|---|
| `tool` | `"claude-code" \| "github-copilot" \| "openai-codex"` | Filter to items where `compatibleWith` contains this value. Absent = return all items. |

Existing params (`category`, `status`, `pageSize`, `page`) are unchanged.

Example:
```
GET /api/v1/toolkit?tool=github-copilot&category=agent
```

### 8.3 Mock Data Update

`src/mocks/toolkit.ts` (16 existing items) needs a data pass to populate `compatibleWith` and `namespace`. This is a Phase 5 task (see Section 9). For Phase 2 and 3, the frontend can default absent `compatibleWith` to `["claude-code"]` with a client-side fallback.

---

## 9. Implementation Phasing

The following phase order minimizes risk and allows each phase to ship independently.

### Phase 1: Schema + Backend Data (Non-Breaking)

**Goal:** Add new fields to types and backend without any frontend UI changes.

- Add `compatibleWith`, `installPaths`, `namespace` fields to Zod schemas in `packages/types` (all optional).
- Update Hono backend to accept `?tool=` query param (returns unfiltered list if absent for backward compat).
- Populate a subset of mock data (3–5 items) to verify the new fields end-to-end.
- No frontend changes. Existing catalog renders identically.

**Completion signal:** `GET /api/v1/toolkit?tool=github-copilot` returns a non-empty filtered list.

### Phase 2: `ToolScopeSwitcher` + Routing

**Goal:** Add the tool switcher UI with URL persistence. No visual change to catalog cards yet.

- Implement `ToolScopeSwitcher` component.
- Integrate into `/toolkit` route above `ToolkitFilterBar`.
- Wire `?tool=` query param via `useSearchParams`.
- Update TanStack Query key to include `tool` param.
- Carry `?tool=` forward when navigating to detail pages.
- Keyboard navigation and ARIA per Section 6.

**Completion signal:** Switching tools updates the URL; selecting "GitHub Copilot" with no items tagged yet shows the `EmptyState` component gracefully.

### Phase 3: Filter + Card Chip Row

**Goal:** Cards show tool compatibility chips. Filter actually hides incompatible items.

- Implement `ToolChip` component.
- Add chip row to `ToolkitCard` (below existing badges).
- Frontend filtering: when `tool` param is set, filter the query result by `compatibleWith` (client-side for now; server-side filtering via Phase 1 backend is the long-term path).
- Update `BundleCard` to show aggregate tool chips.

**Completion signal:** Filtering by "Claude Code" shows all 16 existing items (all tagged `claude-code`); filtering by "GitHub Copilot" shows only items tagged accordingly.

### Phase 4: Install-Snippet Generator

**Goal:** `ToolkitDownloadDialog` shows tool-specific install instructions.

- Implement `InstallSnippet` component.
- Extract `resolveInstallSnippet` utility into `src/lib/toolkit-install.ts`.
- Add per-tool tab row to `ToolkitDownloadDialog` instructions phase.
- Render correct snippets for all three tools and both project/global scopes.
- Update `BundleDownloadDialog` with per-tool multi-command block.
- Unit-test `resolveInstallSnippet` for all tool × category × scope combinations.

**Completion signal:** For an item tagged `["claude-code", "github-copilot"]`, the download dialog shows two tabs with correct install paths for each.

### Phase 5: Migration + Bulk Data Update

**Goal:** All 16 existing mock items (and backend data) tagged with correct `compatibleWith` / `namespace` values.

- Audit each of the 16 items in `src/mocks/toolkit.ts` against the three tool formats.
- Assign `compatibleWith` and `namespace` to each item.
- Items with AGENTS.md-compatible content (plain Markdown instruction files) get `namespace: "shared"` and `compatibleWith: ["claude-code", "github-copilot", "openai-codex"]`.
- Items with Claude Code-specific hook format get `compatibleWith: ["claude-code"]`.
- Items with Copilot `.agent.md`-specific format get `compatibleWith: ["github-copilot"]`.
- Update backend data source (or static mocks) to reflect the audit results.
- Populate `installPaths` for all items.

**Completion signal:** All catalog cards show accurate tool chips; no item shows a tool chip for a tool whose format it does not actually support.

---

## 10. Open Questions

The following items require stakeholder input before or during implementation.

1. **Default tool on first visit**: Should the default be truly "All tools" (shows everything), or should there be a per-user preference persisted in `localStorage`? If we add localStorage persistence, what is the key name and should it be namespaced under `alt-central:tool-pref`?

2. **Hiding vs. dimming incompatible items**: When a tool filter is active, should incompatible items be removed from the DOM entirely, or dimmed/greyed-out to indicate they exist but don't apply? Dimming provides discovery ("there are more items if you change your tool scope") but adds visual noise.

3. **Telemetry for tool adoption**: Should `POST .../install` include the `tool` parameter so the backend can track install counts per tool? This would require a schema change on the stats endpoint. What is the privacy posture — is per-tool install telemetry acceptable?

4. **Copilot cloud agent vs VS Code**: Copilot has two distinct deployment targets with different file paths (`.github/agents/<name>.md` for cloud agent vs `.github/agents/<name>.agent.md` for VS Code). Should the UI expose these as separate "tools" (expanding to four options), or should "GitHub Copilot" be a single option with a secondary sub-tab (VS Code / Cloud Agent) inside the download dialog?

5. **Rule items and append-only install**: Rules for Copilot are appended to `copilot-instructions.md` rather than installed as a new file. This means there is no idempotent uninstall path. Should the UI surface a warning that the operation is append-only, and offer a diff preview before appending?

6. **Codex TOML format for agents**: The existing agent content in the repo is in Claude Code's Markdown+YAML frontmatter format. Adapting an agent for Codex requires a TOML rewrite. Should Phase 5 include authored TOML ports for each agent, or should the catalog initially mark agents as `compatibleWith: ["claude-code"]` only and add Codex support incrementally as ports are authored?

7. **Bundle compatibility**: A bundle today contains items across all categories. If some items in a bundle are not compatible with the selected tool, should the bundle be hidden from the catalog when that tool filter is active, shown with a "partial support" indicator, or shown only when "All tools" is selected?

8. **SearchModal extension**: The `SearchModal` currently searches by name and description. Should it also search by tool tag? If so, queries like "github-copilot agents" should surface agent items compatible with Copilot. This is a low-complexity change but requires agreement on the search UX surface.

9. **Version skew between tool formats**: As Claude Code, Copilot, and Codex evolve their respective formats, some items may become incompatible over time. Is there a plan for a compatibility version field (e.g., `minToolVersion`) to surface "requires Claude Code >= 1.x" warnings in the UI?
