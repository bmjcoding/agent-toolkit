---
name: design-lint
description: Deterministic design system linting checks. Use when reviewing Tailwind CSS/React components for structural violations. Defines grep/regex patterns run by the design-linter agent.
metadata:
  version: 1.0.0
---

# Design Lint — Deterministic Check Catalog

This skill defines structural checks that can be run via grep/regex against `.tsx` and `.ts` files. No LLM judgment — pure pattern matching.

## Check Catalog

| Check | Script | Pattern | Violation | Reference |
|-------|--------|---------|-----------|-----------|
| `hex-colors` | `checks/hex-colors.sh` | `#[0-9a-fA-F]{3,8}` in .tsx/.ts | Arbitrary hex instead of semantic token | `design-authority/references/design-tokens.md` |
| `dark-mode-pairs` | `checks/dark-mode-pairs.sh` | `bg-`, `text-`, `border-`, `divide-`, or `ring-` color without `dark:` counterpart | Missing dark mode support | `design-authority/references/design-tokens.md` |
| `border-radius` | `checks/border-radius.sh` | `rounded-md`, `rounded-sm` | Wrong radius (use 2xl/xl/lg) | `design-authority/references/components/surfaces.md` |
| `z-index` | `checks/z-index.sh` | `z-[` arbitrary values | Use defined z-scale only | `design-authority/references/effects.md` |
| `shadow-weight` | `checks/shadow-weight.sh` | `shadow-md`, `shadow-lg`, `shadow-xl` | Too heavy (max shadow-sm) | `design-authority/references/effects.md` |
| `focus-visible` | `checks/focus-visible.sh` | `outline-none` without `focus-visible:ring` | Missing keyboard nav | `design-authority/references/components/focus.md` |
| `oklch-gamut-surface` | `checks/oklch-gamut-surface.sh` | OKLCH C > 0.15 in `bg-` contexts | Surface chroma exceeds bound | `design-authority/references/color-system.md` |
| `oklch-gamut-accent` | `checks/oklch-gamut-accent.sh` | OKLCH C > 0.25 in any context | Hard ceiling for display gamut | `design-authority/references/color-system.md` |

## Usage

Each check script accepts file paths as arguments and outputs violations in the format:

```
file:line:match
```

Exit code 0 = no violations, exit code 1 = violations found.

## Suppression

`{/* design-lint-disable <check-name> */}` on the preceding line suppresses a specific check for that line. Scripts check for this comment before reporting. Use sparingly — every suppression should have a reason comment.

The linter reports suppression count alongside violations so the reviewer can audit them.

## Output Format

Each check script outputs `file:line:match` per violation, exit 0 for clean, exit 1 for violations. Present a summary of violation counts per check, followed by the raw lines for any failing checks.

## Gotchas

- Check scripts must be run from the skill directory so relative paths resolve; passing absolute paths to the scripts avoids this.
- Suppressions silently reduce the reported violation count — always audit the suppression total before marking a file as clean.
- **dark-mode-pairs is line-scoped**: The `dark-mode-pairs` check looks at color utilities on the same line. React components often spread className values across multiple lines (using `cn()` or template literals). A color utility on one line and its `dark:` counterpart on another line will be flagged as a violation even though the pair exists. Treat `dark-mode-pairs` violations in multiline className patterns as likely false positives — verify manually before reporting.
