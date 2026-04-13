---
name: improve
description: >
  Apply retro recommendations with automated verification. Use after /retro
  or anytime you want to improve a skill/agent. Supports --validate for
  autonomous improve-then-review validation cycles.
disable-model-invocation: true
model: sonnet
argument-hint: "[retro-output or recommendation] [--validate] [--skip-validation]"
metadata:
  version: 1.2.0
---

# Improve

Apply changes to skill/agent definitions, verify each one, accept or revert. Each change gets fixed-budget verification (max 3 checks, eval capped at 2 min) and a binary accept/reject gate — no partial acceptance, no retrying failed changes.

## Workflow

### 1. Parse Recommendations

Locate the retro's recommendations table from one of these sources (in priority order):
1. **`$ARGUMENTS`** — if a file path is passed, read it
2. **Current conversation** — search backward for section "3.7 Recommendations" or a table with columns What/Where/Why/Priority/Type. Extract the table rows.
3. **Most recent retro on disk** — list `~/.claude/retros/*/` directories, find the newest `.md` file by timestamp in the filename, read its section 3.7. This handles context compaction and fresh-session invocation.
4. If none of the above produce recommendations, ask the user to provide the retro output or run `/retro` first.

Each recommendation has:
- **What**: the change
- **Where**: target file path
- **Why**: the problem it prevents
- **Priority**: P0 / P1 / P2
- **Type**: `fix` (edit a file) or `pattern` (save to memory)

Sort by priority. Process P0 first.

**Short-circuit**: If there are 0 `fix` recommendations (only `pattern` types), skip the apply-verify loop — go directly to step 3 (Save Patterns to Memory) and step 5 (Model Change Recommendations). If `--validate` is present, inform the user: "`--validate` has no effect — all recommendations are patterns. No definition files will be modified, so there is nothing to validate." Then proceed without the validation loop.

**Rewrite threshold**: If 5+ findings target the same skill or agent definition, run an inline review-skill check first (linter + semantic review). If the verdict is **REWRITE**, stop and recommend the user run `/review-skill` on it. Do not attempt to patch a fundamentally broken definition. If the verdict is **NEEDS WORK** or **PASS**, apply the findings normally.
  - *P0 carve-out*: If a REWRITE verdict is returned but any of the findings is P0, apply that P0 finding only, then surface the recommendation to run `/review-skill` for the remaining findings. A P0 blocker must not be left unresolved. After applying the P0 fix, still run step 5 (final quality gate) on the modified file before reporting.

### 2. Apply-Verify Loop

For each `fix` recommendation, in priority order:

**Progressive disclosure**: Apply at most 3 recommendations per batch before pausing to report intermediate results and ask the user whether to continue. This prevents a long error cascade from a bad early change and keeps the user informed on large retros. Batch boundaries: after every 3rd accepted or reverted change, print a mini-table of results so far and prompt "Continue with next batch? (yes/no/stop)". If `--skip-validation` is passed, skip this pause and apply all changes in one pass.

#### a. Read the target file
Understand the current content. Identify the exact location for the change.

#### b. Apply the change
Before editing, record the file's current line count by counting the lines in the Read output from step (a), or by running `wc -l < FILE` — either is acceptable for line counting (CLAUDE.md's preference for dedicated tools applies to reading file content, not counting lines). Make the edit. Keep changes minimal and targeted — don't refactor surrounding code. After editing, record the new line count and compute the delta (lines added/removed).

#### c. Verify (fixed budget — max 3 checks)

**Pre-apply Q-regression baseline**: Before editing the file, record which Q-codes the linter currently emits. This is the pre-edit baseline used to detect new regressions after the change.

**Structural validation** (always run):
```bash
# Try personal skills, then project skills, then skip with warning
LINTER=$(find ~/.claude/skills/review-skill/scripts -name "lint-definition.py" 2>/dev/null | head -1)
[ -z "$LINTER" ] && LINTER=$(find .claude/skills/review-skill/scripts -name "lint-definition.py" 2>/dev/null | head -1)
python3 "${LINTER:-lint-definition.py}" TARGET_FILE --format json
```
If the linter is not found, warn "lint-definition.py not found — skipping structural validation" and proceed without it. Do not fail the change because the linter is missing. Any S-code error = structural failure. Q-code warnings are informational — in particular, Q14 (version not bumped) will fire during improve because the lint runs before the version bump step. This is expected; ignore Q14 during improve.

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

#### e. Version bump (accepted changes only)

After all fixes for a given file are accepted, apply a SemVer bump to `metadata.version` in the frontmatter. Rules, examples, and the tiebreaker (highest applicable bump wins) are in `references/version-bump.md`. If no version exists, initialize at `1.0.0` then apply the computed bump. Record old→new for each file in the report summary table and the outcome JSON.

#### f. Changelog entry (accepted changes only)

After bumping the version, append a changelog entry to the component's own `CHANGELOG.md`:

- **Skills**: `skills/{name}/CHANGELOG.md`
- **Agents**: `agents/{name}/CHANGELOG.md`
- **Commands**: `commands/{name}/CHANGELOG.md`
- **Hooks**: `hooks/{name}/CHANGELOG.md`
- **Rules**: `rules/{name}/CHANGELOG.md`
- **Reference files and scripts inside a component directory** (e.g., `skills/{name}/references/`, `agents/{name}/evals/`): append to that component's `CHANGELOG.md`, not a global one
- **All other files** (e.g., `CLAUDE.md`, memory files, global scripts, docs): append to `~/.claude/CHANGELOG.md`. Create it with a `# Changelog — ~/.claude` header if it doesn't exist.

Every component has its own `CHANGELOG.md` in its subdirectory. There are NO aggregated changelogs — do not write to `agents/CHANGELOG.md` or `commands/CHANGELOG.md` at the category root level.

Changelog format — Keep a Changelog 1.1.0 (see skills/changelog/SKILL.md for full spec):

```
## [VERSION] - YYYY-MM-DD

### Category

- Verb-prefixed one-liner
```

Categories in canonical order: Added, Changed, Deprecated, Removed, Fixed, Security.
Omit empty categories. Dates are required on all released versions.

If the changelog file doesn't exist, create it with a header line.

### 3. Save Patterns to Memory

For each `pattern` recommendation:
1. Check if a similar memory already exists (search memory files)
2. If updating: edit the existing memory file
3. If new: write a memory file to `~/.claude/projects/-Users-bmj--claude/memory/` using this naming convention:
   - `feedback_<topic>.md` — lessons learned, anti-patterns, gotchas
   - `reference_<topic>.md` — reference material, lookup tables, conventions
   - `project_<topic>.md` — project state, active constraints, decisions
   Include proper frontmatter (type: feedback/reference/project, Why: one line, How: one-line application rule)
4. Update `~/.claude/projects/-Users-bmj--claude/memory/MEMORY.md` index

### 4. Report

Present a summary table:

```
| # | Recommendation | File | Action | Diff | Version | Verification |
|---|---|---|---|---|---|---|
| 1 | Add zod validation convention to CLAUDE.md | CLAUDE.md | accepted | +3 lines | — | structural: pass |
| 2 | Require exact types in contracts | agents/planner.md | accepted | +5 -1 lines | 1.2.0→1.2.1 | structural: pass, semantic: pass |
| 3 | Add auth-check context to quality-engineer | agents/quality-engineer.md | reverted | +8 lines (reverted) | — | eval: fail (broke existing test) |
| 4 | Save routing heuristic | memory/feedback_dispatch.md | saved | — | — | — |
```

End with:
- Count of accepted / reverted / saved / deferred
- Files modified (for the user to review before committing)
- Reverted items that need manual attention
- Model change recommendations (presented separately — see below)

### 5. Final Quality Gate

After all changes are applied, versioned, and changelogged, run a final lint pass on every modified file:

```bash
LINTER=$(find ~/.claude/skills/review-skill/scripts -name "lint-definition.py" 2>/dev/null | head -1)
[ -z "$LINTER" ] && LINTER=$(find .claude/skills/review-skill/scripts -name "lint-definition.py" 2>/dev/null | head -1)
for FILE in <list of modified files>; do
  python3 "${LINTER}" "$FILE" --format json
done
```

This is a post-improvement sweep — not a per-change check. It catches regressions that individual changes didn't trigger (e.g., cumulative line count exceeding 500, or a new cross-reference that broke from a different change).

- **S-code errors**: Stop. A change introduced structural damage. Revert the last change that touched the failing file and note it as `reverted: post-gate structural failure`.
- **Q-code warnings (new ones only)**: Note in the report but do not revert. The user decides on warnings.
- **No new issues**: Proceed to save.

If the linter is not found, skip with warning (same as per-change check).

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

Write a JSON file to `~/.claude/retros/{subject}/YYYY-MM-DDTHHMMSS-improve.json` with:

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
  "total_lines_added": 16,
  "total_lines_removed": 3,
  "changes": [
    {"file": "agents/planner.md", "action": "accepted", "lines_added": 5, "lines_removed": 1, "version_before": "1.2.0", "version_after": "1.2.1"},
    {"file": "CLAUDE.md", "action": "accepted", "lines_added": 3, "lines_removed": 0},
    {"file": "agents/quality-engineer.md", "action": "reverted", "reason": "eval fail"}
  ],
  "recommendations_applied": ["#1 description", "#2 description"],
  "recommendations_reverted": ["#3 description — reason"]
}
```

Append to trend history:
```bash
# Try personal skills, then project skills
HISTORY_SCRIPT=$(find ~/.claude/skills/retro/scripts -name "retro-history.py" 2>/dev/null | head -1)
[ -z "$HISTORY_SCRIPT" ] && HISTORY_SCRIPT=$(find .claude/skills/retro/scripts -name "retro-history.py" 2>/dev/null | head -1)
python3 "${HISTORY_SCRIPT:-retro-history.py}" save ~/.claude/retros/{subject}/YYYY-MM-DDTHHMMSS-improve.json --history ~/.claude/retros
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

## Gotchas

- **Don't chain dependent changes.** If recommendation B depends on A's change, and A is reverted, skip B and flag the dependency.
- **Don't rewrite, patch.** The smallest edit that addresses the finding is the right edit. Rewriting a section to "improve clarity" while fixing a bug conflates two changes and makes revert harder.
- **Respect protected files.** Do not modify lockfiles, CI configs, migration files, or auth modules (per CLAUDE.md auto-fix safety rules). Report these as `skipped: protected file` in the summary.
- **Memory deduplication matters.** Before writing a new memory file, grep existing memories for the key concept. Duplicate memories cause contradictory guidance in future sessions.
- **Validation loop is post-improve only.** The `--validate` loop runs AFTER the main improve workflow finishes — it does not replace the per-change verification in step 2c. The per-change checks catch individual regressions; the validation loop catches definition-level quality gaps.
- **No double version bumps.** Validation iterations must NOT call step 2e (version bump). The initial pass owns versioning. If you're in iteration N>0 of the validation loop, skip version bump. For changelog: append a sub-entry under the existing version header, not a new header.
- **Single outcome file.** The validation loop updates the existing outcome JSON from step 7 — it does not create additional outcome files. One improve run = one outcome file, regardless of validation iterations.
- **Bad retro file path is not a fallback trigger.** If `$ARGUMENTS` contains a retro file path that doesn't exist, do not silently fall back to conversation history — report the bad path and stop. Fallbacks (conversation, disk) are for missing arguments, not bad arguments.
- **`--validate` blocks on user input.** Orchestrators and full-cycle agents should pass `--max-iterations N` in `$ARGUMENTS` rather than relying on the interactive prompt, to avoid blocking mid-execution.
- **`--skip-validation` disables progressive disclosure pauses.** When `--skip-validation` is passed, the batch-pause after every 3rd change is suppressed and all changes apply in a single uninterrupted pass. Use for non-interactive orchestrator contexts.

$ARGUMENTS
