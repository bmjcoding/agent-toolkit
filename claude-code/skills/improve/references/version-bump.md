# Version Bump Rules

Used by improve step 2e (version bump) after accepted changes have been applied to a
component's definition file. The bump is applied to `metadata.version` in the file's
frontmatter.

## Bump Table

| Signal | Bump | Examples |
|---|---|---|
| ≤5 lines changed, no new sections or files | **PATCH** | Gotcha added, wording fix, description tweak |
| New section, new reference file, new script, new capability | **MINOR** | Added model selection analysis, new gotchas section, new references/*.md file |
| Structural rewrite, output format change, handoff schema change | **MAJOR** | Rewrote workflow, changed recommendation table columns, altered handoff JSON shape |

## Tiebreaker

When a single improve run applies multiple changes of different magnitudes to the same
file, use the **highest** applicable bump:

- MINOR beats PATCH
- MAJOR beats MINOR

Example: one change adds a gotcha (PATCH-worthy) and another adds a new references
file (MINOR-worthy) → the file bumps MINOR.

## Initialization

If no `metadata.version` exists in the target file's frontmatter, initialize at
`1.0.0` then apply the computed bump. A first-ever edit whose change is purely a
PATCH-level fix lands at `1.0.1`.

## Recording

Record the old and new version for each file in:

- The improve report summary table (Version column, formatted as `OLD→NEW`)
- The outcome JSON written in step 7, with `version_before` and `version_after`
  fields per changed file

## Canonical Source

The bump semantics here align with `skills/changelog/SKILL.md` — SemVer Bump Table.
When the two ever diverge, the changelog skill is authoritative; update this reference
to match.
