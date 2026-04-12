# Navigation

## Tab Bar

### Container

```
border-b border-gray-200 dark:border-gray-800 flex gap-6
```

### Tab (inactive)

```
pb-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent transition-colors
```

### Tab (active)

```
pb-3 text-sm font-medium text-primary dark:text-primary-light border-b-2 border-primary dark:border-primary-light
```

Always add `aria-selected` to the active tab.

## Sidebar

### Link (inactive)

```
flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
```

### Link (active)

```
flex items-center gap-3 px-3 py-2 text-sm font-medium text-primary dark:text-primary-light bg-primary/10 dark:bg-primary-light/10 rounded-lg
```

Use `aria-current="page"` on the active sidebar link.

## Filter Pills

### Pill (inactive)

```
px-3 py-1.5 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
```

### Pill (active)

```
px-3 py-1.5 text-xs font-medium rounded-full bg-primary/10 text-primary dark:bg-primary-light/10 dark:text-primary-light border border-primary/20 dark:border-primary-light/20
```

Use `aria-pressed` on filter pill buttons.

## Breadcrumbs

```
flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400
```

Separator: `>` or `/` in `text-gray-300 dark:text-gray-600`. Current page is `font-medium text-gray-950 dark:text-white`.
