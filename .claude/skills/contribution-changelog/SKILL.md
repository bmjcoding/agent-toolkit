---
name: contribution-changelog
description: Toolkit-specific changelog workflow for one-and-done contributions. Use when preparing agent-toolkit PRs that must bump component versions directly instead of staging entries under Unreleased.
lifecycle: stable
---

# Contribution Changelog

Use this skill for `agent-toolkit` contributions only. It intentionally differs from the
general `changelog` skill: toolkit contribution PRs should add a versioned release
section immediately and should not create or keep `[Unreleased]` sections.

## Rules

- Every touched component must have its own `CHANGELOG.md` updated in the same change.
- Add a new top-level version section for the contribution:

  ```markdown
  ## [X.Y.Z] - YYYY-MM-DD
  ```

- Do not add `## [Unreleased]`.
- Remove existing empty `## [Unreleased]` sections and `[Unreleased]:` footer links when
  touching a changelog.
- Keep versions newest first.
- Keep comparison links at the bottom when the file already has them.
- Root `CHANGELOG.md` tracks repository-wide changes; component changelogs track their
  own component only.

## Bump Rules

| Change type | Bump |
|---|---|
| Breaking behavior, removed public behavior, incompatible schema | MAJOR |
| New component, new feature, new validation, expanded generated output | MINOR |
| Bug fix, doc clarification, path update, warning cleanup | PATCH |

Use the highest applicable bump if a contribution has multiple categories.

## Which Changelog?

| Changed path | Update |
|---|---|
| `agents/<name>/...` | `agents/<name>/CHANGELOG.md` |
| `skills/<category>/.../<name>/...` | that skill's `CHANGELOG.md` |
| `rules/<name>/...` | `rules/<name>/CHANGELOG.md` |
| `workflows/<name>/...` | `workflows/<name>/CHANGELOG.md` |
| `hooks/<name>/...` | `hooks/<name>/CHANGELOG.md` |
| `bundles/<name>/...` | `bundles/<name>/CHANGELOG.md` |
| `claude-code/commands/<name>/...` | `claude-code/commands/<name>/CHANGELOG.md` |
| generated agent adapters | the canonical agent changelog |
| generated workflow prompts/commands | the canonical workflow changelog |
| generated rule instructions | the canonical rule changelog |
| repo-wide generator, CI, install, catalog, or contributor policy | root `CHANGELOG.md` |

When a single edit changes both a component and repo-wide contributor behavior, update
both the component changelog and root `CHANGELOG.md`.

## Workflow

1. Collect changed files:

   ```bash
   {
     git diff --name-only --diff-filter=ACMRD HEAD
     git ls-files --others --exclude-standard
   }
   ```

2. Map changed files to changelogs with the table above. Skill categories are
   open-ended; find the nearest parent directory that contains both `SKILL.md` and
   `CHANGELOG.md`.
3. For each required changelog:
   - read the current latest `## [X.Y.Z] - YYYY-MM-DD` section
   - compute the SemVer bump
   - insert the new version section above the previous latest version
   - write concise bullets under Keep a Changelog categories
   - remove any `[Unreleased]` section or footer link
4. Validate:

   ```bash
   {
     git diff --name-only --diff-filter=ACMRD HEAD
     git ls-files --others --exclude-standard
   } | node scripts/validate-component-changelogs.js --files-from-stdin --require-release-version
   ```

## Output Format

Return:

```json
{
  "changelogs_updated": ["path/CHANGELOG.md"],
  "versions": [{"path": "path/CHANGELOG.md", "version": "X.Y.Z", "bump": "minor"}],
  "validation": "passed | failed"
}
```
