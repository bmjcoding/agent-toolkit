# Migration and Renumbering Procedures

Two procedures: migrating an existing `CHANGELOG.md` from monolithic repo tags to
per-component tags, and renumbering versions to compress gaps. Load this file only when
performing one of these operations — both are rare, per-repo or per-component tasks.

## Migrating from Monolithic Tag Format

If a CHANGELOG was written before per-component tags were adopted, its footers may
reference bare `v{version}` tags (e.g., `compare/v1.0.0...v1.1.0`). Follow these steps
to migrate.

### 1. Identify old-format CHANGELOGs

```bash
grep -r '^\[.*\]: .*compare/v[0-9]' **/CHANGELOG.md
```

### 2. Rewrite footers to dash-style

Replace monolithic tag refs with per-component tags following the exemplar in
`skills/changelog/CHANGELOG.md`. The oldest-version footer switches from
`releases/tag/v{version}` to `tree/{slug}-v{version}`.

### 3. Do NOT delete old monolithic tags

Old `v{version}` tags can coexist with new `{slug}-v{version}` tags indefinitely.
Removing them rewrites history and breaks anyone referencing them externally (links, CI
pipelines, package registries).

### 4. Order of operations

1. Rewrite all CHANGELOG footers to use `{slug}-v{version}` format.
2. Commit the footer changes.
3. Run `scripts/backfill-changelog-tags.sh --slug <slug> --changelog <path>` to generate
   historical per-component tags. Use `--dry-run` first to preview.
4. Push the new tags: `git push origin --tags`. Existing monolithic tags are untouched.

---

## Version Renumbering

When compressing version gaps (e.g., renumbering 1.0.0 → 1.5.0 down to 1.0.0 → 1.3.0),
follow these steps **in order**. Order matters — skipping step 3 leaves the definition
file reporting a version that does not exist in the CHANGELOG.

### 1. Rewrite version headers

Rewrite the `## [X.Y.Z]` headers in `CHANGELOG.md` using the new numbering.

### 2. Update comparison links

Update the comparison links at the bottom of `CHANGELOG.md` to match the new versions.

### 3. Update definition file version comments (REQUIRED)

Search the component directory for definition files (`*.md`) and update any
`# version:` comment to match the new highest released version. The version comment is
the single source of truth visible to agents loading the definition — a mismatch causes
confusion about which feature set is loaded.

```bash
grep -l "# version:" agents/{name}/*.md skills/{name}/*.md 2>/dev/null
```

### 4. Verify

Confirm `grep "# version:" <definition-file>` matches the highest `## [X.Y.Z]` header
in the CHANGELOG.
