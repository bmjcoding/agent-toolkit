# 0004. Per-Component Dash-Style Changelog Tag Format and Cross-Platform URL Generation

Date: 2026-04-12

## Status

Accepted

## Context

agent-toolkit is a monorepo with 47 components (agents, hooks, skills, commands, rules), each maintaining its own CHANGELOG.md and independent semantic version. The original changelog skill generated footer compare links using monolithic `vX.Y.Z` repo tags — tags that were never created, causing every CHANGELOG footer link to 404. Separately, users deploy this toolkit across mixed git hosting environments: GitHub (public work), Bitbucket Datacenter (enterprise), GitLab, and Bitbucket Cloud. A single URL strategy fails across all four platforms without an abstraction layer.

## Decision

1. **Tag format**: `{slug}-v{version}`, where `slug` is the leaf directory name (e.g., `frankenstein-v1.5.0`, `changelog-v2.0.0`). Leaf-name uniqueness is verified across all 47 components, making the slug unambiguous as a tag prefix.

2. **Dash-style chosen** over slash-style (`agents/frankenstein/v1.5.0`) or Lerna-style (`frankenstein@1.5.0`). Slashes cause URL routing issues on Bitbucket; `@` triggers percent-encoding on Bitbucket and is non-standard outside npm. Dashes are URL-encoding-safe on all four supported platforms.

3. **Cross-platform URL generation** uses a hybrid auto-detection strategy: parse `git remote get-url origin` to identify the host and generate proper compare URLs for GitHub, GitLab, and Bitbucket Cloud. Fall back to a plain-text `git log` command string for unrecognized hosts or incomplete Bitbucket Datacenter configuration.

4. **Bitbucket Datacenter web-UI compare URLs** use `?targetBranch=refs/tags/...&sourceBranch=refs/tags/...` query parameters. These are community-documented; the official Atlassian REST API uses `?from=`/`?to=` instead. The web-UI parameters are not in official docs but are widely established in practice.

5. **Config escape hatch**: `.changelog-platform.yml` at repo root supports explicit override of platform, base URL, project key, repo slug, tag format, and default branch. This is required for Bitbucket Datacenter users, since the clone URL alone is often insufficient to derive the project key.

6. **Oldest-version footer link** uses `tree/{slug}-v{version}` (always-valid tag-view URL) rather than `releases/tag/{slug}-v{version}`, which requires a GitHub Release object to exist. Release objects are not created as part of this workflow.

## Consequences

**Positive**

- Every footer compare link resolves to a valid URL once historical tags are created via `skills/delivery/changelog/scripts/backfill-changelog-tags.sh`.
- Tag lineage is independent per component; one component's version history is fully isolated from others.
- The skill is portable to Bitbucket Datacenter, GitLab, and Bitbucket Cloud without forking.
- The plain-text `git log` fallback always produces correct output — no silent 404s on unrecognized platforms.

**Negative**

- Component renames break tag lineage: tags prefixed with the old leaf name become orphaned. A rename procedure exists as documentation but is not yet formalized in a script.
- The Bitbucket Datacenter web-UI URL template is community-documented. If Atlassian changes the format, all previously generated footer links require regeneration.
- `skills/delivery/changelog/scripts/detect-platform.sh` depends on `git remote` being configured. New repositories without a configured origin fall through to `unknown` and receive the plain-text fallback.

## Alternatives Considered

- **Monolithic repo tags (`vX.Y.Z`)** — rejected: ambiguous across 47 components and was the source of the original broken-link state.
- **Slash-style tags (`agents/frankenstein/v1.5.0`)** — rejected: URL encoding friction on Bitbucket routes slashes as path segments.
- **Lerna-style tags (`frankenstein@1.5.0`)** — rejected: percent-encoding on Bitbucket; non-standard outside the npm ecosystem.
- **Commit SHA compare URLs** — rejected: not human-readable and not stable across rebases.
- **Plain-text only everywhere** — rejected: loses clickable navigation on GitHub and GitLab where compare URLs are reliable and useful.
