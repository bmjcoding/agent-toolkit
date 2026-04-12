# Typography

## Font Stacks

**Body (default):** System sans-serif stack, inherited from `globals.css @layer base`. Do not add explicit `font-sans` — it is inherited.

**Monospace:** `font-mono` — use for app names, project keys, code snippets, IDs, and technical identifiers.

## Type Scale

| Role | Classes | When to use |
|------|---------|-------------|
| Page H1 | `text-2xl font-bold tracking-tight text-gray-950 dark:text-white` | Top-level page titles |
| App name H1 | `text-2xl font-bold font-mono tracking-tight text-gray-950 dark:text-white` | Application/project name headings |
| Section H3 | `text-lg font-semibold text-gray-950 dark:text-white` | Section headings within a page |
| Section label | `text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400` | Category labels, group headers, metadata labels |
| Body | `text-sm text-gray-700 dark:text-gray-300` | Standard paragraph text, descriptions |
| Muted meta | `text-xs text-gray-500 dark:text-gray-500` | Timestamps, secondary metadata, helper text |
| Code inline | `font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded` | Inline code, command names |
| Monospace app name | `font-mono text-sm font-medium text-gray-950 dark:text-white` | App names in lists, table cells |

## Pairing Rules

- **App names, project keys, IDs** → `font-mono` — technical identifiers should always be monospace
- **Code, commands, paths, values** → `font-mono` — anything that would appear in a terminal
- **Everything else** → system sans-serif (default, no class needed)
- **Never mix** `font-mono` and sans in the same text run — one or the other per element

## Anti-Patterns

| Banned | Why | Instead |
|--------|-----|---------|
| Explicit `font-sans` | Unnecessary — inherited from base | Omit entirely |
| `text-base` for UI text | Too large for information-dense UI | Use `text-sm` |
| `text-lg` for body text | Only for section headings (H3) | Use `text-sm` |
| `font-light`, `font-thin` | Poor readability, especially on low-DPI | Use `font-normal` minimum |
| `tracking-wider` on body text | Only for uppercase section labels | Omit or use `tracking-normal` |
