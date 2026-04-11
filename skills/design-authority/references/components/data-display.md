# Data Display

## Table

### Container

```
overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800
```

### Table Header Row

```
bg-gray-50 dark:bg-gray-900
```

### Header Cell

```
px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400
```

### Body Row

```
border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors
```

### Body Cell

```
px-4 py-3 text-sm text-gray-700 dark:text-gray-300
```

### Empty State

```
px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-500
```

## Stat Card

```
bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5
```

Value: `text-2xl font-bold text-gray-950 dark:text-white`

Label: `text-xs text-gray-500 dark:text-gray-500`

Grid layout: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`

## Progress Bar

Container:

```
h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden
```

Fill:

```
h-full bg-primary dark:bg-primary-light rounded-full transition-all duration-300
```

## Badge

Base:

```
inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full
```

| Variant | Classes |
|---------|---------|
| Neutral | `bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300` |
| Success | `bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300` |
| Warning | `bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300` |
| Danger | `bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300` |

**Note**: Badge tints (`bg-green-100`, `bg-amber-100`, etc.) use Tailwind named scale classes — this is an accepted exception to the OKLCH-first rule for tinted backgrounds. Do not replace these with OKLCH arbitrary values.

## Skeleton Loader

```
animate-pulse bg-gray-200 dark:bg-gray-800 rounded
```

Common skeleton shapes:
- Text line: `h-4 w-3/4 rounded`
- Heading: `h-6 w-1/2 rounded`
- Avatar: `h-10 w-10 rounded-full`
- Card: `h-32 rounded-2xl`
