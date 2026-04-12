# Interactive States

## Current Pattern

State is managed with `useState` + inline ternary. CVA is not installed and should not be introduced.

## Canonical Classes

### Active / Selected

```
bg-primary/10 text-primary dark:bg-primary-light/10 dark:text-primary-light
```

### Inactive / Default

```
text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200
```

## State Transition Pattern

```tsx
const [activeTab, setActiveTab] = useState('overview');

<button
  className={activeTab === 'overview'
    ? 'bg-primary/10 text-primary dark:bg-primary-light/10 dark:text-primary-light'
    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
  }
  aria-selected={activeTab === 'overview'}
  onClick={() => setActiveTab('overview')}
>
  Overview
</button>
```

## ARIA Attributes

| Element | ARIA | When |
|---------|------|------|
| Tab | `aria-selected={boolean}` | Tab bars |
| Toggle | `aria-pressed={boolean}` | On/off toggle buttons |
| Nav link | `aria-current="page"` | Active page in sidebar/nav |
| Filter pill | `aria-pressed={boolean}` | Active filter selection |

## Rules

1. Every clickable element that can be "on/off" or "selected" needs both visual state indication AND an ARIA attribute
2. Active state must be visually distinct from hover state — hover is temporary, active is persistent
3. Use `bg-primary/10` (10% opacity) for selected backgrounds, not solid accent

## Future Migration Path

When CVA or shadcn is introduced:

```tsx
// data-attribute approach (forward-compatible)
<button data-state={isActive ? 'active' : 'default'}>

// Tailwind selector
className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
```

This is forward-compatible but should not be adopted until CVA is in the dependency tree.
