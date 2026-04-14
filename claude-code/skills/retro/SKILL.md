---
name: retro
description: >
  Run a retrospective on any completed run — single agent, subagent, skill, or orchestration
  pipeline. Use when the user wants to debrief, analyze efficiency, or improve a workflow.
argument-hint: "[run-type or orchestrator-dir]"
# version: 4.2.2
---

# Retrospective

Run a structured retrospective grounded in actual artifacts. Read everything before analyzing.

**Depth calibration**: Scale the retro to the run. Use this default:
- **Lightweight** (single agent, <5 files changed, no errors): sections 3.1, 3.2, 3.7, summary table. Skip verify-claims and parse-metrics scripts. Still save and check trends. Recommendations in 3.7 must derive only from findings in 3.1 and 3.2 — do not invent root causes from sections that were skipped.
- **Standard** (single agent/subagent with errors or rework, or any skill-based workflow): all applicable sections (3.5 only if multi-agent), run verify-claims.
- **Full** (orchestration/pipeline, or any run with >3 findings): all sections, all scripts, trends.

Always save to `~/.claude/retros/` regardless of depth — even lightweight retros contribute to trend analysis.

Before writing, read the example matching your run type from `references/example-output.md` — Example A for single-agent, Example B for orchestration. For subagent runs, use Example A as the closest match — substitute subagent dispatch quality analysis for skill effectiveness.

## 1. Scoping

Determine what kind of run you're analyzing:

| Run Type | Signal |
|---|---|
| **Orchestration** | `.orchestrator/sessions/$SID/` or similar state dir exists with plans, handoffs, agent logs |
| **Custom pipeline** | Other coordination directories with state files, plans, or agent outputs |
| **Subagent** | Conversation shows Agent tool calls spawning child agents |
| **Single agent / skill** | One agent ran a task or skill directly |

State the run type, then identify the **subject** — the specific thing being retro'd. This gets saved in the summary JSON for per-subject trend tracking.

| Run Type | Subject examples |
|---|---|
| Orchestration | `orchestrator`, `deploy-pipeline`, a custom orchestrator name |
| Custom pipeline | pipeline name or directory name |
| Subagent | the agent type (e.g., `frontend-engineer`, `security-engineer`) |
| Single agent / skill | the skill name (e.g., `retro`, `git-ship`) or `claude` for a plain session |

Format the subject as a stable identifier — lowercase, hyphenated, consistent across runs. This is the key for filtering trends (e.g., "show me all orchestrator retros" or "how has the planner improved").

**For orchestration runs**: the `parse-metrics.py` script output includes a `subject` field detected from orchestrator artifacts. Use it if available — it's deterministic. Override only if clearly wrong.
**For non-orchestration runs**: identify the subject from the skill name (if a skill was invoked), the agent type (if a subagent was dispatched), or `claude` for a plain session.

## 2. Data Collection

Read everything that exists. Skip what doesn't.

**Universal** (always look for these — skip gracefully if unavailable):
1. `git log --oneline -30` — what actually landed. Skip if not in a git repo.
2. `git diff --stat` (vs merge-base or HEAD) — scope of changes. Skip if not in a git repo.
3. Conversation history — task description, user interactions, errors encountered. If retro is invoked in a fresh session (no conversation history), rely on git history and orchestrator artifacts instead.

**Orchestration / pipeline** (standard/full depth only):
4. Locate and run `parse-metrics.py` to generate structured metrics. Resolve path in this order:
   - `~/.claude/skills/retro/scripts/parse-metrics.py` (canonical install path)
   - `.claude/skills/retro/scripts/parse-metrics.py` (project-local install)
   - Skip with warning if neither path exists
   ```bash
   METRICS_SCRIPT=$(find ~/.claude/skills/retro/scripts -name "parse-metrics.py" 2>/dev/null | head -1)
   [ -z "$METRICS_SCRIPT" ] && METRICS_SCRIPT=$(find .claude/skills/retro/scripts -name "parse-metrics.py" 2>/dev/null | head -1)
   [ -n "$METRICS_SCRIPT" ] && python3 "$METRICS_SCRIPT" [ORCHESTRATOR_DIR]
   ```
   Use the JSON output to ground analysis in data rather than re-parsing artifacts manually.
5. If the script is unavailable or the directory doesn't exist, read artifacts directly: state files, plan files, agent logs, handoff files, backlog, prior attempts, exploration context.

## 3. Analysis

Produce the applicable sections below. Start the retro output with a header line: `# Retro: {subject} — {date}` so the saved markdown is self-describing. Be specific — cite agent names, file paths, and artifact content. No generic advice.

---

### 3.1 What Went Well

- What completed cleanly with no rework?
- What was faster or simpler than expected?
- Any catch that prevented a downstream failure or production bug?
- Any agent, skill, or prompt that performed notably well? Why — what about the instructions or context made it work?

---

### 3.2 What Went Wrong

For each problem, classify the root cause:

| Root Cause | Meaning | Applies To |
|---|---|---|
| **Spec gap** | Task was underspecified — vague prompt, missing requirements, no acceptance criteria | All run types |
| **Prompt gap** | Agent/skill instructions didn't cover this scenario | All run types |
| **Dispatch error** | Wrong agent type, wrong timing, or orchestrator did work it should have delegated | Orchestration / subagent |
| **Contract drift** | Planned interfaces didn't match implementation (types, shapes, paths) | Orchestration with contracts |
| **Context overflow** | Agent hit context limits, ran out of turns, or produced truncated output | All run types |
| **Misconfig** | Agent frontmatter, skill, hook, or settings.json issue | All run types |
| **Tool failure** | A tool call failed, returned unexpected results, or was unavailable | All run types |
| **External** | Network, dependency, or environment issue outside Claude Code | All run types |

---

### 3.3 Specification & Planning

*Applies to all run types.* A bad spec poisons everything downstream — most "agent failures" are actually specification failures.

**For single agent / skill / subagent runs:**
Read `references/single-agent-deep-dive.md` for detailed analysis of: prompt/spec quality, skill effectiveness, tool usage efficiency, context management, error recovery, and subagent dispatch quality.

**For orchestration / pipeline runs:**
Read `references/orchestration-deep-dive.md` for detailed plan quality analysis: revision count, ownership accuracy, contract accuracy, agent routing, and naming fidelity.

---

### 3.4 Execution Efficiency

**Per-agent metrics** (if `parse-metrics.py` output or agent logs exist, produce a table):

```
| Agent | Type | Model | Tokens | Est. Cost | Turns | Duration | Files | Tokens/File | Flags |
|---|---|---|---|---|---|---|---|---|---|
```

For cost estimates, read `references/model-pricing.json`. Use the blended rate (tokens * blended_per_mtok / 1,000,000) when input/output split is unavailable. Include a pipeline total at the bottom of the table.

Flag agents that:
- Used >100K tokens (context pressure)
- Used >40 turns (may be looping)
- Took >5 minutes (bottleneck candidate)
- Produced no output (truncated or crashed)
- Had tokens/file >20K (possible prompt bloat or excessive reading)

**For single-agent / subagent runs** without structured logs, estimate from conversation: how many tool calls, how many errors/retries, how much rework? See `references/single-agent-deep-dive.md` for tool usage and context management analysis.

**Critical path** (multi-agent only):
- For each parallel group, identify the slowest agent — that's the group bottleneck.
- Were agents in the same group given balanced work, or was one overloaded?
- Which group was the overall critical path? Could rebalancing save wall-clock time?

**Model selection**:
For each agent (or the single agent), assess whether the model used was appropriate for the task complexity:
- **Downgrade candidates**: completed with 0 errors, low turn count, no rework, mostly mechanical work (boilerplate, glob/grep, file copying, running scripts). These could likely run on a faster/cheaper model.
- **Justified**: caught subtle issues, made nuanced decisions, handled ambiguous instructions correctly. The model's reasoning capability earned its cost.
- **Upgrade candidates**: made reasoning errors that required rework, or struggled with complex multi-file dependencies.

Produce a recommendation when model and task complexity are clearly mismatched. Reference the agent's `model` field in its definition file or the orchestrator's dispatch.

**Wasted work**:
- Were any agents spawned that produced no actionable output?
- Did any phase require re-runs? How many? Why?

---

### 3.5 Coordination & Quality Loops — *multi-agent only*

Read `references/orchestration-deep-dive.md` for detailed analysis of:
- Handoff completeness and information degradation
- File ownership conflicts and cross-boundary impact
- Quality loop iteration count, fix churn, fix-to-break ratio, and convergence

---

### 3.6 Scope Fidelity

Compare intent to outcome:
- **Planned vs actual**: What was requested? What was delivered? What was missed? What was added that wasn't asked for?
- **File delta**: If a plan or `parse-metrics.py` output exists, use the `plan_vs_outcome` data. Otherwise, compare the stated task against `git diff --stat`.
- **User interventions**: How many times did the user intervene (scope changes, corrections, skipped phases, stop/restart)? Were they at planned gates or unplanned interruptions?

---

### 3.7 Recommendations

**D2.3 — Periodic analyst reminder (runs for every retro invocation):**

```bash
RETRO_DIR=~/.claude/retros/autoresearch-analyst
if [ -d "$RETRO_DIR" ]; then
  LAST_FILE=$(ls "$RETRO_DIR"/*.json "$RETRO_DIR"/*.md 2>/dev/null \
    | grep -v '/improve' | sort | tail -1)
  if [ -n "$LAST_FILE" ]; then
    LAST_DATE=$(basename "$LAST_FILE" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}' | head -1)
    TODAY=$(date +%Y-%m-%d)
    DAYS=$(( ($(date -d "$TODAY" +%s 2>/dev/null || date -j -f "%Y-%m-%d" "$TODAY" +%s) \
            - $(date -d "$LAST_DATE" +%s 2>/dev/null || date -j -f "%Y-%m-%d" "$LAST_DATE" +%s)) / 86400 ))
    if [ "$DAYS" -gt 30 ]; then
      echo "META-001: Last standalone autoresearch-analyst retro was $LAST_DATE, $DAYS days ago. Consider running /retro autoresearch-analyst for a focused review."
    fi
  fi
fi
```

If the script emits a META-001 line (threshold: more than 30 days since last standalone retro), prepend it as the first bullet in the 3.7 output. If `~/.claude/retros/autoresearch-analyst/` does not exist or contains no matching files, skip silently — this check costs one Bash call and never blocks the retro.

For each recommendation:
- **What**: The specific change
- **Where**: Exact file path to modify (agent .md, skill SKILL.md, hook, settings.json, CLAUDE.md, etc.)
- **Why**: The problem it prevents, linked to a specific finding above
- **Priority**: P0 (blocks next run) / P1 (measurably improves quality) / P2 (nice to have)
- **Type**: One of:
  - `fix` — make the change and it's done
  - `pattern` — a recurring insight worth saving to memory for future sessions (only if it can't be derived from the codebase and would prevent a repeated mistake)

---

## Gotchas

Common retro mistakes — read before analyzing:

- **Correlation is not bottleneck.** A slow agent that ran in parallel with an even slower one wasn't on the critical path. Don't recommend optimizing it.
- **Token count alone doesn't indicate waste.** An agent reading 20 files to write 2 may be doing correct research. Check whether the reading led to better output.
- **Multi-touch files aren't automatically churn.** A file modified in implementation then again in the quality loop is normal. Churn is when the *same finding* causes repeated modification — the fix didn't stick.
- **Missing handoffs don't always mean crashes.** The extraction hook may have failed while the agent succeeded. Check git diff for the agent's expected output before declaring it a failure.
- **Don't confuse user wait time with pipeline inefficiency.** Time spent at approval gates is user latency, not system performance. Track it separately.
- **"The agent should have known" is usually a spec gap, not an agent gap.** If the agent lacked context, the fix is usually upstream (better prompt, better spec, better context files) not downstream (smarter agent).

## Finalization

After completing the analysis, read `references/finalization.md` and follow all steps in order: validation, output formatting with summary table, trend analysis, and saving to `~/.claude/retros/`. All steps must complete before presenting the /improve prompt.

Steps in order: (1) write draft to temp path (e.g., `/tmp/retro-draft-TIMESTAMP.md`) → (2) run verify-claims → (3) fix failures → (4) format output with summary table → (5) check trends → (6) save final to `~/.claude/retros/{subject}/`.

**Rule-expiry surfacer (runs after step 1):** Check whether `~/.claude/metadata/rule-expiry.json` exists. If it does, find all entries where `status == "active"` and `review_by < today`. If any exist, append a single P2 recommendation to the 3.7 Recommendations section:

> `Review expired rules: N entries in rule-expiry.json have passed their review_by date. Run /improve remove <rec-id> for each.`

List the expired rec-ids inline (e.g., `REC-12, REC-18`). This is purely informational surfacing — the retro does not modify `rule-expiry.json`. If the file does not exist or has no expired active entries, skip silently.

## Next Step

If there are any `fix` type recommendations, prompt the user:

> This retro produced N recommendations (N P0, N P1, N P2).
> - `/improve` — apply recommendations with verification
> - `/improve --validate` — apply and validate with review-skill (you'll be asked for max iterations, default 3)
> - "no" to skip

If there are 0 `fix` recommendations and only `pattern` recommendations, note:
> No file changes needed — run `/improve` to save patterns to memory, or skip.

If there are 0 recommendations of any type, skip the /improve prompt entirely.

**Important**: The user must invoke `/improve` directly — do not attempt to apply recommendations yourself or delegate to an agent. The `/improve` skill has its own accept/revert verification loop and saves the outcome to `~/.claude/retros/` for trend tracking. Applying fixes through any other mechanism (agent dispatch, manual edits) bypasses verification and outcome tracking.

$ARGUMENTS
