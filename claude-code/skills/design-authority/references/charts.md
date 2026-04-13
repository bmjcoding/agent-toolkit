# Charts

## Current State

No chart library installed. D3 is used for topology visualization only, not for standard charts.

## Recommendation

**Recharts** over Tremor — compatible with plain Tailwind (no styled-components), and D3 is already a transitive dependency.

## Semantic Token Mapping

| Chart Role | Color | OKLCH Value | Tailwind Token |
|------------|-------|-------------|----------------|
| Primary series | Accent | `var(--color-primary)` | `text-primary` |
| Secondary series | Gray 400 | `oklch(0.705 0 0)` | `text-gray-400` |
| Tertiary series | Gray 300 | `oklch(0.785 0 0)` | `text-gray-300` |
| Healthy | Green | `oklch(0.72 0.17 145)` | `text-green-600` |
| Warning | Amber | `oklch(0.75 0.15 85)` | `text-amber-500` |
| Critical | Red | `oklch(0.63 0.19 25)` | `text-red-600` |
| Grid lines | Gray 200 | `oklch(0.875 0 0)` | `stroke-gray-200` |
| Axis labels | Gray 500 | `oklch(0.55 0 0)` | `text-gray-500` |

Dark mode counterparts:

| Chart Role | Dark Tailwind Token |
|------------|---------------------|
| Primary series | `dark:text-primary-light` |
| Secondary series | `dark:text-gray-500` |
| Tertiary series | `dark:text-gray-600` |
| Healthy | `dark:text-green-400` |
| Warning | `dark:text-amber-400` |
| Critical | `dark:text-red-400` |
| Grid lines | `dark:stroke-gray-800` |
| Axis labels | `dark:text-gray-400` |

## Rules

1. **Max 4 series per chart.** If more data dimensions exist, split into multiple charts.
2. **Don't chart what should be a numeral.** A single KPI belongs in a stat card, not a chart.
3. **All chart colors must have dark mode counterparts.**
4. **Monochromatic by default.** Use gray series and accent only. Add color only for semantic meaning (healthy/warning/critical).
5. **No gradient fills** in chart areas — flat fills with low opacity (`/10`, `/20`) only.
