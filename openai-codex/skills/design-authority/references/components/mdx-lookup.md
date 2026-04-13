# MDX Component Lookup

Before building a component from scratch, check this table. If an MDX equivalent exists, use it instead.

| Component | Import | Key Props | Use for |
|-----------|--------|-----------|---------|
| StatusBadge | `@/components/mdx/StatusBadge` | `status: 'healthy' \| 'degrading' \| 'incident'` | Service health indicators |
| ScoreGauge | `@/components/mdx/ScoreGauge` | `value: number, max?: number` | Score visualizations (0-100) |
| TierBadge | `@/components/mdx/TierBadge` | `tier: 'T1' \| 'T2' \| 'T3' \| 'T4'` | Severity tier labels |
| MetricCard | `@/components/mdx/MetricCard` | `label: string, value: string \| number` | Single stat display |
| ProgressRing | `@/components/mdx/ProgressRing` | `value: number, size?: number` | Circular progress indicator |
| Timeline | `@/components/mdx/Timeline` | `events: TimelineEvent[]` | Chronological event lists |
| CodeBlock | `@/components/mdx/CodeBlock` | `language: string, title?: string` | Syntax-highlighted code |
| Callout | `@/components/mdx/Callout` | `type: 'info' \| 'warning' \| 'error' \| 'success'` | Alert/info boxes |
| DataTable | `@/components/mdx/DataTable` | `columns: Column[], data: T[]` | Sortable data tables |
| KeyValue | `@/components/mdx/KeyValue` | `items: Record<string, string>` | Key-value pair display |
| StepList | `@/components/mdx/StepList` | `steps: Step[]` | Numbered process steps |
| Tabs | `@/components/mdx/Tabs` | `tabs: string[], children` | Tabbed content sections |
| Accordion | `@/components/mdx/Accordion` | `title: string, children` | Collapsible sections |
| Avatar | `@/components/mdx/Avatar` | `src?: string, name: string, size?: 'sm' \| 'md' \| 'lg'` | User/entity avatars |
| EmptyState | `@/components/mdx/EmptyState` | `icon: LucideIcon, title: string, description: string` | Empty data placeholders |
| Skeleton | `@/components/mdx/Skeleton` | `variant: 'text' \| 'card' \| 'avatar'` | Loading placeholders |
| FilterBar | `@/components/mdx/FilterBar` | `groups: FilterGroup[], selected, onChange` | Pill-based filter controls |
| SearchInput | `@/components/mdx/SearchInput` | `value: string, onChange, placeholder?` | Search field with icon |
| Breadcrumbs | `@/components/mdx/Breadcrumbs` | `items: { label: string, href?: string }[]` | Navigation breadcrumbs |
| Tooltip | `@/components/mdx/Tooltip` | `content: string, children` | Hover tooltips |
| Modal | `@/components/mdx/Modal` | `open: boolean, onClose, title, children` | Dialog overlays |
| ConfirmDialog | `@/components/mdx/ConfirmDialog` | `open, onConfirm, onCancel, message` | Destructive action confirmation |
| CopyButton | `@/components/mdx/CopyButton` | `text: string` | Copy-to-clipboard button |
| RelativeTime | `@/components/mdx/RelativeTime` | `date: Date \| string` | "2 hours ago" timestamps |
| Divider | `@/components/mdx/Divider` | `label?: string` | Labeled horizontal rule |
| StatCardGrid | `@/components/mdx/StatCardGrid` | `stats: StatCard[]` | Grid of stat cards |

## Decision Rule

1. Check this table first
2. If the component exists, import and use it
3. If it doesn't exist but is close to one that does, extend the existing one
4. Only build from scratch when nothing in this table matches your need
