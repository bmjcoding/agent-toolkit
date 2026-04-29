---
name: definition-review
description: >
  Review a skill or agent definition for quality and correctness. Use when evaluating
  a contribution before merging, after writing a new skill, or when a skill underperforms.
  Supports batch review of directories with parallel dispatch.
lifecycle: stable
disable-model-invocation: true
---

# Definition Review

Evaluate a skill or agent definition against quality standards. Produces a **PASS**, **NEEDS WORK**, or **REWRITE** verdict with specific findings.

## Inputs

Accepts one target and an optional output flag:

```text
<path to SKILL.md, AGENT.md, or directory> [--format json]
```

- A single `SKILL.md` or `AGENT.md` path runs one review.
- A directory path discovers definition files beneath it and runs batch review.
- `--format json` returns the structured JSON envelope instead of markdown.
- If no target is provided, ask for the definition file or directory instead of
  guessing from the current working directory.

For shell snippets below, set `TARGET` to the input path after removing any flags.

## Workflow

### 0. Batch Detection

If the input target resolves to a directory (not a single file):

1. Discover all definition files in the directory:
   ```bash
   find "$TARGET" \( -name "SKILL.md" -o -name "AGENT.md" \) | sort
   ```
2. If **1 file found** → proceed to step 1 with that file.
3. If **2-3 files found** → process each sequentially through steps 1-3 below. Present individual verdicts and a combined summary table at the end. Use the same `## Batch Review Summary` table format as the 4+ case:

   ```
   ## Batch Review Summary

   | # | File | Verdict | Structural | Quality | Required Changes |
   |---|---|---|---|---|---|
   | 1 | skills/self-improvement/retro/SKILL.md | PASS | 0 errors | 1 warning | 0 |
   | 2 | agents/planner/AGENT.md | NEEDS WORK | 0 errors | 3 warnings | 2 |
   ```
4. If **4+ files found** and you have access to an agent/delegation tool → spawn parallel reviewers, one per file. Each reviewer runs the full review workflow independently. Merge their results into a combined summary:

   ```
   ## Batch Review Summary

   | # | File | Verdict | Structural | Quality | Required Changes |
   |---|---|---|---|---|---|
   | 1 | skills/self-improvement/retro/SKILL.md | PASS | 0 errors | 1 warning | 0 |
   | 2 | agents/planner/AGENT.md | NEEDS WORK | 0 errors | 3 warnings | 2 |
   ```

   If delegation is unavailable, fall back to sequential processing regardless of count.

5. After all reviews complete (parallel or sequential), produce a **Consolidated Required Changes** table that merges all NEEDS WORK findings across files into a single `improve`-compatible table:

   ```
   ## Consolidated Required Changes

   | # | What | Where | Why | Priority | Type |
   |---|---|---|---|---|---|
   | 1 | Add output template | skills/self-improvement/retro/SKILL.md | No example output shown | P1 | fix |
   | 2 | Scope disallowedTools | agents/planner/AGENT.md | Agent can Write but shouldn't | P1 | fix |
   | 3 | Add gotchas section | agents/planner/AGENT.md | No error handling guidance | P2 | fix |
   ```

   This table is directly consumable by `improve` — the user can pass the batch review output as input. PASS and REWRITE files are excluded from this table (PASS needs no changes; REWRITE needs a full rewrite, not patches).

### 1. Run the linter

```bash
LINTER='${CLAUDE_SKILL_DIR}/scripts/lint-definition.py'
[ -f "$LINTER" ] || LINTER=$(find scripts -maxdepth 1 -name "lint-definition.py" 2>/dev/null | head -1)
[ -n "$LINTER" ] || LINTER=$(find skills .agents/skills .claude/skills .codex/skills ~/.agents/skills ~/.claude/skills ~/.codex/skills -path "*/definition-review/scripts/lint-definition.py" 2>/dev/null | head -1)
python3 "${LINTER:-lint-definition.py}" "$TARGET" --format json
```

For a directory, the script finds all `SKILL.md` and `AGENT.md` files recursively. Parse the JSON output — it contains structural errors (must fix) and quality warnings (should fix).

If the linter finds structural errors (S-codes), stop here — the definition doesn't meet minimum bar. Report the errors and verdict: **REWRITE**.

Canonical definitions must declare `lifecycle` in frontmatter. Treat missing or invalid values as structural failures. Valid values are exactly `stable`, `beta`, or `experimental`.

**Q-warning handling**: Q-code warnings from the linter are actionable findings, not informational commentary. Each Q-warning must appear as a row in the Required Changes table (if the verdict is NEEDS WORK) with Priority P1. Do not silently absorb Q-warnings into the Lint Results section without surfacing them as Required Changes — this causes Q-warnings to be invisible to `improve` and allows quality regressions to persist across cycles.

### 2. Semantic review

Read the full definition file. Evaluate each area below. Be direct — "this instruction is vague" not "consider clarifying."

**Description quality:**
- Would this trigger on the right prompts? Mentally test 3 realistic user requests — would the agent load this skill?
- Would this false-trigger on adjacent but different tasks?
- Does it say both *what* and *when*?

**Instruction quality:**
- Are instructions actionable procedures, or just declarations ("ensure quality", "handle errors appropriately")?
- Does every instruction pass the test: "Could an agent follow this without asking a clarifying question?"
- Are there instructions the agent would follow but that produce no value? (wasted context)
- Are there instructions explaining what the agent already knows? (common: explaining what JSON/HTTP/git is)

**Architecture:**
- Is SKILL.md under 500 lines with detailed content in references/?
- Are references loaded conditionally ("read X when Y") or always?
- If scripts exist: do they have --help, structured output, no interactive prompts?
- Is there a clear workflow (numbered steps, decision points) or just a wall of prose?

**For agent definitions specifically:**
- Is `tools` scoped appropriately? (an agent that only reads shouldn't have Write/Edit)
- Is `disallowedTools` set to prevent the agent from doing what it shouldn't?
- Is `maxTurns` set? (unbounded agents are a runaway risk)
- Does the prompt tell the agent what it IS and what it ISN'T? (identity boundaries prevent scope creep)
- Are handoff/output formats specified? (agents without structured output are hard to compose)
- Is `model` specified or inherited? If inherited, is the default model appropriate for the task complexity?

**Completeness:**
- Does the skill have examples or output templates?
- Is there a gotchas/troubleshooting section?
- Does it define portable invocation inputs?
- If it runs scripts, are error cases handled?

### 3. Verdict

Produce one of three verdicts based on the combined findings:

**PASS** — Definition meets quality bar. May have minor suggestions (P2).
Criteria: 0 structural errors, 0 quality errors, actionable instructions, clear workflow.

**NEEDS WORK** — Fixable issues that `improve` can handle. List specific changes.
Criteria: 0 structural errors, but has quality gaps — vague instructions, missing error handling, no output template, description won't trigger correctly.

**REWRITE** — Fundamentally below quality bar. Patching won't fix it.
Criteria: Any of these signals:
- 5 or more quality warnings
- Instructions are entirely declarative ("ensure X", "handle Y") with no procedure
- Description is generic enough to match unrelated tasks or too vague to match anything
- No discernible workflow — just a list of things to "keep in mind"
- The agent already handles the task well without this skill (skill adds no value)
- Contradictory instructions that can't be resolved by patching

## Output

```
## Lint Results

[paste linter output — errors and warnings with codes]

## Semantic Review

### Description: [pass / needs work / rewrite]
[specific findings]

### Instructions: [pass / needs work / rewrite]
[specific findings]

### Architecture: [pass / needs work / rewrite]
[specific findings]

### Completeness: [pass / needs work / rewrite]
[specific findings]

## Verdict: [PASS / NEEDS WORK / REWRITE]

[1-2 sentence summary]

### Required Changes (if NEEDS WORK)
| # | What | Where | Why | Priority | Type |
|---|---|---|---|---|---|
```

For **NEEDS WORK** verdicts, the required changes table uses the same format as `retro` recommendations — directly consumable by `improve`. `Where` is the file path, `Priority` is P0/P1/P2, `Type` is `fix` or `pattern`.

### JSON Output Mode (--format json)

Pass `--format json` in the invocation input to receive machine-readable output instead of the default markdown template. JSON mode produces the same review content in a structured envelope suitable for direct scripting, automation, or downstream tools such as `improve`.

```json
{
  "review_output": {
    "file": "path/to/SKILL.md",
    "lint_errors": [
      { "code": "S01", "message": "Missing required frontmatter field: name", "line": null }
    ],
    "lint_warnings": [
      { "code": "Q04", "message": "Description does not include 'when to use' guidance", "line": null }
    ],
    "structural_errors": 0,
    "quality_warnings": 2,
    "verdict": "NEEDS WORK",
    "verdict_summary": "One-to-two sentence summary of why this verdict was reached.",
    "required_changes": [
      {
        "what": "Add 'when to use' guidance to description",
        "where": "skills/example/SKILL.md",
        "why": "Q04: description lacks trigger context",
        "priority": "P1",
        "type": "fix"
      }
    ]
  }
}
```

**Field definitions:**

- `file` (string): path to the reviewed definition file.
- `lint_errors` (array of objects): S-code findings; each object has `code` (string), `message` (string), `line` (integer or null).
- `lint_warnings` (array of objects): Q-code findings; same shape as `lint_errors`.
- `structural_errors` (integer): count of S-code errors; drives the REWRITE threshold.
- `quality_warnings` (integer): count of Q-code warnings.
- `verdict` (string enum): exactly one of `"PASS"`, `"NEEDS WORK"`, `"REWRITE"`.
- `verdict_summary` (string): 1-2 sentence human-readable explanation of the verdict.
- `required_changes` (array of objects): present when verdict is `"NEEDS WORK"`; omitted or empty array when verdict is `"PASS"` or `"REWRITE"`. Each object has:
  - `what` (string): description of the change to make.
  - `where` (string): file path of the target.
  - `why` (string): reason for the change, referencing the relevant lint code or semantic finding.
  - `priority` (string enum): `"P0"`, `"P1"`, or `"P2"`.
  - `type` (string enum): `"fix"` or `"pattern"`.

Default output (no `--format` flag) produces the markdown template above.

For **REWRITE** verdicts, provide a brief outline of what a good version would look like: what the skill should cover, what structure it should use, and 1-2 concrete instruction examples at the right level of specificity.

## Rewrite Iteration Loop

When the verdict is **REWRITE**, the definition needs a full rewrite followed by iterative review until it passes. This is the one case where multi-pass iteration is warranted — patches can't fix a fundamentally broken definition.

**The loop** (max 3 iterations):

1. **Rewrite**: The user (or an agent) rewrites the definition based on the outline you provided.
2. **Re-review**: Run `definition-review` on the rewritten definition.
3. **Evaluate**:
   - **PASS** → done, exit loop.
   - **NEEDS WORK** → run `improve` to apply the required changes table. Then:
     - If `improve` stops due to the 5+ rewrite gate (it reports the definition needs a full rewrite rather than applying individual changes), do **not** re-review. Present the required changes table to the user and note: "improve's rewrite gate was hit — the definition has 5+ findings targeting the same file. The user must decide: manually apply enough changes to bring the count below 5, or treat the definition as REWRITE and restart from step 1."
     - If `improve` applied 0 changes (all edits were reverted or blocked), do **not** re-review. Report: "No changes were applied by improve (all reverted or blocked). Manual intervention required — the required changes table is available for reference." Exit the loop.
     - Otherwise, re-review (go to step 2).
   - **REWRITE** again → the rewrite missed the mark. Provide updated guidance with specific quotes from the new version showing what's still wrong. Go to step 1.

**After 3 iterations**: If the definition still doesn't reach PASS or NEEDS WORK, stop and report: "This definition has not converged after 3 rewrite attempts. Manual authoring is needed — the outline and iteration feedback are available for reference."

**Important**: Each iteration should improve, not regress. If an iteration introduces new S-code errors that the previous version didn't have, flag it immediately rather than continuing — the rewriter is moving in the wrong direction.
