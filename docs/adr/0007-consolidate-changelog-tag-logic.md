# 0007. Consolidate CHANGELOG and Git Tag Logic to /changelog Skill

Date: 2026-04-14

## Status

Accepted

## Context

CHANGELOG promotion and git tag creation logic had accumulated in at least four separate locations:

- `claude-code/skills/changelog/SKILL.md` — the intended canonical home
- `claude-code/frankenstein.md` Phase 6a — inline promotion steps
- `claude-code/skills/improve/SKILL.md` step 2f — inline bump/promote
- `claude-code/skills/release-engineer/SKILL.md` — tag creation (with a wrong format)

No actor was consistently pushing tags. The release-engineer created bare `v<version>` tags instead of the required `{slug}-v{version}` format established in ADR 0004. The pre-push hook enforced that CHANGELOG.md was modified, but did not verify that a matching tag was present on any newly-promoted `[X.Y.Z]` header.

The observable result was 276 missing tags in this repository and at least 1 in a downstream project, silently accumulating over several months of normal pipeline operation.

## Decision

### 1. Single canonical actor

`claude-code/skills/changelog/SKILL.md` is the sole owner of:

- CHANGELOG format rules (Keep a Changelog, MADR conventions)
- SemVer bump logic (major / minor / patch criteria)
- Promotion of `[Unreleased]` to `[X.Y.Z]` with date
- Git tag creation in `{slug}-v{X.Y.Z}` format
- Tag push to origin

Inline copies in `frankenstein.md` Phase 6a and `improve/SKILL.md` step 2f are removed. `release-engineer` delegates to the skill rather than reimplementing.

### 2. /changelog release subcommand

A new `release [<slug>]` subcommand performs an atomic triple:

1. Promote `[Unreleased]` → `[X.Y.Z] - YYYY-MM-DD`
2. Commit the CHANGELOG change
3. Create and push `{slug}-v{X.Y.Z}` tag

Without the subcommand, tag creation and push were implicit and therefore skippable. Making it explicit and named gives pipelines a stable call target and makes omission visible in logs.

### 3. [Unreleased] as universal staging area

Any agent that touches a component during a pipeline run (doc-writer, fix agents, release-engineer) appends entries under `[Unreleased]`. The release-engineer promotes the section at ship time via `/changelog release`. This separates the concern of *recording* a change from the concern of *versioning* it.

### 4. Pre-push hook extension

The pre-push hook is extended to inspect any CHANGELOG.md modified in the outgoing commit set. If the diff introduces a `[X.Y.Z]` header that did not previously exist, the hook verifies that a `{slug}-v{X.Y.Z}` tag exists in the local repo (either created in this push or already present). Pushes that promote a version without a matching tag are blocked.

Consequence for in-progress work: a developer who manually edits a CHANGELOG header to a version number while still iterating must either (a) run `/changelog release` first, or (b) pass `--no-verify`. In-progress work should remain under `[Unreleased]` to avoid triggering the check.

### 5. Per-component atomicity; cross-component is not atomic

Each `/changelog release` call covers exactly one component. A pipeline releasing N components makes N sequential calls. Partial success (components 1–K released, K+1 fails) is acceptable: the released components have valid tags and the unreleased ones retain their `[Unreleased]` staging state. Recovery is a re-run of `/changelog release` on the remaining components. No two-phase commit or rollback is implemented.

### 6. Migration: backfilling missing tags

The 276 missing tags in this repository and the 1 missing tag in the downstream project were backfilled to origin as part of this session. Eight tags on unmerged branches were deferred; the deferred list is tracked in `docs/deferred-tags.md` for post-merge follow-up.

## Consequences

### Positive

- Single source of truth for CHANGELOG/tag logic. Format changes, bump criteria, and tag conventions require edits to exactly one file.
- The wrong-format bare `v<version>` tag class of bug cannot recur: the skill enforces `{slug}-v{version}` and the pre-push hook blocks pushes that diverge from it.
- The missing-tag class of bug is eliminated by the hook for all future releases.
- `[Unreleased]` staging decouples recording from versioning, making CHANGELOG entries during mid-pipeline phases safe.

### Neutral

- Agents that previously contained inline logic now have a delegation dependency on the changelog skill. If the skill path changes, callers need updating — but this is one file to update rather than four.
- The `release` subcommand is a new surface area; pipelines that did not previously call a release step must be updated to invoke it explicitly.

### Negative

- The extended pre-push hook is stricter. Work-in-progress that prematurely promotes a version header will be blocked at push time. Developers must either revert to `[Unreleased]` or run `/changelog release` before pushing.
- Backfilling 276 tags required a one-time batch push. Any repository that did not receive the backfill before the hook was deployed could experience push failures until the backfill is applied.

## Alternatives Considered

**Keep inline logic, add a lint check**: a periodic consistency-check script could have detected drift between the four inline copies. Rejected — it addresses symptom (drift) not cause (duplication). Any new actor could re-introduce a fifth copy.

**Release-engineer owns tags, changelog skill owns format**: split ownership where the skill handles format/bump and release-engineer handles tag push. Rejected — the tag format is inseparable from the CHANGELOG version string. Splitting ownership requires the two actors to stay in sync, which is the original problem.

**Two-phase commit across components**: coordinate a rollback if any component in a multi-component release fails. Rejected — cross-component atomicity adds significant orchestration complexity for a failure mode (partial release) that is recoverable by re-run. The simpler model (per-component atomicity, partial success acceptable) was preferred.

## References

- ADR 0004: `docs/adr/0004-per-component-changelog-tag-format.md` — establishes `{slug}-v{version}` tag format
- Changelog skill: `claude-code/skills/changelog/SKILL.md`
- Deferred tag list: `docs/deferred-tags.md`
- Session: `.orchestrator/sessions/20260414T120040/`
