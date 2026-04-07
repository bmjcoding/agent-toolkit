# Effects

## Backdrop Blur

Navbar only — not a general aesthetic:

```
backdrop-blur-sm bg-white/80 dark:bg-gray-950/80
```

## Gradient Masks

Sidebar bottom fade:

```
bg-gradient-to-b from-transparent to-white dark:to-gray-950
```

Code expand fade (show more):

```
bg-gradient-to-t from-white dark:from-gray-950 to-transparent
```

Step connector (vertical line between steps):

```
bg-gradient-to-b from-gray-200 to-gray-200 dark:from-gray-800 dark:to-gray-800
```

## Transitions

Default (most elements):

```
transition-all duration-200
```

Simple color changes only:

```
transition-colors
```

Opacity reveals:

```
transition-opacity
```

## Shadows

Maximum allowed shadow weight is `shadow-sm`. Shadows are subtle elevation hints, not decoration.

| Use | Class |
|-----|-------|
| Elevated panel | `shadow-sm` |
| Hover elevation | `hover:shadow-sm` |
| Dark mode | `dark:shadow-none` (shadows are invisible on dark backgrounds) |

**Banned:** `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`

## Animations

| Animation | Class | Use for |
|-----------|-------|---------|
| Skeleton pulse | `animate-pulse` | Loading placeholders |
| Spinner | `animate-spin` | Loading indicators |

## Group Interactions

Reveal-on-hover actions:

```tsx
<div className="group">
  {/* visible content */}
  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
    {/* action icons revealed on hover */}
  </div>
</div>
```

## Z-Index Scale

Strict scale — no arbitrary values allowed.

| Layer | Class | Use |
|-------|-------|-----|
| Sticky headers | `z-10` | Table headers, section headers |
| Sidebar overlay | `z-20` | Mobile sidebar |
| Navbar | `z-30` | Fixed/sticky navigation |
| Modals | `z-40` | Dialogs, search overlay |
| Tooltips | `z-50` | Popovers, dropdowns, tooltips |

**Forbidden:** `z-[999]`, `z-[9999]`, or any arbitrary `z-[...]` value. Use the defined scale only.
