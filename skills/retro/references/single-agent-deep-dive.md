# Single Agent & Skill Deep Dive

Load this reference when the run type is **single agent**, **skill-based workflow**, or **subagent**. These sections supplement the core retro sections with analysis specific to individual agent execution.

---

## Prompt & Specification Quality

The prompt is the plan. Analyze it as a first-class artifact.

1. **Clarity**: Was the task unambiguous? Could two different agents reading the same prompt produce the same output? If not, what was ambiguous?
2. **Decomposition**: Did the prompt break a complex task into steps, or dump everything as one block? Multi-step tasks given as a single instruction force the agent to infer sequencing.
3. **Acceptance criteria**: Were success conditions stated? "Build a login page" vs "Build a login page with email/password fields, error states for invalid credentials, and redirect to /dashboard on success" produce very different outcomes.
4. **Constraints communicated**: Was the tech stack specified? Design system? Existing patterns to follow? Conventions the agent couldn't infer from the codebase alone?
5. **Examples or references**: Were examples of desired output provided? A wireframe, screenshot, existing similar component, or sample data?
6. **Plan mode usage**: Did the agent enter plan mode before implementing? Should it have? For tasks touching 5+ files or involving architectural decisions, skipping planning almost always produces rework.

**Key question**: If you gave this exact prompt to a different agent with no conversation history, would it produce the same result? If not, the missing context is the spec gap.

---

## Skill Effectiveness

*Skip if no skill was involved.*

1. **Instruction coverage**: Did the skill's instructions cover the scenario that actually occurred? Were there branches or edge cases the skill didn't address?
2. **Instruction adherence**: Did the agent follow the skill's instructions, or deviate? If it deviated, was the deviation an improvement or a mistake?
3. **Instruction conflicts**: Did the skill's instructions conflict with CLAUDE.md, other active skills, or the user's prompt? Conflicts cause unpredictable behavior — the agent picks one and ignores the other.
4. **Missing instructions**: What instructions, if added to the skill, would have prevented the problems observed? Be specific — "handle edge cases" is not actionable.
5. **Unnecessary instructions**: Did any skill instructions waste agent effort on steps that didn't apply? Instructions the agent follows but that produce no value burn tokens and attention.
6. **Reference file usage**: If the skill has `references/`, did the agent load them at the right time? Did it load references it didn't need, or skip ones it should have read?

**Rewrite signal**: If 3+ findings in the retro trace back to the same skill's instructions (vague steps, missing coverage, conflicting guidance), the skill may need a structural rewrite rather than individual patches. Recommend running `/review-skill` on it to get a full quality assessment.

---

## Tool Usage Efficiency

Analyze how the agent used its available tools.

1. **Tool selection**: Did the agent use the right tool for each operation? Common mistakes:
   - Bash `grep`/`find` instead of Grep/Glob
   - Reading entire large files instead of targeted reads with offset/limit
   - Writing files from scratch instead of editing with Edit
   - Multiple sequential reads that could have been parallel
2. **Unnecessary reads**: Did the agent read files it didn't end up using? Count files read vs files that informed the output. A high read-to-use ratio suggests unfocused exploration.
3. **Retry patterns**: How many tool calls failed and were retried? Were retries identical (blind retry) or modified (diagnosed the failure)? Blind retries waste turns.
4. **Bash usage**: Were Bash calls used for appropriate purposes (builds, tests, git commands), or for operations that have dedicated tools?
5. **Parallel opportunities missed**: Were there independent tool calls made sequentially that could have been parallelized?

---

## Context Management

How well did the agent use its context window?

1. **Reading strategy**: Did the agent read files strategically (targeted sections) or greedily (entire files regardless of size)? Greedy reading accelerates context pressure.
2. **Information retention**: Did the agent re-read files it had already read? This suggests it lost track of earlier content after context compression.
3. **Decision consistency**: Did the agent make a decision early, then contradict it later? This can indicate context loss from compaction or simply unclear reasoning.
4. **Scope creep**: Did the agent do work beyond what was asked? Adding features, refactoring adjacent code, or "improving" things not in scope wastes context on unasked work.

---

## Error Recovery

How did the agent handle failures?

1. **Diagnosis quality**: When an error occurred, did the agent read the error message and diagnose the root cause, or immediately retry the same approach?
2. **Fix appropriateness**: Were fixes targeted (change the broken line) or shotgun (rewrite the whole file)? Shotgun fixes risk introducing new problems.
3. **Escalation timing**: If the agent couldn't fix something, did it escalate to the user promptly, or burn 10+ turns trying variations? The right time to escalate is after 2-3 materially different approaches fail.
4. **Error cascades**: Did a single early mistake compound into multiple downstream failures? If so, what was the root error, and could earlier validation have caught it?

---

## Subagent Dispatch Quality

*Skip if no subagents were spawned.*

1. **Dispatch prompt completeness**: Did the parent provide enough context for the subagent to act independently? Missing context forces the subagent to guess or re-discover.
2. **Agent type selection**: Was the right agent type chosen? A task dispatched to `Explore` that needed file writes, or to `general-purpose` when `frontend-engineer` had the right skills loaded.
3. **Result integration**: Did the parent agent use the subagent's results effectively, or ignore/re-derive them?
4. **Parallelism**: Were independent subagents launched in parallel, or unnecessarily serialized?
5. **Scope calibration**: Was the subagent given too much work (context overflow risk) or too little (overhead not justified)?
6. **Model selection**: Was the model appropriate for the task? A subagent dispatched at `opus` that only ran Glob/Grep and produced a file list could have been `haiku`. Conversely, a `sonnet` subagent that made reasoning errors and required rework might have justified `opus`.

---

## Model Selection

*Applies to all run types.*

Assess whether the model used matched the task's actual reasoning requirements.

**Signs the task could run on a cheaper/faster model:**
- Completed with 0 errors and no rework
- Mostly mechanical operations: file reads, glob/grep, boilerplate generation, running scripts, following templates
- Well-specified task with clear step-by-step instructions — minimal judgment required
- Low turn count relative to files written (efficient, no exploration needed)

**Signs the model was justified or should be upgraded:**
- Made nuanced judgment calls that proved correct (architecture decisions, security findings, design review)
- Handled ambiguous instructions by making good inferences
- Caught subtle issues that a simpler model would miss
- Conversely: made reasoning errors → might need a stronger model

**For single agent runs:** If the session used Opus but the task was "rename these 5 variables" or "add this import to these 3 files," that's a clear downgrade candidate. Recommend the user invoke with a model flag or set a default for simple tasks.

**For skill-based runs:** If a skill consistently runs simple, well-specified workflows, recommend adding `model: sonnet` or `model: haiku` to the skill's frontmatter to set a default.
