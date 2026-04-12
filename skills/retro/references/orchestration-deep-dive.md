# Orchestration Deep Dive

Load this reference when the run type is **orchestration** or **custom pipeline**. These sections supplement the core retro sections with analysis specific to multi-agent coordinated runs.

---

## Plan Quality (Orchestration)

Evaluate the plan as a first-class artifact. A bad plan poisons every downstream phase — most "agent failures" are actually planning failures.

1. **Revision count**: How many times did plan review require revisions? What were the critical issues? If zero revisions, was the plan actually good or did the reviewer miss problems that surfaced later?
2. **Subtask granularity**: Did any subtask exceed file caps or require splitting during execution? Were any too small to justify a separate agent spawn?
3. **Ownership accuracy**: Did agents need files outside their `owned_files`? Compare plan.json's file lists against `git diff --stat` to measure plan-to-outcome delta. Unplanned files signal plan gaps; planned files that weren't touched signal over-scoping.
4. **Contract accuracy**: How many integration contracts were defined? How many verified clean on first pass? Which failed, and was the failure predictable from the plan?
5. **Agent routing**: Were subtasks assigned to the right agent types? Did any agent end up doing work outside its specialization (e.g., frontend-engineer writing API middleware)?
6. **Naming/shape fidelity**: Did the plan lock down identifiers and types that propagated correctly, or did agents invent conflicting names during implementation?
7. **Dependency graph**: Were `blockedBy` relationships correct? Did any group-2 subtask actually depend on a group-2 peer that should have been in group-1?

**Verdict**: Was this plan a net accelerator or did it create rework? What single change to the planner prompt would have the highest impact?

If `scripts/parse-metrics.py` was run, use the `plan_vs_outcome` section of its output to ground this analysis in data rather than impressions.

**Plan inventory accuracy check**: When a plan lists specific file paths as migration targets (especially for changelog or stub migrations), verify whether the planner sampled actual file contents before writing the subtask. A plan that describes files as "single-version stubs" without reading them is speculative — if the described state doesn't match reality, the subtask will miss files and require an unplanned follow-on agent. When reviewing a plan, spot-check 2-3 listed files in high-volume migration subtasks to confirm the description matches the actual file state. If it doesn't, flag as a spec gap in 3.2.

---

## Coordination & Handoffs

Analyze the information flow between agents.

**Handoff schema contract**: The `files_written` field MUST be a JSON array of absolute file paths. Never an integer count. Agents that emit `"files_written": 14` (integer) instead of `"files_written": ["/path/to/file.md", ...]` (list) break `parse-metrics.py` and downstream agents that iterate over the field. When dispatching agents, include this in the handoff instructions: "The `files_written` field must be a JSON array of file paths, not a count."

1. **Handoff completeness**: Did every agent produce a structured handoff? Were `files_written`, `notes`, and `recommendations` fields populated and accurate? Check `.orchestrator/sessions/$SID/handoffs/` — empty or minimal handoffs are a prompt gap in the producing agent.
2. **Information degradation**: Did any downstream agent (integration-verifier, quality-engineer, design-architect) have to re-read source files because the upstream handoff was vague or missing context? Evidence: an agent's turn count is high relative to its file count, suggesting it spent turns on discovery rather than action.
3. **Conflict detection**: Were there file ownership conflicts? Did the single-writer rule hold, or did agents step on each other? Check for files appearing in multiple handoffs' `files_written` lists.
4. **Cross-boundary impact**: When a change affected a shared type, response format, or interface, was the downstream consumer notified? Or did it surface as a surprise in integration verification? This is a leading indicator of contract drift.
5. **Handoff-to-action ratio**: For each handoff consumed by a downstream agent, did the downstream agent act on the recommendations? Ignored recommendations suggest the handoff format doesn't match what the consumer needs.

---

## Quality Loop Dynamics

Analyze the fix-review cycle. This is where wall-clock time gets burned.

1. **Iteration count**: How many quality loop passes? What blocked the first pass from being clean?
2. **Fix churn**: Which files were modified in multiple iterations? A file touched 3+ times signals a structural problem — bad contract, unclear spec, conflicting reviewer criteria, or a fix agent lacking domain context.
3. **Fix-to-break ratio**: Did fixes introduce new findings? If reviewers kept surfacing new issues after each fix round, diagnose why:
   - Fix agent lacked context the reviewer has (e.g., design-authority skill)
   - Reviewer criteria are contradictory (two reviewers want opposite things)
   - Fix scope was too narrow (fixed the symptom, not the cause)
4. **Domain routing accuracy**: Were findings routed to the right specialist (frontend vs backend vs cross-cutting)? Did any agent receive work outside its expertise? Evidence: an agent's handoff shows `items_escalated` or its fixes were immediately flagged by the next review pass.
5. **Convergence**: Did findings decrease monotonically across iterations, or oscillate? Monotonic decrease = healthy convergence. Oscillation = reviewers disagree or fixes are unstable. Plateau = a finding is unfixable by agents and should be escalated.
6. **Gate accuracy**: Did the release-gate verdict match reality? A premature SHIP WITH CAUTION that should have been NO-SHIP (or vice versa) is a calibration issue in the gate prompt.

---

## Model Selection Efficiency

Compare each agent's model against its actual task complexity. In a multi-agent pipeline, different agents have wildly different reasoning requirements — using the same model for all of them is almost always wasteful.

**Typical downgrade candidates in orchestration:**
- **Exploration agents** — primarily run Glob, Grep, and Read. Rarely need deep reasoning. Sonnet or Haiku.
- **Integration verifier (structural mode)** — checks file existence and runs `tsc --noEmit`. Mechanical. Haiku.
- **Doc writer** — follows templates, reads existing docs, fills in sections. Sonnet.
- **Staff engineer on data/fixture subtasks** — copying patterns, generating config. Sonnet or Haiku.
- **Release engineer** — runs git commands, writes PR descriptions from handoff data. Sonnet.

**Typically justify Opus:**
- **Planner** — needs to reason about dependencies, file ownership, contract design across the full codebase.
- **Design architect** — judgment-heavy review across architecture, API design, and visual coherence.
- **Security engineer** — threat modeling requires reasoning about non-obvious attack surfaces.
- **Quality engineer in remediation mode** — needs to understand the finding, the codebase context, and the fix holistically.

**Security-engineer scope heuristic**: When dispatching security-engineer for a documentation-only or comment-only changeset (no new runtime code, no new dependencies, no schema changes), include this in the dispatch prompt: "If all changes are documentation or comments with no new runtime logic, limit scope to: (1) confirm no runtime code was modified, (2) scan new text content for embedded secrets or credentials, (3) skip full STRIDE/OWASP analysis. Exit early with a brief confirmation." Full STRIDE/OWASP on a docs-only change produces zero actionable findings and burns ~80K tokens unnecessarily.

**How to recommend:**
For each agent flagged as a downgrade candidate, produce a recommendation with `Where` pointing to the agent's `.md` file and the specific `model` frontmatter field. If the agent inherits its model, note the orchestrator's dispatch as the place to override.

Estimate savings: if an agent used 50K tokens on Opus but could have run on Sonnet, that's roughly a 5x cost reduction for that agent. Multiply across all downgrade candidates for the pipeline-level savings.
