# Anti-Patterns, Commit-Log Rules, and Yanked Releases

Full reference table of changelog anti-patterns, the commit-log-vs-changelog rule, and
how to mark a yanked release. `SKILL.md` carries only the short gotchas list — load
this file when linting a CHANGELOG or authoring automated entry generation.

## Anti-patterns Table

| Anti-pattern | Type | Why it fails |
|---|---|---|
| `## X.Y.Z` without brackets | Formatting | Breaks tooling that parses `## [x.y.z]` format |
| Non-ISO dates (e.g., `04/05/26`) | Formatting | Ambiguous and unacceptable |
| No `## [Unreleased]` section when using branch-local release workflow | Formatting | Forces readers to diff branches to see in-progress work |
| Tag-backed comparison links | Formatting | Not portable to Bitbucket Data Center; omit version link footers unless a non-tag-backed URL scheme exists |
| Version gaps (1.0.0 to 1.3.0 without 1.1.0 and 1.2.0) | Formatting | Implies undocumented changes; reconstruct or renumber |
| Commit-log dumps (`git log`) | Process | Noise; conflates internal churn with user-facing change |
| Using a future or guessed release date | Process | Date must be the actual release-section date in ISO 8601; placeholders like `YYYY-MM-DD` left in published CHANGELOGs are invalid |
| Hardcoding a GitHub compare URL in a project hosted on Bitbucket | Process | URL will 404; omit footers until the target host has a stable non-tag-backed URL |
| Using repository-level version assumptions for component changes | Process | Implies a single release covering all components; bump only touched component changelogs |
| Lumping unrelated changes | Semantic | One bullet = one idea; avoid "and also fixed X" entries |
| `## [1.0.1] - 2025-04-11 [YANKED]` without explanation | Semantic | Yanked releases must explain why in the section body |
| Version comment in definition file not updated after renumbering | Semantic | Leaves definition file reporting a version that does not match the CHANGELOG |
| Omitting `### Deprecated` entries when features are deprecated | Semantic | Violates KaC bad-practices; users cannot anticipate removals — see https://keepachangelog.com/en/1.1.0/#bad-practices |
| Tagging a pre-release as a stable version (e.g., `1.0.0-rc.1` shipped as `1.0.0`) | Semantic | Hides stability status from consumers. Use SemVer pre-release identifiers (-alpha, -beta, -rc.N) and document them under `[Unreleased]` until promoting to stable. See [KaC bad practices](https://keepachangelog.com/en/1.1.0/#bad-practices). |

Upstream reference: https://keepachangelog.com/en/1.1.0/#bad-practices.

---

## Commit Logs vs. Changelog Entries

The Keep a Changelog specification explicitly states: **do not use commit logs as
changelogs**. This rule applies to all automated CHANGELOG generation in the toolkit.

| Bad (commit-log dump) | Good (user-facing summary) |
|---|---|
| `Updated SKILL.md lines 40-55` | `Enforced OKLCH-only color notation for all utility classes` |
| `Modified dark-mode-pairs.sh` | `Updated dark-mode lint check to catch missing OKLCH dark counterparts` |
| `feat(f0eda66): restructure toolkit` | `Restructured toolkit into per-component subdirectories` |
| `Added 3 bullets to Section 2` | `Added guidance on post-change compile verification` |

**Rules for automated generation:**

- Do NOT list file names or line numbers in changelog entries.
- Do NOT copy commit message titles verbatim.
- Do NOT dump raw git diff output.
- DO summarize the user-meaningful outcome of a change.
- DO aggregate multiple related commits into a single entry.
- DO use verb-prefixed one-liners (Added, Changed, Fixed, Removed).

---

## Yanked Releases

A release is yanked when it contains a critical bug or breaking change that must not be
consumed by new users. To mark a release as yanked, append `[YANKED]` after the date on
the version header:

```markdown
## [1.2.0] - 2026-04-11 [YANKED]
```

Rules:

- `[YANKED]` is appended directly after the date with a single space.
- The section body **must** include a brief explanation of why the release was yanked
  and, if applicable, which version to use instead.
- Do not delete the section — the entry must remain in the changelog for auditability.
- Do not add tag-backed comparison links for yanked releases.
