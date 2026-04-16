---
paths: ["**/*.js", "**/*.ts", "**/*.tsx", "**/*.jsx", "**/package.json"]
---
- `npm install` to update dependencies. For production dependencies, pin exact versions in `package.json` (e.g., `"express": "4.18.2"`) and rely on `package-lock.json` for reproducible installs — do not use floating ranges (`^`, `~`) for production deps. Dev tooling (linters, formatters, type-checkers) may use caret ranges but should still be reviewed before upgrading.
- **Lockfile policy**: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, and `bun.lockb` are auto-generated protected files. Do not delete, regenerate, or manually edit them without explicit user confirmation. The "never pin" guidance above applies only to the version range specifiers in `package.json` — not to lockfiles. If a lockfile must be regenerated, surface it to the user rather than auto-modifying it.
