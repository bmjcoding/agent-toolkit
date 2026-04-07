---
name: review-skill
description: >
  Review a skill or agent definition for quality and correctness. Use when evaluating
  a contribution before merging, after writing a new skill, or when a skill underperforms.
disable-model-invocation: true
argument-hint: "[path to SKILL.md, agent .md, or directory]"
metadata:
  version: 1.0.0
---

# Review Skill / Agent Definition

Evaluate a skill or agent definition against quality standards. Produces a **PASS**, **NEEDS WORK**, or **REWRITE** verdict with specific findings.

## Workflow

### 1. Run the linter

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/lint-definition.py $ARGUMENTS --format json
```

For a directory, the script finds all SKILL.md and agent .md files recursively. Parse the JSON output — it contains structural errors (must fix) and quality warnings (should fix).

If the linter finds structural errors (S-codes), stop here — the definition doesn't meet minimum bar. Report the errors and verdict: **REWRITE**.

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
- Does it handle $ARGUMENTS?
- If it runs scripts, are error cases handled?

### 3. Verdict

Produce one of three verdicts based on the combined findings:

**PASS** — Definition meets quality bar. May have minor suggestions (P2).
Criteria: 0 structural errors, 0 quality errors, actionable instructions, clear workflow.

**NEEDS WORK** — Fixable issues that /improve can handle. List specific changes.
Criteria: 0 structural errors, but has quality gaps — vague instructions, missing error handling, no output template, description won't trigger correctly.

**REWRITE** — Fundamentally below quality bar. Patching won't fix it.
Criteria: Any of these signals:
- More than 5 quality warnings
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

For **NEEDS WORK** verdicts, the required changes table uses the same format as `/retro` recommendations — directly consumable by `/improve`. `Where` is the file path, `Priority` is P0/P1/P2, `Type` is `fix` or `pattern`.

For **REWRITE** verdicts, provide a brief outline of what a good version would look like: what the skill should cover, what structure it should use, and 1-2 concrete instruction examples at the right level of specificity.

$ARGUMENTS
