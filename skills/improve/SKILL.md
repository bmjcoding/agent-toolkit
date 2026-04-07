---
name: improve
description: >
  Apply retro recommendations to skill and agent definitions with automated verification.
  Use after /retro to close the improvement loop — or anytime the user wants to improve
  a skill, agent, or workflow based on observed failures.
disable-model-invocation: true
argument-hint: "[retro-output or recommendation]"
metadata:
  version: 1.0.0
---

# Improve

Apply changes to skill/agent definitions, verify each one, accept or revert. Each change gets fixed-budget verification (max 3 checks, eval capped at 2 min) and a binary accept/reject gate — no partial acceptance, no retrying failed changes.

Core loop adapted from Andrej Karpathy's [AutoResearch](https://github.com/karpathy/autoresearch) (fixed-budget experiments, binary accept/reject, human guidance with autonomous execution).

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

**Short-circuit**: If there are 0 `fix` recommendations (only `pattern` types), skip the apply-verify loop — go directly to step 3 (Save Patterns to Memory) and step 5 (Model Change Recommendations).

**Rewrite threshold**: If 5+ findings target the same skill or agent definition, stop. The definition likely needs a rewrite, not patches. Recommend the user run `/review-skill` on it to get a structured assessment and rewrite outline. Do not attempt to patch a fundamentally broken definition.

### 2. Apply-Verify Loop

For each `fix` recommendation, in priority order:

#### a. Read the target file
Understand the current content. Identify the exact location for the change.

#### b. Apply the change
Before editing, record the file's current line count: `wc -l TARGET_FILE`. Make the edit. Keep changes minimal and targeted — don't refactor surrounding code. After editing, record the new line count and compute the delta (lines added/removed).

#### c. Verify (fixed budget — max 3 checks)

**Structural validation** (always run):
```bash
# Try personal skills, then project skills, then skip with warning
LINTER=$(find ~/.claude/skills/review-skill/scripts -name "lint-definition.py" 2>/dev/null | head -1)
[ -z "$LINTER" ] && LINTER=$(find .claude/skills/review-skill/scripts -name "lint-definition.py" 2>/dev/null | head -1)
python3 "${LINTER:-lint-definition.py}" TARGET_FILE --format json
```
If the linter is not found, warn "lint-definition.py not found — skipping structural validation" and proceed without it. Do not fail the change because the linter is missing. Any S-code error = structural failure. Q-code warnings are informational — in particular, Q14 (version not bumped) will fire during improve because the lint runs before the version bump step. This is expected; ignore Q14 during improve.

**Eval smoke test** (if test cases exist):
Look for `evals/evals.json` in the skill directory. If found, pick ONE test case — the one most relevant to the finding being fixed. Run it with the skill and check if assertions pass. Do NOT run the full eval suite — this is a smoke test, not a regression suite. Cap at 2 minutes.

**Semantic spot-check** (for agent definitions):
If the change modifies an agent prompt, verify the new instruction doesn't contradict other instructions in the same file. Search for conflicting directives (e.g., "always do X" in one section and "never do X" in another).

#### d. Accept or revert

| Structural | Eval (if run) | Semantic | Decision |
|---|---|---|---|
| pass | pass or N/A | pass | **Accept** |
| pass | fail | pass | **Revert** — the change broke existing behavior |
| fail | any | any | **Revert** — structural damage |
| pass | pass or N/A | fail | **Revert** — contradictory instructions |

If reverted: restore the file to its pre-change state, note the recommendation as `reverted` with the reason, and move to the next recommendation. Do NOT retry with a different approach — flag it for manual review.

#### e. Version bump (accepted changes only)

After all fixes for a given file are accepted, bump the version in its frontmatter `metadata.version` field. If no version exists, initialize at `1.0.0` then apply the bump.

| Signal | Bump | Examples |
|---|---|---|
| ≤5 lines changed, no new sections or files | **PATCH** | Gotcha added, wording fix, description tweak |
| New section, new reference file, new script, new capability | **MINOR** | Added model selection analysis, new gotchas section |
| Structural rewrite, output format change, handoff schema change | **MAJOR** | Rewrote workflow, changed recommendation table columns |

Record the old and new version for each file in the report and outcome JSON.

#### f. Changelog entry (accepted changes only)

After bumping the version, append a changelog entry for the change:

- **Skills**: append to the skill's `CHANGELOG.md` (e.g., `skills/retro/CHANGELOG.md`)
- **Agents**: append to `agents/CHANGELOG.md` under the agent's section
- **Commands**: append to `commands/CHANGELOG.md` under the command's section

Format:
```
### X.Y.Z — YYYY-MM-DD
- What was changed and why (one line per recommendation applied)
```

If the changelog file doesn't exist, create it with a header line.

### 3. Save Patterns to Memory

For each `pattern` recommendation:
1. Check if a similar memory already exists (search memory files)
2. If updating: edit the existing memory file
3. If new: write a memory file with proper frontmatter (type: feedback or project, with Why and How to apply lines)
4. Update MEMORY.md index

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

### 5. Model Change Recommendations

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

### 6. Save Improvement Outcome

After reporting, save the improvement outcome to the retro history so trends can correlate diagnosis with treatment.

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

## Gotchas

- **Don't chain dependent changes.** If recommendation B depends on A's change, and A is reverted, skip B and flag the dependency.
- **Don't rewrite, patch.** The smallest edit that addresses the finding is the right edit. Rewriting a section to "improve clarity" while fixing a bug conflates two changes and makes revert harder.
- **Respect protected files.** Do not modify lockfiles, CI configs, migration files, or auth modules (per CLAUDE.md auto-fix safety rules). Report these as `skipped: protected file` in the summary.
- **Memory deduplication matters.** Before writing a new memory file, grep existing memories for the key concept. Duplicate memories cause contradictory guidance in future sessions.
- **Eval test cases may be stale.** If the eval file references files or patterns that no longer exist, skip the eval and note it as `eval: stale`. Don't fail the change because of a broken test fixture.

$ARGUMENTS
