# Changelog

All notable changes to this component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Declared canonical lifecycle metadata so the distribution catalog can publish normalized lifecycle state for this shared skill.

- Updated follow-up workflow wording to refer to `improve` generically so the shared skill text does not assume Claude slash-command syntax.
- Normalized retro storage guidance around `~/agent-retros`, clarified compatibility
  handling for legacy roots, and tightened script-availability expectations for the new
  runtime layout.
- Updated finalization guidance so retro summaries read released version information from component changelogs instead of inline definition markers.

## [5.0.0] - 2026-04-14

### Added

- Canonical JSON Schema draft-07 at `claude-code/tools/retros/schemas/retro-v5.0.json` (34 fields, 14 required).
- PII scrubber (`tools/retros/scrub.py`) applying rules R-01..R-07, R-10..R-14. Keeps bmjcoding/ org + commit SHAs per policy.
- Schema normalizer (`tools/retros/normalize.py`) for Gen1..Gen4 → v5.0 migration. Emits *.normalized.json alongside originals.
- Structural validator (`tools/retros/validate.py`), Python stdlib-only.
- Index generator (`tools/retros/index.sh`) producing all.jsonl + by-agent/<slug>.jsonl (15 slugs) + by-skill/<slug>.jsonl (13 slugs) + frankenstein-timeline.jsonl + paired .md tables.
- Scrubbed public corpus at `claude-code/retros/` (38 historical retros, PII-clean).

### Changed

- BREAKING: `references/finalization.md` Save step requires v5.0 schema: schema_version='5.0', compact session_id (YYYYMMDDTHHMMSS), findings_total, total_cost_usd (renamed from estimated_cost_usd), wall_clock_min (renamed from wall_clock_minutes), fix_churn (renamed). findings object no longer includes 'total' sub-key. Verdict enum canonicalized to underscore-only forms.
- `SKILL.md` D2.3 autoresearch-analyst path updated for reshaped directory layout.
- `~/.claude/retros/` reshaped to `sessions/YYYY-MM/<session-id>/`, `agent-reviews/<agent>/YYYY-MM/`, `skill-reviews/<skill>/YYYY-MM/`, `meta/YYYY-MM/`. Old paths (`orchestrator/`, `orchestration/`) now symlink to `sessions/` for a 1-week grace period.

## [4.2.4] - 2026-04-14

### Changed

- SKILL.md: Model Recommendations required-field discipline block added immediately after the "Produce a recommendation" sentence in section 3.4. Rationale field now requires both task characteristics and per-run evidence. Est. Savings field now requires both token savings and cost savings. Pure price-only recommendations are explicitly prohibited. Example output table added to illustrate the expected format.

## [4.2.3] - 2026-04-14

### Fixed

- scripts/parse-metrics.py line 389: replaced `e["id"]` with `e.get("agent_id", e.get("id", "unknown"))` — fixes `KeyError: 'id'` crash when agents.log entries use the `agent_id` key format written by the frankenstein dispatcher template, rather than the normalized `id` key expected by the script.

## [4.2.2] - 2026-04-14

### Changed

- Quoted `$LAST_DATE` in D2.3 date-check bash snippet to harden against shell-metacharacter edge cases (regex gate already prevents exploitation).

### Added

- SKILL.md: D2.3 periodic analyst reminder — at the start of section 3.7, a Bash date-check reads `~/.claude/retros/autoresearch-analyst/` for the most recent non-improve file and prepends a META-001 bullet when the last standalone retro is more than 30 days ago. Fires silently if directory is absent.
- SKILL.md: rule-expiry surfacer — after writing the retro draft (Finalization step 1), checks `~/.claude/metadata/rule-expiry.json` for `status="active"` entries with `review_by` before today and appends a single P2 recommendation listing expired rec-ids. Informational only; does not modify rule-expiry.json.
- New file `scripts/meta-retro-batch.py` (D2.2 META-002 history scanner). Reads retro JSON corpus from `~/.claude/retros/orchestrator/*.json` and produces a meta-retro markdown every N pipelines (default 10) covering recurring unresolved findings, category skew, low-signal P2 noise, frankenstein.md size trajectory, and cross-session recommendation persistence. CLI flags: `--retro-dir`, `--out-dir`, `--interval`, `--dry-run`, `--force`. Python 3 stdlib only.
- Usage note in meta-retro-batch.py argparse block documenting the filesystem-permission trust boundary for --retro-dir / --out-dir.

## [4.2.1] - 2026-04-14

### Fixed

- finalization.md: added fallback rule in `### Per-Recommendation State Verification` — if the target file named in a recommendation does not exist (deleted or moved since the recommendation was recorded), the recommendation is marked `open` with note `(target file not found — cannot pre-verify)`. Prevents silent auto-skip or auto-close when the target is missing (fixes sre-d1-003 / da-d1-002).

## [4.2.0] - 2026-04-14

### Added

- finalization.md: per-recommendation state-verification step (`### Per-Recommendation State Verification`) in the Validation section. Before listing a recommendation as open, the retro checks target files for evidence the fix is already applied. Recs confirmed present are marked `skipped-already-applied` rather than re-surfaced as open findings.
- finalization.md: `pre_verified_skipped` metric field in Save section JSON schema to distinguish verification-time skips from improve-time skips.

## [4.1.0] - 2026-04-13

### Added

- `metrics` block in retro output JSON schema: five new fields (`frankenstein_line_count`, `dispatcher_tokens_estimated`, `dispatch_count`, `avg_dispatch_prompt_tokens`, `net_line_delta`) added to finalization.md metric fields table.
- Trajectory check step in Trends section: reads last 5 `frankenstein_line_count` values, flags monotonic growth as P1, bakes `net_growth_flag: true` soft budget warning when `net_line_delta > 0`.
- Markdown summary table updated to include all five new metric rows.

## [4.0.1] - 2026-04-13

### Fixed

- `scripts/parse-metrics.py`: null-token guard added around `sum(e.get("tokens", ...) ...)` aggregation — entries with missing `tokens` keys are now filtered out instead of contributing 0, producing an accurate total (Rec #2 from retro 20260413T211547; improve agent falsely claimed fix was pre-existing, Phase A audit confirmed it was not applied until this run).

## [4.0.0] - 2026-04-13

### Removed

- BREAKING: manifest.json deleted. Dependency declarations are now read from YAML frontmatter in the component's .md definition file. No behavioral change to the component itself.

## [3.0.0] - 2026-04-12

### Changed

- Historical note: v3.0 temporarily moved this skill into tool-local copies before root `skills/` was restored as canonical.

## [2.0.0] - 2026-04-12

### Changed

- BREAKING: moved to the agent-toolkit multi-tool layout. Files relocated:
  - Canonical shared-skill path normalized under root `skills/`
- CHANGELOG comparison URLs updated for repo rename `bmjcoding/claude-toolkit` → `bmjcoding/agent-toolkit`.

## [1.1.0] - 2026-04-11

### Changed

- Updated retro scripts (parse-metrics.py, retro-history.py, verify-claims.py), evals, and reference files (finalization.md, system-architecture.md) for subdirectory layout

### Added

- Plan inventory accuracy check to orchestration-deep-dive.md Plan Quality section
- Handoff schema contract note in orchestration-deep-dive.md Coordination section — `files_written` must be array not integer
- Security-engineer scope heuristic in orchestration-deep-dive.md Model Selection section — early-exit pattern for docs-only changesets

### Fixed

- parse-metrics.py: handle `files_written` integer gracefully (treat as empty list) instead of crashing with TypeError

## [1.0.0] - 2026-04-11

### Added

- Initial release

[Unreleased]: https://github.com/bmjcoding/agent-toolkit/compare/skill/retro-v5.0.0...HEAD
[5.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/retro-v4.2.4...skill/retro-v5.0.0
[4.2.4]: https://github.com/bmjcoding/agent-toolkit/compare/skill/retro-v4.2.3...skill/retro-v4.2.4
[4.2.3]: https://github.com/bmjcoding/agent-toolkit/compare/skill/retro-v4.2.2...skill/retro-v4.2.3
[4.2.2]: https://github.com/bmjcoding/agent-toolkit/compare/skill/retro-v4.2.1...skill/retro-v4.2.2
[4.2.1]: https://github.com/bmjcoding/agent-toolkit/compare/skill/retro-v4.2.0...skill/retro-v4.2.1
[4.2.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/retro-v4.1.0...skill/retro-v4.2.0
[4.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/retro-v4.0.1...skill/retro-v4.1.0
[4.0.1]: https://github.com/bmjcoding/agent-toolkit/compare/skill/retro-v4.0.0...skill/retro-v4.0.1
[4.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/retro-v3.0.0...skill/retro-v4.0.0
[3.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/retro-v2.0.0...skill/retro-v3.0.0
[2.0.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/retro-v1.1.0...skill/retro-v2.0.0
[1.1.0]: https://github.com/bmjcoding/agent-toolkit/compare/skill/retro-v1.0.0...skill/retro-v1.1.0
[1.0.0]: https://github.com/bmjcoding/agent-toolkit/tree/skill/retro-v1.0.0
