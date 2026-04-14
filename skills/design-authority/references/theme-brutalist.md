# Brutalist Theme

## When to Use

Trigger for developer-tool pages: gap analysis, admin panels, debug views, monitoring dashboards, ops consoles. If the page is primarily a developer/ops tool with dense tabular data, use brutalist. If it's user-facing content, use standard.

## Override Rules

| Standard | Brutalist Override |
|----------|-------------------|
| `rounded-2xl`, `rounded-xl` | `rounded-none` |
| `border border-gray-200` | `border border-gray-300 dark:border-gray-700` (full opacity) |
| `hover:shadow-sm` | No shadow — flat hover only: `hover:bg-gray-100 dark:hover:bg-gray-900` |
| System sans-serif | `font-mono` everywhere |
| `bg-gray-950` (dark) | `bg-gray-950` (same, but cooler feel with mono font) |

## Hierarchy Compensation

When elevation cues (shadows, rounded corners, color variation) are stripped, compensate through typography and spacing:

| Technique | Classes | Why |
|-----------|---------|-----|
| Typography weight | `font-medium` or `font-semibold` for all labels | Creates hierarchy without visual decoration |
| Letter spacing | `tracking-tight` on large headers | Dense, engineered aesthetic |
| Border emphasis | `border-2` for primary containers, `border` for nested | Replaces shadow-based elevation |
| Spacing discipline | Strict vertical rhythm with `gap-3` between rows | Consistency replaces visual noise |

## Reference Implementation

`GapAnalysisPage.tsx` — already uses denser dark variants with the brutalist aesthetic.

## What NOT to Change

- Keep `text-sm` — don't increase font size
- Keep dark mode pairs — brutalist does not mean light-only
- No pure `#000000` — use `gray-950` which is `oklch(0.145 0 0)`
- Keep `text-xs` for metadata — brutalist is dense, not enlarged
