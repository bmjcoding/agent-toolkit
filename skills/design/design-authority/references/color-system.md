# Color System

## Foundation: Monochromatic with OKLCH

The UI is predominantly grayscale. Color is used sparingly and intentionally. All color values use OKLCH notation exclusively.

## OKLCH Gamut Guardrails

Every color in the system must respect these chroma limits:

| Category | Max Chroma | Examples |
|---|---|---|
| UI surfaces (backgrounds, borders, cards) | **0.15** | Page bg, card bg, dividers, input borders |
| Accents (buttons, active states, links) | **0.25** | Primary button, active tab, selected item |
| Functional status colors (red/green/amber) | **0.20** | Error, success, warning indicators |

For functional status colors, lightness must stay within **0.50 - 0.85** to ensure readability in both light and dark modes.

## Gray Scale

Gray scales use chroma 0 (pure achromatic). The 12-step scale follows the Radix purpose map, from near-white to near-black.

| Step | OKLCH Value | Purpose |
|---|---|---|
| Gray 1 | `oklch(0.985 0 0)` | App background |
| Gray 2 | `oklch(0.970 0 0)` | Subtle background |
| Gray 3 | `oklch(0.940 0 0)` | UI element background |
| Gray 4 | `oklch(0.910 0 0)` | Hovered UI element background |
| Gray 5 | `oklch(0.870 0 0)` | Active / selected UI element background |
| Gray 6 | `oklch(0.830 0 0)` | Subtle borders and separators |
| Gray 7 | `oklch(0.770 0 0)` | UI element border and focus rings |
| Gray 8 | `oklch(0.650 0 0)` | Hovered UI element border |
| Gray 9 | `oklch(0.555 0 0)` | Solid backgrounds |
| Gray 10 | `oklch(0.490 0 0)` | Hovered solid backgrounds |
| Gray 11 | `oklch(0.370 0 0)` | Low-contrast text |
| Gray 12 | `oklch(0.145 0 0)` | High-contrast text |

### Radix 12-Step Purpose Map

- **Steps 1-2**: Backgrounds (page, subtle surfaces)
- **Steps 3-5**: Component backgrounds (default, hover, active)
- **Steps 6-8**: Borders (subtle, default, hover)
- **Steps 9-10**: Solid fills (default, hover)
- **Steps 11-12**: Text (low-contrast, high-contrast)

## Accent Color

The accent color is a configurable variable. Never hard-code its value.

```css
--color-primary: oklch(/* consumer-defined */);
```

### Deriving Accent Variants

Use relative color syntax to derive all variants from the single `--color-primary` token:

```css
/* Hover: darken by reducing lightness */
--color-primary-hover: oklch(from var(--color-primary) calc(l - 0.08) c h);

/* Active/pressed: darken further */
--color-primary-active: oklch(from var(--color-primary) calc(l - 0.12) c h);

/* Soft background: high lightness, low chroma */
--color-primary-soft: oklch(from var(--color-primary) 0.95 0.03 h);

/* Light mode variant */
--color-primary-light: oklch(from var(--color-primary) calc(l + 0.15) c h);

/* Muted: reduce chroma */
--color-primary-muted: oklch(from var(--color-primary) l calc(c * 0.5) h);
```

### Accent Restraint Rules

Accent color appears only in these specific places:

- Active tab underlines
- Selected state backgrounds (at 10% opacity via `bg-primary/10`)
- Primary action buttons
- Section labels and category indicators
- Links (on hover)

Accent must never be used for:

- Large background fills
- Borders (except active/focus states)
- Body text
- Decorative elements

## Status Semantic Colors

All status colors must stay within gamut guardrails: chroma <= 0.20, lightness 0.50-0.85.

| Status | OKLCH Value | Usage |
|---|---|---|
| Success | `oklch(0.65 0.18 145)` | Passing checks, healthy state |
| Success light | `oklch(0.80 0.10 145)` | Success backgrounds |
| Warning | `oklch(0.75 0.15 85)` | Attention needed, degraded state |
| Warning light | `oklch(0.85 0.08 85)` | Warning backgrounds |
| Error | `oklch(0.60 0.20 25)` | Failures, critical issues |
| Error light | `oklch(0.80 0.10 25)` | Error backgrounds |
| Info | `oklch(0.65 0.15 250)` | Informational, neutral alerts |
| Info light | `oklch(0.85 0.08 250)` | Info backgrounds |

## Tier Colors

Tier indicators (T1 through T4) use distinct hues within gamut bounds.

| Tier | OKLCH Value | Chroma | Notes |
|---|---|---|---|
| T1 (Critical) | `oklch(0.60 0.20 25)` | 0.20 | Red hue, highest urgency |
| T2 (High) | `oklch(0.70 0.15 55)` | 0.15 | Orange hue |
| T3 (Medium) | `oklch(0.70 0.15 250)` | 0.15 | Blue hue |
| T4 (Low) | `oklch(0.65 0.10 160)` | 0.10 | Teal hue, lowest urgency |

## Score Thresholds

Score-based coloring for metrics, health indicators, and ratings.

| Threshold | Range | OKLCH Value | Meaning |
|---|---|---|---|
| Good | 80-100 | `oklch(0.65 0.18 145)` | Healthy, passing, on-track |
| Warning | 50-79 | `oklch(0.75 0.15 85)` | Needs attention, degraded |
| Critical | 0-49 | `oklch(0.60 0.20 25)` | Failing, at-risk, blocked |

## Anti-Busy Rule

> If a view has more than 3 non-gray colors visible simultaneously, it is too busy.

Non-gray means chroma > 0. Count the distinct chromatic colors on screen at any moment. If the count exceeds 3, simplify by:

1. Reducing status indicators to icons-only (remove colored backgrounds)
2. Using gray variants for less important tier/status badges
3. Consolidating similar hues (e.g., use one blue instead of blue + teal)
4. Moving secondary color information behind hover or expand interactions
