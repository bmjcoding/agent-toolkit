# Focus & Keyboard Navigation

## Canonical Focus-Visible Pattern

Default for most interactive elements:

```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 dark:focus-visible:ring-white dark:focus-visible:ring-offset-gray-950
```

For primary-colored interactive elements (primary buttons, active tabs):

```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-primary-light focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950
```

## Root CSS Focus Style

The root CSS in `globals.css` sets a default `focus-visible` style:

```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

This provides a baseline. Override with the Tailwind ring utilities above when you need more control (e.g., different ring color, offset against dark backgrounds).

## Rules

1. **Every interactive element must have visible focus indication** — buttons, links, inputs, tabs, pills, toggles
2. **Never use `outline-none` without a compensating `focus-visible:ring-*`** on the same element
3. **Prefer `focus-visible:` over `focus:`** — `focus-visible` only shows the ring on keyboard navigation, not on mouse click
4. **Ring offset on dark backgrounds** — always include `dark:focus-visible:ring-offset-gray-950` to prevent the ring from blending into the background

## Skip Link (if needed)

```
sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 focus-visible:px-4 focus-visible:py-2 focus-visible:bg-white focus-visible:text-gray-950 focus-visible:rounded-lg focus-visible:shadow-sm
```
