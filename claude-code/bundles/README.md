# claude-code/bundles/

Bundle manifests group related Claude Code components for cataloging and optional
distribution workflows.

## Format

Each bundle lives at `claude-code/bundles/<slug>/bundle.yaml` and uses this schema:

```yaml
id: backend-development
name: Backend Development
description: Backend implementation toolkit.
status: stable
tags:
  - backend
components:
  - type: skill
    id: backend
    role: core
```

- `status` is typically `stable`; use `deprecated` only when the bundle should remain
  discoverable but is being retired.
- `components[].role` may be `core`, `optional`, or `deprecated`.
- Skills referenced in bundles resolve to canonical root `skills/<slug>/SKILL.md`.
- Rules are not bundled through this surface; Claude rule adapters are generated under
  `claude-code/rules/`.

## Current Role

The checked-in bundles are indexed in `index.json` and can be consumed by external
installers or catalogs. `claude-code/scripts/install.sh` currently installs the full
Claude surface via directory symlinks; it does not perform bundle-selective installs.

## Updating Bundles

1. Edit `bundle.yaml` under the relevant bundle directory.
2. Re-run `node scripts/generate-index.js`.
3. Run `node scripts/smoke-generated-assets.js` before merging.
