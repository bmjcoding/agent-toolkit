# Density Modes

## Two Modes

### Marketing / Content Mode (default)

For narrative content, landing pages, documentation, onboarding.

- Spacing: `gap-6` to `gap-8`, `p-5` or `p-6`
- Text: `text-sm` to `text-base`, `leading-relaxed`
- Cards: generous padding, visual breathing room
- Sections: `space-y-8` between major blocks

### Platform / Dashboard Mode

For dashboards, data tables, admin panels, monitoring views.

- Spacing: `gap-2` to `gap-4`, `p-3`
- Text: `text-xs` to `text-sm`, `leading-snug`
- Cards: compact padding, information density
- Sections: `space-y-4` between major blocks

## Decision Rule

**Tabular/scannable data → platform mode.** Narrative content → marketing mode.

## Quick Reference

| Context | Mode | Gap | Padding | Text | Leading |
|---------|------|-----|---------|------|---------|
| Dashboard | Platform | `gap-3` | `p-3` | `text-sm` | `leading-snug` |
| Data table view | Platform | `gap-2` | `p-3` | `text-xs`/`text-sm` | `leading-snug` |
| Settings page | Platform | `gap-4` | `p-4` | `text-sm` | `leading-normal` |
| Landing page | Marketing | `gap-8` | `p-6` | `text-base` | `leading-relaxed` |
| Documentation | Marketing | `gap-6` | `p-5` | `text-sm` | `leading-relaxed` |
| Onboarding flow | Marketing | `gap-6` | `p-6` | `text-sm`/`text-base` | `leading-relaxed` |

## Mixing Rule

No mixing modes within a single view unless there is a clear container boundary. For example, a marketing hero section above a platform-density data table is acceptable if separated by a distinct container (different background, border, or significant spacing).
