# Surfaces

## Card

Top-level content containers.

```
bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5
```

## Panel (elevated)

Floating or elevated containers with subtle shadow.

```
bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm
```

## Bordered List

Vertical list with dividers inside a container.

```
divide-y divide-gray-200 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden
```

### List Item

```
px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors
```

## Container

Page-level width constraint.

```
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
```

## Section Spacing

Between major sections within a page:

```
space-y-6
```

Between subsections or related elements:

```
space-y-4
```

## Radius Rules

| Context | Radius | Class |
|---------|--------|-------|
| Top-level cards, panels | Large | `rounded-2xl` |
| Nested containers, tables | Medium | `rounded-xl` |
| Buttons, inputs, pills | Standard | `rounded-lg` |
| Pills, badges | Full | `rounded-full` |

**Banned:** `rounded-md`, `rounded-sm` — these produce generic AI-looking UI. Always use `rounded-lg` or above.
