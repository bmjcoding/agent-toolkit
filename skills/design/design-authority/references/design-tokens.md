# Design Tokens

## Core Principle

Tokens reference `var(--color-primary)` — never document what color that resolves to. The primary color is a configurable OKLCH variable that the consumer defines. All documentation and code must treat it as abstract.

## OKLCH Is the Standard

OKLCH is mandatory for all new color definitions. It is not a migration target — it IS the standard. Every new token must be defined using `oklch()` notation.

> **Note on existing code:** The current `tokens.css` uses legacy `rgb()` values. These are not wrong — they work. But all new tokens must use OKLCH. When modifying existing tokens, convert them to OKLCH at the same time. This document covers both the current state (rgb) and the OKLCH standard for new work.

## Token System Structure

The primary color is defined as a configurable OKLCH variable:

```css
/* tokens.css — new tokens use oklch() */
:root {
  --color-primary: oklch(0.55 0.20 250);  /* Consumer configures this */
  --color-primary-light: oklch(from var(--color-primary) calc(l + 0.15) c h);
  --color-primary-soft: oklch(from var(--color-primary) 0.95 0.03 h);
}
```

Never hard-code what `--color-primary` resolves to. It is the consumer's choice.

## Where Tokens Live

New tokens go in two places:

1. **`tokens.css`** — Define the CSS custom property using `oklch()`
2. **`globals.css` `@theme {}` block** — Wire the CSS variable into Tailwind v4

### Wiring tokens into Tailwind v4

Tailwind v4 uses `@theme {}` in `globals.css` to register CSS variables as utility classes:

```css
/* globals.css */
@theme {
  --color-primary: var(--color-primary);
  --color-primary-light: var(--color-primary-light);
  --color-primary-soft: var(--color-primary-soft);
  --color-surface: var(--color-surface);
  --color-border: var(--color-border);
}
```

This makes classes like `bg-primary`, `text-primary-light`, `border-border` available in markup.

### Rule

Every new token requires entries in both files:
- `tokens.css`: the `oklch()` definition
- `globals.css` `@theme {}`: the Tailwind binding

## OKLCH Syntax

### Basic notation

```
oklch(lightness chroma hue)
oklch(0.55 0.20 250)
```

- **Lightness**: 0 (black) to 1 (white)
- **Chroma**: 0 (gray) to ~0.4 (max saturation) — respect gamut guardrails
- **Hue**: 0-360 degrees on the color wheel

### Deriving scales with relative color syntax

Use `oklch(from ...)` to derive hover, active, and soft variants from a base token:

```css
/* Darker variant (hover) */
--color-primary-hover: oklch(from var(--color-primary) calc(l - 0.08) c h);

/* Lighter variant (soft background) */
--color-primary-soft: oklch(from var(--color-primary) calc(l + 0.35) calc(c * 0.3) h);

/* Desaturated variant */
--color-primary-muted: oklch(from var(--color-primary) l calc(c * 0.5) h);
```

### Color mixing

Use `color-mix(in oklch, ...)` for blending:

```css
/* 10% primary on white */
--color-primary-tint: color-mix(in oklch, var(--color-primary) 10%, white);

/* Midpoint between two colors */
--color-blend: color-mix(in oklch, var(--color-a) 50%, var(--color-b));
```

## Tailwind Class Translation Table

Use semantic intent, not raw color values. This table maps every common UI intent to its light and dark mode Tailwind classes.

| Intent | Light | Dark |
|---|---|---|
| Page background | `bg-white` | `dark:bg-gray-950` |
| Card surface | `bg-gray-50` | `dark:bg-gray-900` |
| Primary text | `text-gray-950` | `dark:text-white` |
| Secondary text | `text-gray-600` | `dark:text-gray-400` |
| Muted text | `text-gray-500` | `dark:text-gray-500` |
| Border | `border-gray-200` | `dark:border-gray-800` |
| Hover surface | `hover:bg-gray-100` | `dark:hover:bg-gray-800` |
| Active/selected | `bg-primary/10 text-primary` | `dark:bg-primary-light/10 dark:text-primary-light` |
| Input background | `bg-white` | `dark:bg-gray-900` |
| Input border | `border-gray-300` | `dark:border-gray-700` |
| Disabled text | `text-gray-400` | `dark:text-gray-600` |
| Disabled surface | `bg-gray-100` | `dark:bg-gray-800` |
| Focus ring | `ring-primary/50` | `dark:ring-primary-light/50` |
| Danger text | `text-red-600` | `dark:text-red-400` |
| Success text | `text-green-600` | `dark:text-green-400` |
| Warning text | `text-amber-600` | `dark:text-amber-400` |
| Divider | `border-gray-100` | `dark:border-gray-800` |
| Elevated surface | `bg-white shadow-sm` | `dark:bg-gray-900 dark:shadow-none` |
| Sidebar background | `bg-gray-50` | `dark:bg-gray-950` |
| Table header | `bg-gray-50 text-gray-600` | `dark:bg-gray-900 dark:text-gray-400` |
| Table row hover | `hover:bg-gray-50` | `dark:hover:bg-gray-900` |
| Badge background | `bg-gray-100 text-gray-700` | `dark:bg-gray-800 dark:text-gray-300` |
| Primary button | `bg-primary text-white` | `dark:bg-primary-light dark:text-gray-950` |
| Secondary button | `bg-gray-100 text-gray-700` | `dark:bg-gray-800 dark:text-gray-300` |
| Ghost button hover | `hover:bg-gray-100` | `dark:hover:bg-gray-800` |
