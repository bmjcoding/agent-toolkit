---
name: improve
description: >
  Apply retro recommendations with automated verification. Use after `retro`
  or anytime you want to improve a skill/agent. Supports --validate for
  autonomous improve-then-review validation cycles.
disable-model-invocation: true
argument-hint: "remove [rec-id] | [retro-output or recommendation] [--validate] [--skip-validation]"
---

# Improve

Apply changes to skill/agent definitions, verify each one, accept or revert. Each change gets fixed-budget verification (max 3 checks, eval capped at 2 min) and a binary accept/reject gate — no partial acceptance, no retrying failed changes.

Resolve `STATE_ROOT` once at the start of the run. Prefer, in order: `.agents/`,
`.claude/`, `.codex/`, `~/.agents/`, `~/.claude/`, `~/.codex/`. Use the first existing
directory. If none exist and the workflow needs persistent local state, create `.agents/`
in the current project and use that as `STATE_ROOT`.

Resolve `RETRO_ROOT` once at the start of the run for retro reads and writes:
- `RETRO_ROOT="${AGENT_RETRO_DIR:-$HOME/agent-retros}"`
- Search `RETRO_ROOT` first for canonical typed paths
- Treat legacy retro roots, resolved `STATE_ROOT` retro dirs, and flat subject directories as compatibility read locations only
- Do not invent a project-local retro write root without an explicit override

## Workflow

### 1. Parse Recommendations

Locate the retro's recommendations table from one of these sources (in priority order):
1. **`$ARGUMENTS`** — if a file path is passed, read it
2. **Current conversation** — search backward for section "3.7 Recommendations" or a table with columns What/Where/Why/Priority/Type. Extract the table rows.
3. **Most recent retro on disk** — recursively scan `~/agent-retros/` (or `$AGENT_RETRO_DIR`) for retro markdown files, find the newest `.md` file by timestamp in the filename, and read its section 3.7. If no canonical retro exists, fall back to legacy retro roots and resolved `STATE_ROOT` retro dirs, including flat subject directories. This handles context compaction and fresh-session invocation across the type-scoped retro directory layout.
4. If none of the above produce recommendations, ask the user to provide the retro output or run `retro` first.

Each recommendation has:
- **What**: the change
- **Where**: target file path
- **Why**: the problem it prevents
- **Priority**: P0 / P1 / P2
- **Type**: `fix` (edit a file) or `pattern` (save to memory)

Sort by priority. Process P0 first.

**Short-circuit**: If there are 0 `fix` recommendations (only `pattern` types), skip the apply-verify loop — go directly to step 3 (Save Patterns to Memory) and step 5 (Model Change Recommendations). If `--validate` is present, inform the user: "`--validate` has no effect — all recommendations are patterns. No definition files will be modified, so there is nothing to validate." Then proceed without the validation loop.

**Rewrite threshold**: If 5+ findings target the same skill or agent definition, run an inline review-skill check first (linter + semantic review). If the verdict is **REWRITE**, stop and recommend the user run `review-skill` on it. Do not attempt to patch a fundamentally broken definition. If the verdict is **NEEDS WORK** or **PASS**, apply the findings normally.
  - *P0 carve-out*: If a REWRITE verdict is returned but any of the findings is P0, apply that P0 finding only, then surface the recommendation to run `review-skill` for the remaining findings. A P0 blocker must not be left unresolved. After applying the P0 fix, still run step 5 (final quality gate) on the modified file before reporting.

### 2. Apply-Verify Loop

For each `fix` recommendation, in priority order:

**Progressive disclosure**: Apply at most 3 recommendations per batch before pausing to report intermediate results and ask the user whether to continue. This prevents a long error cascade from a bad early change and keeps the user informed on large retros. Batch boundaries: after every 3rd accepted or reverted change, print a mini-table of results so far and prompt "Continue with next batch? (yes/no/stop)". If `--skip-validation` is passed, skip this pause and apply all changes in one pass.

#### a. Read the target file
Understand the current content. Identify the exact location for the change.

#### b. Apply the change
Before editing, record the file's current line count by counting the lines in the Read output from step (a), or by running `wc -l < FILE` — either is acceptable for line counting (the active project instructions' preference for dedicated tools applies to reading file content, not counting lines). Make the edit. Keep changes minimal and targeted — don't refactor surrounding code. After editing, record the new line count and compute the delta (lines added/removed).

#### c. Verify (fixed budget — max 3 checks)

**Pre-apply Q-regression baseline**: Before editing the file, record which Q-codes the linter currently emits. This is the pre-edit baseline used to detect new regressions after the change.

**Structural validation** (always run):
```bash
# Try repo skills, then project-local installs, then user-global installs
LINTER=$(find skills/review-skill/scripts -name "lint-definition.py" 2>/dev/null | head -1)
[ -z "$LINTER" ] && LINTER=$(find .agents/skills/review-skill/scripts -name "lint-definition.py" 2>/dev/null | head -1)
[ -z "$LINTER" ] && LINTER=$(find .claude/skills/review-skill/scripts -name "lint-definition.py" 2>/dev/null | head -1)
[ -z "$LINTER" ] && LINTER=$(find .codex/skills/review-skill/scripts -name "lint-definition.py" 2>/dev/null | head -1)
[ -z "$LINTER" ] && LINTER=$(find ~/.agents/skills/review-skill/scripts -name "lint-definition.py" 2>/dev/null | head -1)
[ -z "$LINTER" ] && LINTER=$(find ~/.claude/skills/review-skill/scripts -name "lint-definition.py" 2>/dev/null | head -1)
[ -z "$LINTER" ] && LINTER=$(find ~/.codex/skills/review-skill/scripts -name "lint-definition.py" 2>/dev/null | head -1)
python3 "${LINTER:-lint-definition.py}" TARGET_FILE --format json
```
If the linter is not found, warn "lint-definition.py not found — skipping structural validation" and proceed without it. Do not fail the change because the linter is missing. Any S-code error = structural failure. Q-code warnings are informational unless they are new regressions introduced by the edit.

**Q-warning regression check** (always run alongside structural):
Compare Q-warnings before and after the change. If the change introduced a NEW Q-warning that wasn't present before the edit, treat it as a quality regression:
- Record the pre-edit Q-warning set during step 2a (when reading the file — note which Q-codes the linter emits before your edit)
- After applying the change, check for new Q-warnings not in the pre-edit set
- New Q-warnings = revert (same as structural failure)
This prevents progressive quality degradation across improve cycles.

**Eval smoke test** (if test cases exist):
If `evals/evals.json` exists in the skill directory, pick ONE test case using the first-match-wins keyword heuristic in `references/eval-matching.md`. Run only the matched case — not the full suite. Cap at 2 minutes. The reference also documents the `eval: not applicable` branch (when the finding modifies the matched rule itself) and the `eval: stale` branch (when the eval fixture references files that no longer exist).

**Semantic spot-check** (for agent definitions):
If the change modifies an agent prompt, verify the new instruction doesn't contradict other instructions in the same file. Search for conflicting directives (e.g., "always do X" in one section and "never do X" in another).

#### d. Accept or revert

| Structural | Q-regression | Eval (if run) | Semantic | Decision |
|---|---|---|---|---|
| pass | none | pass or N/A | pass | **Accept** |
| pass | new Q-warning | any | any | **Revert** — quality regression |
| pass | none | fail | pass | **Revert** — the change broke existing behavior |
| fail | any | any | any | **Revert** — structural damage |
| pass | none | pass or N/A | fail | **Revert** — contradictory instructions |

If reverted: restore the file to its pre-change state, note the recommendation as `reverted` with the reason, and move to the next recommendation. Do NOT retry with a different approach — flag it for manual review.

#### e. Version ownership (accepted changes only)

Do **not** edit inline version markers or frontmatter version fields in definition files.
Released versions are tracked in the component's `CHANGELOG.md`, and version promotion
only happens through the changelog/release flow. If a file still contains a legacy inline
version marker, remove it as part of the accepted change rather than updating it.

#### f. Changelog entry (accepted changes only)

After applying the accepted change, append a single bullet to the component's own
`CHANGELOG.md` under `## [Unreleased]`. Do NOT write a versioned `## [X.Y.Z] - YYYY-MM-DD`
header here — version promotion happens at release time via the `changelog` skill.

Determine the target CHANGELOG.md path using the routing rules table:

- **Skills**: `skills/{name}/CHANGELOG.md`
- **Agents**: `agents/{name}/CHANGELOG.md`
- **Workflows**: `workflows/{name}/CHANGELOG.md`
- **Hooks**: `hooks/{name}/CHANGELOG.md`
- **Rules**: `rules/{name}/CHANGELOG.md`
- **Reference files and scripts inside a component directory** (e.g., `skills/{name}/references/`, `agents/{name}/evals/`): append to that component's `CHANGELOG.md`, not a global one
- **All other files** (e.g., `AGENTS.md`, compatibility shims, memory files, global scripts, docs): append to `STATE_ROOT/CHANGELOG.md`. Create it with a `# Changelog` header if it doesn't exist.

Every component has its own `CHANGELOG.md` in its subdirectory. There are NO aggregated changelogs — do not write to `agents/CHANGELOG.md` or `workflows/CHANGELOG.md` at the category root level.

Write the entry as follows:
1. Find or create the `## [Unreleased]` section (it must appear before any versioned section).
2. Under `## [Unreleased]`, find or create the appropriate category header (`### Added`, `### Changed`, `### Fixed`, etc. — choose based on the change type; canonical order per `skills/changelog/SKILL.md`).
3. Append a verb-prefixed one-liner bullet (`- `) under that category header.

For entry content format and category rules, see `skills/changelog/SKILL.md` as the authoritative spec (Keep a Changelog 1.1.0).

If the changelog file doesn't exist, create it with the required header block from `skills/changelog/SKILL.md`, then add `## [Unreleased]` and the entry.

#### g. Record rule in expiry metadata (accepted `fix` recommendations only)

After the changelog entry, record the applied rule in `STATE_ROOT/metadata/rule-expiry.json` so future `improve` runs can surface expired rules.

1. Read `STATE_ROOT/metadata/rule-expiry.json` (create with `{"version":"1.0.0","rules":{}}` if it doesn't exist).
2. Derive `rec-id` from the recommendation row: if the retro table provides one, use it; otherwise synthesize `<SLUG>-<YYYYMMDD-HHMMSS>` from the recommendation slug + current timestamp.
3. Append an entry under `rules`:
   - `rec_id`: `<rec-id>`
   - `target_file`: the path from the recommendation's "Where" column
   - `anchor`: a short phrase (under 80 chars) that uniquely locates the rule in the target file
   - `added`: today's date (YYYY-MM-DD)
   - `source_session`: active SID, or `"manual"` if no active pipeline
   - `review_by`: today + 90 days (YYYY-MM-DD)
   - `last_reviewed`: `null`
   - `status`: `"active"`
   - `notes`: short free-text context (under 200 chars)
4. Write the updated JSON atomically (write to `.tmp`, then `mv`).

Skip this step if the target file is a memory/pattern file (under `STATE_ROOT/projects/*/memory/` or `references/`) — rule-expiry tracking applies to executable rules in skills/agents, not to reference material.

### 3. Save Patterns to Memory

For each `pattern` recommendation:
1. Check if a similar memory already exists (search memory files)
2. If updating: edit the existing memory file
3. If new: write a memory file to `STATE_ROOT/projects/<project-slug>/memory/` using this naming convention:
   - `feedback_<topic>.md` — lessons learned, anti-patterns, gotchas
   - `reference_<topic>.md` — reference material, lookup tables, conventions
   - `project_<topic>.md` — project state, active constraints, decisions
   Include proper frontmatter (type: feedback/reference/project, Why: one line, How: one-line application rule)
4. Update `STATE_ROOT/projects/<project-slug>/memory/MEMORY.md` index

### 4. Report

Present a summary table:

```
| # | Recommendation | File | Action | Diff | Verification |
|---|---|---|---|---|---|
| 1 | Add zod validation convention to AGENTS.md | AGENTS.md | accepted | +3 lines | structural: pass |
| 2 | Require exact types in contracts | agents/planner/AGENT.md | accepted | +5 -1 lines | structural: pass, semantic: pass |
| 3 | Add auth-check context to quality-engineer | agents/quality-engineer/AGENT.md | reverted | +8 lines (reverted) | eval: fail (broke existing test) |
| 4 | Save routing heuristic | memory/feedback_dispatch.md | saved | — | — |
```

End with:
- Count of accepted / reverted / saved / deferred
- Files modified (for the user to review before committing)
- Reverted items that need manual attention
- Model change recommendations (presented separately — see below)

### 5. Final Quality Gate

After all changes are applied and changelogged, run a final lint pass on every modified file:

```bash
LINTER=$(find skills/review-skill/scripts -name "lint-definition.py" 2>/dev/null | head -1)
[ -z "$LINTER" ] && LINTER=$(find .agents/skills/review-skill/scripts -name "lint-definition.py" 2>/dev/null | head -1)
[ -z "$LINTER" ] && LINTER=$(find .claude/skills/review-skill/scripts -name "lint-definition.py" 2>/dev/null | head -1)
[ -z "$LINTER" ] && LINTER=$(find .codex/skills/review-skill/scripts -name "lint-definition.py" 2>/dev/null | head -1)
[ -z "$LINTER" ] && LINTER=$(find ~/.agents/skills/review-skill/scripts -name "lint-definition.py" 2>/dev/null | head -1)
[ -z "$LINTER" ] && LINTER=$(find ~/.claude/skills/review-skill/scripts -name "lint-definition.py" 2>/dev/null | head -1)
[ -z "$LINTER" ] && LINTER=$(find ~/.codex/skills/review-skill/scripts -name "lint-definition.py" 2>/dev/null | head -1)
for FILE in <list of modified files>; do
  python3 "${LINTER}" "$FILE" --format json
done
```

This is a post-improvement sweep — not a per-change check. It catches regressions that individual changes didn't trigger (e.g., cumulative line count exceeding 500, or a new cross-reference that broke from a different change).

- **S-code errors**: Stop. A change introduced structural damage. Revert the last change that touched the failing file and note it as `reverted: post-gate structural failure`. Also open `STATE_ROOT/metadata/rule-expiry.json` and update the matching rule entry: set `status = "reverted"` and `last_reviewed = <today>`. If no matching entry exists (because step 2g was skipped for a pattern/memory file), skip this rollback silently.
- **Q-code warnings (new ones only)**: Note in the report but do not revert. The user decides on warnings.
- **No new issues**: Proceed to save.

If the linter is not found, skip with warning (same as per-change check).

**Rule-expiry pruning pass**:

Read `STATE_ROOT/metadata/rule-expiry.json`. Surface entries where `status == "active"` AND `review_by < today` as:

> N rules past review_by date — run `improve remove <rec-id>` to evaluate each.

Emit a one-row-per-entry table with `rec-id`, `target_file`, and `anchor`. Do NOT auto-remove; this is a surfacer.

If `STATE_ROOT/metadata/rule-expiry.json` does not exist, or `rules` is empty, skip silently.

### 6. Model Change Recommendations

Model changes (downgrade or upgrade) are **never auto-applied**. They affect quality/cost tradeoffs that only the user can judge.

Present them in a separate section after the main summary:

```
## Model Recommendations (requires your decision)

| Agent / Skill | Current | Suggested | Rationale | Est. Savings |
|---|---|---|---|---|
| exploration agents | opus (inherit) | sonnet | 0 errors, mechanical glob/grep only | ~5x on 45K tokens |
| integration-verifier | opus (inherit) | haiku | structural checks only, no reasoning | ~10x on 22K tokens |
```

Do not modify any `model` field in agent/skill definitions. The user applies these manually or tells you to proceed.

### 7. Save Improvement Outcome

After reporting, save the improvement outcome to the retro history so trends can correlate diagnosis with treatment.

Derive the subject value using this rule:
- From a retro file: read the `subject` field from the retro's summary JSON, or parse the `# Retro: {subject} — {date}` header line of the retro markdown
- From conversation (parsing source 2): search backward for the retro header `# Retro: {subject} — {date}` and extract `{subject}`
- If no header is found in conversation: default to `claude`

Derive the retro directory (`<retro-dir>`) using this rule:
- If `$ARGUMENTS` provided a retro file path, use that file's parent directory
- If recommendations came from the most recent retro on disk, use that retro file's parent directory
- If recommendations came from conversation only, try to locate the matching retro on disk by subject/date and use its parent directory
- If the resolved retro file lives under a legacy root and a canonical equivalent exists under `RETRO_ROOT`, normalize to the canonical directory before writing the outcome
- If no real retro file can be resolved to a canonical write directory, stop and ask the user for the retro output or a retro file path instead of inventing a save location

Write a JSON file next to the source retro in the same directory, using the filename `YYYYMMDDTHHMMSS-improve.json`, with:

Include `model_recommendations` as an array of objects `{"agent": "name", "current": "model", "suggested": "model", "rationale": "why"}` for any agents where a model downgrade or upgrade is recommended based on observed performance. Use an empty array `[]` if no model changes are recommended — do not omit the field.

`recommendations_applied` (array of strings: description of each accepted recommendation) and `recommendations_reverted` (array of strings: description + reason for each reverted recommendation) are required top-level fields. Use empty arrays when none apply.

`file_diffs` (array of objects, required): unified diff per modified file. Each object has `file` (string path), `unified_diff_truncated` (string, diff content only, max 200 lines — no trailing sentinel inside the string), and `truncated` (boolean, `true` if the diff was cut at the 200-line limit, `false` otherwise). Collect with `git diff HEAD <file>` after edits are staged. Use an empty array `[]` if no files were modified (pattern-only improve run).

```json
{
  "type": "improve",
  "retro_timestamp": "timestamp of the retro this improves",
  "subject": "subject from the retro",
  "accepted": 3,
  "reverted": 1,
  "saved_patterns": 1,
  "skipped": 0,
  "deferred_model_changes": 2,
  "model_recommendations": [
    {"agent": "name", "current": "model", "suggested": "model", "rationale": "why"}
  ],
  "total_lines_added": 16,
  "total_lines_removed": 3,
  "changes": [
    {"file": "agents/planner/AGENT.md", "action": "accepted", "lines_added": 5, "lines_removed": 1},
    {"file": "AGENTS.md", "action": "accepted", "lines_added": 3, "lines_removed": 0},
    {"file": "agents/quality-engineer/AGENT.md", "action": "reverted", "reason": "eval fail"}
  ],
  "recommendations_applied": ["#1 description", "#2 description"],
  "recommendations_reverted": ["#3 description — reason"],
  "file_diffs": [
    {
      "file": "agents/planner/AGENT.md",
      "unified_diff_truncated": "@@ -14,6 +14,7 @@\n context\n+## New rule\n",
      "truncated": false
    }
  ]
}
```

Append to trend history:
```bash
# Try personal skills, then project skills
HISTORY_SCRIPT=$(find skills/retro/scripts -name "retro-history.py" 2>/dev/null | head -1)
[ -z "$HISTORY_SCRIPT" ] && HISTORY_SCRIPT=$(find .agents/skills/retro/scripts -name "retro-history.py" 2>/dev/null | head -1)
[ -z "$HISTORY_SCRIPT" ] && HISTORY_SCRIPT=$(find .claude/skills/retro/scripts -name "retro-history.py" 2>/dev/null | head -1)
[ -z "$HISTORY_SCRIPT" ] && HISTORY_SCRIPT=$(find .codex/skills/retro/scripts -name "retro-history.py" 2>/dev/null | head -1)
[ -z "$HISTORY_SCRIPT" ] && HISTORY_SCRIPT=$(find ~/.agents/skills/retro/scripts -name "retro-history.py" 2>/dev/null | head -1)
[ -z "$HISTORY_SCRIPT" ] && HISTORY_SCRIPT=$(find ~/.claude/skills/retro/scripts -name "retro-history.py" 2>/dev/null | head -1)
[ -z "$HISTORY_SCRIPT" ] && HISTORY_SCRIPT=$(find ~/.codex/skills/retro/scripts -name "retro-history.py" 2>/dev/null | head -1)
python3 "${HISTORY_SCRIPT:-retro-history.py}" save <retro-dir>/YYYYMMDDTHHMMSS-improve.json --history "${AGENT_RETRO_DIR:-$HOME/agent-retros}"
```
If the script is not found, warn "retro-history.py not found — outcome not saved to trend history" but do not fail the improve run.

This lets future retros answer: "Were the last retro's recommendations applied? Did they help?"

### 8. Validation Loop (`--validate` flag only)

> Load `references/validation-loop.md` for the full validation workflow. Key points:

- **Skip heuristic**: Skip when all changes are additive (lines_removed=0) AND target Gotchas/references only
- **Purpose**: Post-review-skill remediation (NEEDS WORK → fix → confirm), not routine retro-improve
- **Max iterations**: Ask user or accept --max-iterations N from $ARGUMENTS
- **No double version bumps**: Validation iterations append sub-entries, don't create new versions
- **Convergence**: Exit when all files PASS or no progress after an iteration

### 9. Remove Subcommand (`improve remove <rec-id>`)

When `improve` is invoked with `remove <rec-id>` instead of a retro source:

1. **Confirmation gate** — print:
   > Remove rule `<rec-id>`? This deletes the rule text from its host file AND marks it `removed` in `STATE_ROOT/metadata/rule-expiry.json`. Type `yes` to proceed. Anything else aborts.
   Wait for a one-word response. Only proceed on exact `yes` (case-insensitive). Any other response → `Aborted. No changes made.`
2. **Read** `STATE_ROOT/metadata/rule-expiry.json`. Locate the entry for `<rec-id>`. If missing → abort: `No entry for <rec-id> in rule-expiry.json.`
3. **Delete the rule text** from `target_file` using `anchor` as the locator. If the anchor doesn't match → abort: `Anchor not found in <target_file> — rule may already have been deleted or the file has diverged. Manual review required.`
4. **Update** the entry in `rule-expiry.json`: set `status = "removed"`, set `last_reviewed = <today>`. Write atomically.
5. **Append changelog entry** to the host file's `CHANGELOG.md` under `### Removed`:
   - `- Removed rule "<anchor>" (<rec-id>) per improve remove.`
6. **Report** the action: host file path, removed rule's anchor, link to changelog entry.

This subcommand is disjoint from `improve`'s main retro-application flow. It does not parse recommendations and does not run the apply-verify loop.

## Gotchas

- **Don't chain dependent changes.** If recommendation B depends on A's change, and A is reverted, skip B and flag the dependency.
- **Don't rewrite, patch.** The smallest edit that addresses the finding is the right edit. Rewriting a section to "improve clarity" while fixing a bug conflates two changes and makes revert harder.
- **Respect protected files.** Do not modify lockfiles, CI configs, migration files, or auth modules (per `AGENTS.md` auto-fix safety rules). Report these as `skipped: protected file` in the summary.
- **Memory deduplication matters.** Before writing a new memory file, grep existing memories for the key concept. Duplicate memories cause contradictory guidance in future sessions.
- **Validation loop is post-improve only.** The `--validate` loop runs AFTER the main improve workflow finishes — it does not replace the per-change verification in step 2c. The per-change checks catch individual regressions; the validation loop catches definition-level quality gaps.
- **No inline versioning.** Improve never edits inline definition versions. Validation iterations also avoid version headers; keep recording follow-up work under `## [Unreleased]`.
- **Single outcome file.** The validation loop updates the existing outcome JSON from step 7 — it does not create additional outcome files. One improve run = one outcome file, regardless of validation iterations.
- **Bad retro file path is not a fallback trigger.** If `$ARGUMENTS` contains a retro file path that doesn't exist, do not silently fall back to conversation history — report the bad path and stop. Fallbacks (conversation, disk) are for missing arguments, not bad arguments.
- **`--validate` blocks on user input.** Orchestrators and full-cycle agents should pass `--max-iterations N` in `$ARGUMENTS` rather than relying on the interactive prompt, to avoid blocking mid-execution.
- **`--skip-validation` disables progressive disclosure pauses.** When `--skip-validation` is passed, the batch-pause after every 3rd change is suppressed and all changes apply in a single uninterrupted pass. Use for non-interactive orchestrator contexts.

$ARGUMENTS
