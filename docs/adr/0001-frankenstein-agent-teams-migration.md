# ADR-0001: Agent Teams Migration Path

## Status

Proposed (updated 2026-04-07)

## Context

The Frankenstein orchestrator dispatches 13 specialist subagents via the `Agent` tool, managing parallelism with `run_in_background: true` and inter-agent communication through a filesystem-based handoff protocol:

- **SubagentStop hook** (`extract-handoff.sh`) extracts fenced `handoff` JSON from each agent's final message and writes it to `.orchestrator/handoffs/<agent_id>.json`
- **SubagentStart hook** (`inject-context.sh`) injects `.orchestrator/plan.json` and `.orchestrator/context/project-brief.md` into each spawned agent, plus the four Orchestrator Constraints (file ownership, protected files, single-writer rule, handoff protocol)
- **Crash recovery** via `.orchestrator/state.json`, checkpointed after each phase
- **Single-writer rule** enforced by convention: agents check `files_written` in peer handoffs before modifying source files

Claude Code agent teams (experimental) offer a native coordination layer with shared task lists, lateral messaging between teammates, and built-in dependency resolution.

### Key constraints

- Agent teams are experimental and disabled by default
- Organization uses Claude Code via AWS Bedrock API gateway where `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` must remain disabled
- Current architecture is stable and battle-tested across multiple projects -- migration is opportunistic, not urgent
- The orchestrator is a pure dispatcher (`disallowedTools: Write, Edit`) and cannot be re-spawned by subagents (`Agent(frankenstein)` is denied in settings.json)

### Current agent roster (13 specialists)

| Phase | Agent | Model | Role |
|-------|-------|-------|------|
| 0 | frontend-engineer | inherit | React/Tailwind UI, design-authority skill |
| 0 | backend-engineer | inherit | API routes, services, data layer |
| 0 | staff-engineer | inherit | Shared types, config, infra, scripts |
| 1 | planner | inherit | Decomposes task into plan.json |
| 1 | plan-reviewer | sonnet | Validates plan quality (max 2 revisions) |
| 2 | integration-verifier | inherit | Structural checks + cross-boundary review |
| 3a | security-engineer | inherit | STRIDE, OWASP, dependency audit |
| 3a | site-reliability-engineer | inherit | Health checks, observability, inline fixes |
| 3b | design-architect | inherit | Architecture + UI review, structural lint |
| 4 | quality-engineer | inherit | Remediation, integration-repair, post-validation |
| 4 | release-gate | inherit | SHIP/NO-SHIP verdict via /prod-readiness |
| 5 | doc-writer | sonnet | README, CHANGELOG, API docs, ADRs |
| 6 | release-engineer | sonnet | Commits, PR, push, optional versioning |
| 7 | autoresearch-analyst | sonnet | Retrospective + self-improvement |

### Current phase structure

```
Phase 0    Explore (parallel research, no writes)
Phase 0.5  Scope Confirmation Gate (user approval)
Phase 1    Plan (planner -> plan-reviewer, max 2 revisions)
Phase 1.5  User Gate (STOP until explicit "proceed/yes/go")
Phase 2    Implement (per parallel_group, integration-verifier between groups)
Phase 3a   Reviews (security, SRE, integration in parallel)
Phase 3b   Design review (receives SRE handoff)
Phase 4    Quality Loop (triage -> fix -> re-review, max 3 iterations)
Phase 5    Finalize (5a: doc-writer, 5b: post-validation read-only)
Phase 6    Ship (release-engineer)
Phase 7    Retrospective (autoresearch-analyst)
```

### Current hooks

| Hook | Script | Purpose |
|------|--------|---------|
| SubagentStart | inject-context.sh | Context injection + orchestrator constraints |
| SubagentStop | extract-handoff.sh | Extract handoff JSON to .orchestrator/handoffs/ |
| PreToolUse | branch-guard.sh | Deny push to main/master |
| PreToolUse | pre-push-secrets.sh | Gitleaks / regex secrets scan |
| TaskCreated | inline | Log to tasks.log |
| TaskCompleted | inline | Log to tasks.log |
| TeammateIdle | prompt | Future: check plan.json for remaining tasks (agent teams only — see below) |
| FileChanged | inline | Warn on .env modification |

**Note on TeammateIdle**: This hook is pre-wired for the [Agent Teams](https://code.claude.com/docs/en/agent-teams) migration. It is not a current Claude Code hook event — it will activate when agent teams is enabled. Until then it is inert in settings.json and does no harm. Do not remove it; it is part of the migration preparation.

## Decision

When Claude Code agent teams reaches GA and is supported on AWS Bedrock, migrate the orchestrator as follows:

### 1. Replace Agent tool dispatch with team spawn + task assignment

The team lead (frankenstein) creates teammates instead of spawning subagents. Each teammate gets the same system prompt as its current `.md` agent definition file. Frontmatter (`model`, `maxTurns`, `permissionMode`, `disallowedTools`) maps directly to teammate configuration.

### 2. Load plan.json subtasks as team tasks

The `blockedBy` arrays in plan.json map to agent teams' dependency system. No translation layer needed -- the current plan format is compatible.

### 3. Replace handoff file I/O with mailbox messaging

| Current | Agent Teams |
|---------|-------------|
| SubagentStop hook extracts `handoff` JSON to `.orchestrator/handoffs/<id>.json` | Teammates send structured messages to each other directly |
| Frankenstein reads handoff files via `Read` tool | Team lead receives teammate completion messages natively |
| SubagentStart hook injects plan.json + project-brief.md | Shared task context is part of the team's task list |
| SRE passes handoff to design-architect via file | SRE messages design-architect directly |

The SubagentStart and SubagentStop hooks become unnecessary. The TeammateIdle hook (already wired as a prompt-type hook) remains and serves its current purpose.

### 4. Wire TaskCompleted hooks to trigger integration checks

When an implementation group's tasks all complete, the hook triggers `integration-verifier` automatically instead of the orchestrator polling handoff files. TaskCreated and TaskCompleted hooks (currently logging stubs) get promotion logic.

### 5. Phase structure, quality gates, and user approval gates stay identical

The phase/gate structure is orchestration logic owned by the team lead's prompt, not a communication pattern. Phases 0.5 and 1.5 (user gates), Phase 4 (quality loop with max 3 iterations), and Phase 2 (integration-verifier between groups) all remain unchanged.

### 6. Preserve single-writer enforcement

The single-writer rule currently relies on convention (agents check peer handoff `files_written` before modifying files). Under agent teams, this should move to a deterministic check: the team lead assigns file ownership per task, and the TeammateIdle or a new PreToolUse hook validates that an agent only writes to files it owns.

### 7. Retain crash recovery

`.orchestrator/state.json` checkpointing continues. Agent teams may provide native resumption, but the state.json fallback stays until that's confirmed.

## Preparation (completed)

- [x] TaskCreated and TaskCompleted hooks added to settings.json (logging stubs)
- [x] TeammateIdle hook added (prompt-based quality gate checking plan.json)
- [x] `run_in_background: true` used on agents that always run in background (reviewer agents)
- [x] Agent frontmatter uses `permissionMode: auto` (compatible with both subagent and teammate modes)
- [x] SubagentStart/SubagentStop hooks designed to be droppable (no orchestration logic embedded in them beyond handoff extraction and context injection)
- [x] `Agent(frankenstein)` denied in settings.json to prevent recursive spawn (analogous to preventing a teammate from re-creating the team lead)

## Consequences

### Token cost

Each teammate is a full Claude instance vs. a subagent that returns a summary. Budget ~2-3x token usage for the same pipeline. Four agents already use `sonnet` model to control costs (plan-reviewer, doc-writer, release-engineer, autoresearch-analyst) -- this strategy carries over.

### Lateral communication

Teammates can message each other (e.g., implementer asks security-engineer a question mid-implementation). This enables tighter feedback loops but requires clear boundaries:

- Implementation agents (`disallowedTools: Agent, WebSearch, WebFetch`) cannot spawn sub-teams under either model
- The single-writer rule prevents conflicting file edits
- A message budget or rate limit may be needed to prevent storms

### No nested teams

Teammates cannot spawn sub-teams. The quality loop (quality-engineer <-> release-gate, max 3 iterations) and inter-group integration checks remain sequential within the team lead.

### Display mode

Organization uses tmux-based terminal setup. Agent teams support tmux split-pane mode for visibility into each teammate. The existing `statusLine` hook provides additional observability.

### Hook migration

| Hook | Action |
|------|--------|
| SubagentStart (inject-context.sh) | **Remove** -- replaced by shared team context |
| SubagentStop (extract-handoff.sh) | **Remove** -- replaced by native mailbox |
| TeammateIdle | **Activate** -- already wired in settings.json, currently inert. Becomes active when agent teams is enabled. |
| TaskCreated / TaskCompleted | **Promote** -- add integration-check trigger logic |
| PreToolUse (branch-guard, secrets) | **Keep** -- orthogonal to agent model |

### Rollback

Agent `.md` definition files remain valid under both models. If agent teams proves problematic, revert `frankenstein.md` to Agent tool dispatch with no changes to individual agent definitions. Re-enable SubagentStart/SubagentStop hooks.

## References

- Agent definitions: `~/.claude/agents/` (symlinked from `claude-toolkit/agents/`)
- Hook scripts: `~/.claude/hooks/`
- Orchestrator runtime: `.orchestrator/` (per-project, gitignored)
- Audit findings: summarized in `~/.claude/projects/-Users-bmj--claude/memory/reference_frankenstein_audit.md` (original audit doc retired; findings tracked in memory)
