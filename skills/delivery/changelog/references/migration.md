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

### 2. Rewrite footers to canonical namespaced tags

Replace monolithic tag refs with per-component tags following the exemplar in
`skills/delivery/changelog/CHANGELOG.md`. The oldest-version footer switches from
`releases/tag/v{version}` to `tree/{slug}-v{version}`.

### 3. Remove obsolete flat tags only after the migration is complete

Do not delete historical flat tags until both of these are true:
- every affected `CHANGELOG.md` footer has been rewritten to the canonical namespaced
  tag format
- the replacement `<namespace>/<slug>-v{version}` tags already exist locally and on the remote

Once the changelog links and replacement tags are in place, delete only the superseded
flat component tags that no longer have any live references. Keep repo-wide release tags
such as `v{version}` when the root `CHANGELOG.md` still uses them.

If the repository previously created mirrored tool-local tags for shared components
(for example `claude-code/frankenstein-v3.0.0` alongside `agent/frankenstein-v3.0.0`),
rewrite the live refs first and then delete the redundant mirrored tool-local tags too.

### 4. Order of operations

1. Rewrite all CHANGELOG footers to use `<namespace>/<slug>-v{version}` format.
2. Commit the footer changes.
3. Run `scripts/backfill-changelog-tags.sh --slug <namespace>/<slug> --changelog <path>` to generate
   historical per-component tags. Use `--dry-run` first to preview.
4. Push the new tags: `git push origin --tags`.
5. Delete only the now-unreferenced flat component tags and redundant mirrored tool-local tags locally and on the remote.

---

## Version Renumbering

When compressing version gaps (e.g., renumbering 1.0.0 → 1.5.0 down to 1.0.0 → 1.3.0),
follow these steps **in order**. Order matters — skipping step 3 leaves the definition
file reporting a version that does not exist in the CHANGELOG.

### 1. Rewrite version headers

Rewrite the `## [X.Y.Z]` headers in `CHANGELOG.md` using the new numbering.

### 2. Update comparison links

Update the comparison links at the bottom of `CHANGELOG.md` to match the new versions.

### 3. Remove legacy inline version markers

If the component directory still contains any inline version markers in definition files,
delete them during the migration. Released versions are tracked only in `CHANGELOG.md`.

```bash
rg -n "# version:" agents/{name} skills/*/{name} 2>/dev/null
```

### 4. Verify

Confirm the renumbered `CHANGELOG.md` is internally consistent:
- the highest released `## [X.Y.Z]` header is correct
- comparison links match the new numbering
- no legacy inline `# version:` markers remain in the component definition files
