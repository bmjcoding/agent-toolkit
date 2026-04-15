# 0006. Retro-Loop Improvements: D-Series Strategy

Date: 2026-04-14

## Status

Accepted

## Context

Over four PRs (#16–#19, session 20260413T215203) and this PR (D2 + D3 + P4, session 20260414T073313), the agent-toolkit retro loop accumulated several structural pain points:

- `frankenstein.md` (the orchestrator dispatcher) was growing unbounded. Each `improve` cycle could add rules; nothing removed them. The retro rubric introduced a size-trajectory check in PR #17, but no deletion mechanism existed.
- Analyst retrospectives surfaced repeated patterns across sessions (recurring unresolved findings, persistent low-signal P2 noise) with no tooling to detect cross-session trends. Each retro operated in isolation.
- No mechanism existed to mark a rule as stale or expired. Rules landed via `improve accept` and stayed indefinitely.
- Eleven of fourteen agent definitions contained project-specific identifiers (function names, file paths, enum values) from the ALT Central project, making the definitions non-portable. A verbosity audit (C-8 spike in PR #17) catalogued 34 findings across 14 agents.
- The four-bullet untrusted-data preamble and instruction sandwich appeared verbatim in 11 of 14 agent definitions, contributing approximately 250 duplicate lines corpus-wide.

## Decision

The work is organized into four pillars:

### 1. Rule expiry metadata (D2.1)

A sidecar JSON file at `~/.claude/metadata/rule-expiry.json` tracks per-rule metadata: `rec_id`, `target_file`, anchor text, `added` date, `source_session`, `review_by` date (90 days forward), `last_reviewed`, and `status` (active/expired/removed).

The alternative — storing metadata as HTML comments inline in agent definition Markdown — was rejected for three reasons: the META-002 batch scanner requires programmatic query (JSON + `jq` vs regex scraping across N files), atomic rewrites are harder when touching many `.md` files (each governed by the protect-config hook), and inline comments would fragment when the shared preamble is factored out (P4).

The `improve accept` workflow writes a new entry on each accepted fix. The `~/.claude/metadata/` directory receives its own `CHANGELOG.md` because the schema is versioned and future migrations need a history.

### 2. `improve remove` primitive (D2.4)

A new `remove` subcommand is added to the improve skill. It requires explicit one-word confirmation ("yes") before (a) setting the rule's status to `removed` in `rule-expiry.json` and (b) deleting the matching rule text from its host file. The higher confirmation bar (vs `accept`/`reject`) reflects the destructive and asymmetric nature of the operation. A pruning pass at the end of the apply-verify loop (step 5) surfaces any rules past their `review_by` date as candidates — it does not auto-remove.

### 3. Cross-session retrospective batch (D2.2) and periodic analyst reminder (D2.3)

`skills/retro/scripts/meta-retro-batch.py` aggregates the most recent N (default 10) retro JSON files from `STATE_ROOT/retros/orchestrator/`. It reports five signal categories: recurring unresolved findings, severity-category skew, low-signal P2 noise, `frankenstein_lines` size trajectory, and cross-session recommendation persistence. The script uses only Python stdlib.

The retro skill gains a lightweight date-check at the start of the recommendations section: if more than 30 days have passed since the last standalone `autoresearch-analyst` retro, a META-001 reminder bullet is prepended to the output.

### 4. Agent-definition cleanup (D3) and preamble factoring (P4)

**D3**: 32 audit findings across 11 agents are resolved. The highest-priority changes remove project-specific identifiers (function names, file paths, enum values from the ALT Central project) and consolidate duplicate rule content. Agents fixed: planner, backend-engineer, quality-engineer, site-reliability-engineer, security-engineer, plan-reviewer, autoresearch-analyst, frontend-engineer, design-architect, doc-writer, integration-verifier, and release-gate.

**P4**: The four-bullet untrusted-data prelude and instruction sandwich is extracted to a shared reference file at `skills/improve/references/security-preamble.md`. Each of the 11 agents that previously contained the verbatim block now includes a pointer to that file instead. This factoring reduces the corpus by approximately 200 lines.

## Consequences

### Positive

- Rule expiry machinery provides a bounded lifecycle for rules: they are added with a review date and can be removed via an auditable, confirmation-gated path.
- Cross-session pattern detection is now possible once 10+ retros accumulate in `STATE_ROOT/retros/orchestrator/`.
- P4 factoring removes approximately 200 duplicate lines corpus-wide. `frankenstein.md` and the 11 affected agent definitions are shorter and easier to diff.
- Agent definitions are now project-neutral and can be used without modification outside the ALT Central context.

### Neutral

- Each of the 11 agents that adopted the shared preamble now has a sub-file dependency on `skills/improve/references/security-preamble.md`. If that file is moved or renamed, all 11 agents need updating.
- The meta-retro-batch script requires at least 10 retro JSON files before it produces output; early runs produce a "not enough runs yet" message.
- `~/.claude/metadata/` is a new global state directory outside the toolkit repo. It is not version-controlled by default and must be backed up separately if portability across machines is needed.

### Negative

- D3 and P4 together produce two version bumps per affected agent in this PR (one minor for D3 project-bias fixes, one for P4 preamble factoring). This creates a denser CHANGELOG compared to a single bump per agent.
- Rule-expiry tracking is opt-in and forward-only. Existing rules in all agent definitions are untracked until an author manually annotates them via a follow-up pass. The `rule-expiry.json` file starts empty.

## Alternatives Considered

**HTML comments inline**: storing rule metadata as `<!-- added: DATE, rec-id: ID, review-by: DATE -->` comments directly in agent definition Markdown. Rejected — see D2.1 rationale above.

**Standalone preamble skill**: packaging the shared untrusted-data block as a new skill entry with its own `index.json` entry and install path. Rejected — it would add skill-catalog overhead (new entry, CHANGELOG, versioning) for content that is purely a shared reference fragment. Reusing the existing `improve/references/` directory is a lighter fit.

**Auto-removal of expired rules**: having the pruning pass automatically delete rules past their `review_by` date without user confirmation. Rejected — rule removal requires human judgment about whether the underlying behavior is still needed; automated deletion is too aggressive for a tool operating on agent definitions.

## References

- PRs: #16 (prior-session sync), #17 (cheap wins + C-8 verbosity audit), #18 (retro /improve output), #19 (D1 schema + logic bugs), this PR (D2 + D3 + P4)
- Session handoff: `.orchestrator/sessions/20260413T215203/next-session-handoff.md`
- D2 design decisions: `.orchestrator/sessions/20260414T073313/context/d2-design-decisions.md`
- Verbosity audit: `.orchestrator/sessions/20260413T215203/context/spike-agent-verbosity-audit.md`
- Rule expiry schema: `~/.claude/metadata/rule-expiry.json`
- Shared preamble: `skills/improve/references/security-preamble.md`
- Meta-retro script: `skills/retro/scripts/meta-retro-batch.py`
