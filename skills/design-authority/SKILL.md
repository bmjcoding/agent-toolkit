---
name: design-authority
description: Design system guidance for generating and modifying frontend components. Provides token references, canonical patterns, and anti-convergence rules. Use when creating or editing React/Tailwind UI code.
lifecycle: stable
---

# Design Authority — Generator Skill

## Scope Check

Decide the operating mode before loading references:
1. **Existing design system / mature product** — preserve the established visual language and map this skill's rules onto the existing tokens and components. Do not restyle the product into toolkit defaults.
2. **Small patch** — for one component, one state, or one token issue, skip the full pattern sweep and load only the relevant reference file(s).
3. **New screen or broad redesign** — run the full design thinking step, then load routed references as needed.

## Design Thinking Step

Before generating any UI code, explicitly state:
1. **Purpose** — what does this component/view do?
2. **Audience** — who uses it? (end user, developer, ops)
3. **Density mode** — marketing (spacious) or platform (compact)? → see `references/density.md`
4. **Theme** — standard or brutalist? → see `references/theme-brutalist.md`

## Generation Stack

- React + Tailwind v4 CSS-native (no `tailwind.config.js`)
- `lucide-react` for icons
- No external UI libraries (no shadcn/ui, no Radix primitives, no Headless UI)
- No inline styles — Tailwind classes only
- No CVA (`class-variance-authority`) — not in dependency tree
- **Color notation**: OKLCH exclusively — all color values use `oklch(L C H)` format (see `references/color-system.md`). Arbitrary hex values (`#FFF`, `#334155`) are banned.

## Token Quick-Ref

| Intent | Light | Dark |
|--------|-------|------|
| Page bg | `bg-white` | `dark:bg-gray-950` |
| Card surface | `bg-gray-50` | `dark:bg-gray-900` |
| Primary text | `text-gray-950` | `dark:text-white` |
| Secondary text | `text-gray-600` | `dark:text-gray-400` |
| Border | `border-gray-200` | `dark:border-gray-800` |
| Active/selected | `bg-primary/10 text-primary` | `dark:bg-primary-light/10 dark:text-primary-light` |

Full table → `references/design-tokens.md`

## 5 Canonical Patterns

**Card surface:**
```
bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5
```

**Hover row/item:**
```
hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors
```

**Active/selected state:**
```
bg-primary/10 text-primary dark:bg-primary-light/10 dark:text-primary-light
```

**Tab underline (active):**
```
border-b-2 border-primary dark:border-primary-light font-medium text-primary dark:text-primary-light
```

**Section header:**
```
text-lg font-semibold text-gray-950 dark:text-white
```

## Dark Mode Rule

Every color utility MUST have a `dark:` counterpart. No exceptions.

```
✓ text-gray-950 dark:text-white
✓ bg-gray-50 dark:bg-gray-900
✗ text-gray-950  (missing dark:)
✗ bg-blue-500    (missing dark:)
```

## Anti-Convergence Bans

| Banned | Use Instead | Why |
|--------|-------------|-----|
| `rounded-md`, `rounded-sm` | `rounded-2xl`, `rounded-xl`, `rounded-lg` | Generic AI radius |
| Arbitrary hex (`#FFF`, `#334155`) | Semantic Tailwind tokens or OKLCH CSS variables | Breaks theming |
| `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl` | `shadow-sm` max, `hover:shadow-sm` | Too heavy |
| Missing `dark:` pair | Always pair light + dark | Broken dark mode |
| Explicit `font-sans` | Omit (inherited) | Unnecessary |
| >3 non-gray colors in a view | Monochromatic + single accent | Color-busy |

## Monochromatic Discipline

The UI is predominantly grayscale. Accent (`--color-primary`) is used **only** for:
- Active tab underlines
- Selected state backgrounds (`bg-primary/10`)
- Primary buttons
- Section labels (sparingly)

Everything else is grayscale. If a view has >3 non-gray colors visible simultaneously, reduce.

Full color system → `references/color-system.md`

## Core Invariants (Always Applied)

These rules apply to ALL output — code, specs, and documentation. They are inlined here so they do not depend on reference file routing.

**Z-Index Scale** — strict, no arbitrary values:

| Layer | Class | Use |
|-------|-------|-----|
| Sticky headers | `z-10` | Table headers, section headers |
| Sidebar overlay | `z-20` | Mobile sidebar |
| Navbar | `z-30` | Fixed/sticky navigation |
| Modals | `z-40` | Dialogs, search overlay |
| Tooltips | `z-50` | Popovers, dropdowns, tooltips |

Forbidden: `z-[N]` arbitrary values. Full reference → `references/effects.md`

**Focus-Visible** — every interactive element must include `outline-none` reset:

```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2
dark:focus-visible:ring-white dark:focus-visible:ring-offset-gray-950
```

Never use `outline-none` without compensating `focus-visible:ring-*`. Full reference → `references/components/focus.md`

**Typography Tracking** — large headings require `tracking-tight`:

| Role | Required Classes |
|------|-----------------|
| Page H1 | `text-2xl font-bold tracking-tight text-gray-950 dark:text-white` |
| App name H1 | `text-2xl font-bold font-mono tracking-tight text-gray-950 dark:text-white` |

Full type scale → `references/typography.md`

## Reference File Routing

Load only the relevant reference based on what you're building:

| Building... | Load |
|-------------|------|
| Any component | `references/components/INDEX.md` (load first before other component references) |
| Colors, tokens | `references/design-tokens.md` |
| Color decisions, gamut | `references/color-system.md` |
| Typography, fonts | `references/typography.md` |
| Cards, panels, lists | `references/components/surfaces.md` |
| Tabs, sidebar, pills | `references/components/navigation.md` |
| Forms, inputs | `references/components/forms.md` |
| Tables, stats, badges | `references/components/data-display.md` |
| Buttons, actions | `references/components/actions.md` |
| Focus, keyboard nav | `references/components/focus.md` |
| Check MDX exists first | `references/components/mdx-lookup.md` |
| Shadows, z-index, animations | `references/effects.md` |
| Charts, data viz | `references/charts.md` |
| Developer/ops tool pages | `references/theme-brutalist.md` |
| Spacing, padding decisions | `references/density.md` |
| Tabs, toggles, selection | `references/interactive-states.md` |

## Templates

Copy and adapt from `templates/` when building:
- `app-detail-panel.tsx` — tab header + content skeleton
- `data-table.tsx` — sortable table with hover rows
- `stat-card-grid.tsx` — 3-col stat cards
- `filter-bar.tsx` — configurable pill filter bar

## Gotchas

- Reference files (`references/`) may not exist in all projects — check before loading or skip gracefully.
- Tokens like `bg-primary` and `text-primary` are relative to the project's CSS variable definitions; verify `--color-primary` is defined in the project's global CSS before using them.
- Tailwind v4 uses CSS-native config — there is no `tailwind.config.js`. Class generation is driven by `@theme` blocks in CSS files.
- OKLCH color values require a browser with wide-gamut support. All production deployments in this system target modern browsers; this is acceptable. Do not substitute oklch() with hex or rgb() equivalents.
