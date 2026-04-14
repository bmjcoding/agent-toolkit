# Example Retro Output

Pattern-match against these examples for tone, specificity, and structure. Adapt to the actual run — don't copy these verbatim.

---

## Example A: Single Agent / Skill Run

> Context: A user asked Claude to "build a settings page for the app" with no further spec. The agent built a page that looked fine but missed several requirements the user had in mind.

### 3.1 What Went Well

- The agent correctly identified the existing layout pattern in `src/app/layout.tsx` and matched it for the new page — consistent sidebar, header, breadcrumb structure.
- Route registration was handled correctly on the first attempt: added to `src/app/routes.ts` and the sidebar nav in `src/components/Sidebar.tsx`.
- The agent used the project's existing form components (`FormField`, `FormSection`) rather than building from scratch, avoiding design system drift.

### 3.2 What Went Wrong

| # | Problem | Root Cause | Detail |
|---|---|---|---|
| 1 | Settings page had no sections for notification preferences or API keys — user expected both | **Spec gap** | The prompt "build a settings page" didn't enumerate required sections. The agent built profile/password only, which is the obvious default but not what was needed. |
| 2 | Agent read all 14 component files in `src/components/ui/` before starting — only used 3 | **Prompt gap** | No instruction to check the design system reference first. Agent explored by brute-force file reading instead of targeted lookup. |
| 3 | Form validation used inline regex instead of the project's existing `zod` schemas in `src/lib/validators.ts` | **Prompt gap** | Agent wasn't aware of the validation pattern. CLAUDE.md doesn't mention it, and the agent didn't search for existing validation before writing its own. |

### 3.3 Specification & Planning

The prompt was three words: "build a settings page." This is the root cause of finding #1.

- **Acceptance criteria**: None provided. The agent had no way to know notification preferences and API key management were expected.
- **Plan mode**: Not used. The agent went straight to implementation. For a page touching 6+ files (route, nav, page component, sub-components, validators, tests), plan mode would have surfaced the scope question before any code was written.
- **Context available**: The project had an existing settings page in a different app (`packages/admin/src/pages/Settings.tsx`) that included all the expected sections. If the prompt had said "like the admin settings page" or the agent had been told to check for prior art, finding #1 would not have occurred.
- **Single missing context that would have changed the outcome**: A list of required sections. Even "settings page with profile, notifications, and API keys" would have been sufficient.

### 3.4 Execution Efficiency

No structured logs available. Estimated from conversation:

- ~45 tool calls total, ~12 were file reads that didn't inform the output (reading all of `src/components/ui/` when only `FormField`, `FormSection`, and `Button` were used).
- 2 errors: first attempt at form submission handler failed because the agent guessed the API endpoint path (`/api/settings`) instead of checking `src/app/api/` for the actual pattern (`/api/v1/user/settings`). Fixed on second attempt after reading the existing API routes.
- No retries or loops — errors were diagnosed correctly on first encounter.
- **Model selection**: Session ran on Opus. The task (build a settings page following existing patterns) is well-specified with clear conventions in the codebase. Sonnet would likely have produced equivalent results at lower cost. The 2 errors were both "didn't look before guessing" — a reasoning upgrade wouldn't help, better context would.

### 3.6 Scope Fidelity

- **Requested**: "build a settings page" (interpreted as profile + password)
- **Delivered**: Profile editing, password change — functional but incomplete
- **Missed**: Notification preferences, API key management, theme selection
- **Added (not asked)**: A "danger zone" section with account deletion — reasonable but unasked for
- **User interventions**: 1 unplanned — user corrected scope after seeing the result

### 3.7 Recommendations

| # | What | Where | Why | Priority | Type |
|---|---|---|---|---|---|
| 1 | Add to CLAUDE.md: "For new pages or features, ask the user to enumerate required sections/fields before implementing, or enter plan mode." | `CLAUDE.md` | Prevents spec gap (finding #1) — the most common failure mode for vague prompts | P1 | fix |
| 2 | Add to CLAUDE.md: "Validation uses zod schemas in `src/lib/validators.ts`. Check there before writing inline validation." | `CLAUDE.md` | Prevents reinventing validation (finding #3) | P1 | fix |
| 3 | When building new pages, search for existing similar pages in the project before starting implementation | memory | Agent found the layout pattern but missed the admin settings prior art — a targeted search would have caught it | P2 | pattern |

---

## Example B: Orchestration Pipeline Run

> Context: The orchestrator ran a 6-phase pipeline to add a contributions feature (API, UI, tests). 12 agents spawned across 3 implementation groups. Quality loop ran 2 iterations. Final verdict: SHIP WITH CAUTION.

### 3.1 What Went Well

- Exploration phase completed in 2m 40s with all three agents (frontend, backend, staff) producing accurate summaries. The backend exploration agent caught that the existing `POST /api/projects` endpoint already had a `contributors` field that was undocumented — this prevented a duplicate data model.
- Group 1 (types, schemas, shared utilities) completed cleanly. All 4 integration contracts verified on first pass.
- `security-engineer` flagged that the new `PATCH /api/contributions/:id` endpoint accepted a `role` field without authorization check — would have been a privilege escalation in production.

### 3.2 What Went Wrong

| # | Problem | Root Cause | Detail |
|---|---|---|---|
| 1 | `frontend-engineer` in group 2 (subtask 5) used `contributionId` as the field name, while `backend-engineer` (subtask 4) exported `id`. Type mismatch broke compilation. | **Contract drift** | The integration contract specified `ContributionResponse` shape but didn't lock the ID field name. Planner wrote "unique identifier" — each agent chose differently. |
| 2 | `quality-engineer` in iteration 1 fixed the security finding (#3 above) by adding auth middleware, but broke the existing test for unauthenticated contribution viewing. | **Prompt gap** in `quality-engineer` | The remediation prompt said "add authorization check" but didn't mention the public-read use case. Agent had no context about which endpoints should remain public. |
| 3 | `design-architect` took 6m 12s and 127K tokens — longest agent in the pipeline. | **Context overflow** | Agent read all 34 changed files plus the entire design system reference. For a mostly-backend feature, Pillar C (visual/UI) analysis was minimal but the agent loaded all design references anyway. |
| 4 | The orchestrator dispatched `quality-engineer` for a CSS specificity finding that `frontend-engineer` (with design-authority skill) would have resolved more accurately. | **Dispatch error** | The finding mentioned `z-index` which the orchestrator classified as "cross-cutting." It was actually a pure UI issue. Frontend-engineer's design-lint skill has a specific z-index check. |

### 3.3 Specification & Planning

*(See `references/orchestration-deep-dive.md` for framework.)*

- **Plan revisions**: 1. Plan reviewer flagged that subtask 3 (API routes) and subtask 6 (API tests) shared `owned_files` overlap on `src/api/__tests__/contributions.test.ts`. Resolved by moving test file ownership to subtask 6.
- **Ownership accuracy**: 2 unplanned files created (`src/lib/contribution-utils.ts` by subtask 4, `src/types/contribution-errors.ts` by subtask 5). Both should have been in group 1 as shared utilities.
- **Contract accuracy**: 5 contracts defined, 4 verified clean on first pass. The `ContributionResponse` shape contract (finding #1) failed because it described the shape in prose rather than providing an exact TypeScript interface.
- **Naming fidelity**: Finding #1 — the plan said "unique identifier" instead of specifying `id: string`. This propagated as a mismatch.
- **Verdict**: The plan was a net accelerator — 3 of 3 groups ran in parallel successfully. Single highest-impact change: require exact field names in contract definitions, not prose descriptions.

### 3.4 Execution Efficiency

| Agent | Type | Model | Tokens | Est. Cost | Turns | Duration | Files | Tokens/File | Flags |
|---|---|---|---|---|---|---|---|---|---|
| impl-g1-s1 | staff-engineer | opus | 42,000 | $0.63 | 18 | 1m 50s | 4 | 10,500 | — |
| impl-g1-s2 | staff-engineer | opus | 38,000 | $0.57 | 15 | 1m 32s | 3 | 12,667 | — |
| impl-g2-s3 | backend-engineer | opus | 67,000 | $1.01 | 28 | 3m 10s | 8 | 8,375 | — |
| impl-g2-s4 | backend-engineer | opus | 71,000 | $1.07 | 31 | 3m 28s | 7 | 10,143 | — |
| impl-g2-s5 | frontend-engineer | opus | 58,000 | $0.87 | 24 | 2m 45s | 6 | 9,667 | — |
| impl-g3-s6 | backend-engineer | opus | 45,000 | $0.68 | 19 | 2m 05s | 5 | 9,000 | — |
| integration-g1 | integration-verifier | opus | 22,000 | $0.33 | 12 | 1m 10s | 0 | — | downgrade→haiku |
| integration-g2 | integration-verifier | opus | 31,000 | $0.47 | 16 | 1m 40s | 2 | 15,500 | — |
| security-1 | security-engineer | opus | 55,000 | $0.83 | 22 | 2m 50s | 0 | — | — |
| sre-1 | site-reliability-engineer | opus | 34,000 | $0.51 | 14 | 1m 35s | 1 | 34,000 | — |
| design-1 | design-architect | opus | 127,000 | $1.91 | 38 | 6m 12s | 0 | — | context_pressure |
| quality-i1 | quality-engineer | opus | 48,000 | $0.72 | 21 | 2m 20s | 3 | 16,000 | — |
| **Total** | | | **638,000** | **$9.57** | | | | | |

- **Critical path**: Group 2 was the bottleneck (3m 28s, `impl-g2-s4`). Groups 1 and 3 were faster. Overall critical path: explore (2m 40s) → plan (1m 50s) → group 1 (1m 50s) → group 2 (3m 28s) → group 3 (2m 05s) → reviews (6m 12s) → quality loop (4m 40s). Total: ~23 minutes.
- **Load balance**: Group 2 was well-balanced (3m 10s, 3m 28s, 2m 45s). No agent was idle waiting.
- **Design-architect** was the review bottleneck at 6m 12s / 127K tokens. It loaded the full design system reference for a feature with minimal UI changes. The `paths` frontmatter field could restrict it to only load when `.tsx`/`.css` files are in the diff.
- **Wasted work**: None — all agents produced actionable output.

### 3.6 Scope Fidelity

- **Plan-to-outcome delta**: +2 unplanned files, 0 missed files. The 2 unplanned files (`contribution-utils.ts`, `contribution-errors.ts`) were reasonable but should have been planned in group 1.
- **User interventions**: 2 planned (scope confirmation, plan approval), 0 unplanned.

### 3.7 Recommendations

| # | What | Where | Why | Priority | Type |
|---|---|---|---|---|---|
| 1 | Require exact TypeScript interfaces in integration contracts, not prose descriptions like "unique identifier" | `agents/planner.md` — add to contract reconciliation rules | Prevents contract drift (finding #1). Prose descriptions are ambiguous; type literals are not. | P0 | fix |
| 2 | Add to quality-engineer prompt: "Before applying auth fixes, check for intentionally public endpoints by reading the route's existing middleware chain." | `agents/quality-engineer.md` | Prevents auth fix breaking public endpoints (finding #2) | P1 | fix |
| 3 | Add `paths: "*.tsx, *.css"` to design-architect frontmatter so it skips full design reference loading for backend-heavy features | `agents/design-architect.md` | Prevents context overflow on non-UI features (finding #3). Saves ~70K tokens on backend features. | P1 | fix |
| 4 | Add dispatch rule to the orchestrator: findings mentioning design-lint check names (z-index, hex-colors, etc.) route to frontend-engineer, not quality-engineer | `agents/orchestrator.md` — quality loop domain routing | Prevents misrouted design findings (finding #4) | P2 | fix |

### Summary

| Metric | Value |
|---|---|
| Run type | orchestration |
| Subject | orchestrator |
| Phases completed | 6/6 |
| Agents spawned | 12 |
| Total tokens consumed | 638,000 |
| Total wall-clock time | ~23m |
| Critical path agent | design-1 (6m 12s) |
| Quality loop iterations | 2 |
| Findings (critical/high/medium/low) | 1/3/2/1 |
| Spec/plan revisions | 1 |
| Plan-to-outcome file delta | +2 unplanned, 0 missed |
| Files changed | 34 |
| User interventions | 2 (2 planned, 0 unplanned) |
| Fix churn (files modified 2+ times) | 1 |
| Model downgrades recommended | 1 agent (integration-g1 → haiku) |
| Estimated cost | $9.57 (blended, all opus) |
| Root causes | spec gap: 0, prompt gap: 1, dispatch error: 1, contract drift: 1, context overflow: 1 |
