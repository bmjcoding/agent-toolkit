# Self-Improvement System Architecture

Diagram: `references/system-overview.svg` (or render `references/system-overview.mmd`)

## Components

### Skills (user-invocable workflows)

| Skill | Purpose | Inputs | Outputs |
|---|---|---|---|
| `/retro` | Post-run diagnosis | Git history, conversation, orchestrator artifacts | Retro markdown + JSON summary + trend data → `~/.claude/retros/` |
| `/improve` | Apply retro recommendations | Retro output (from conversation or file) | File edits + improve outcome JSON → `~/.claude/retros/` |
| `/review-skill` | Pre-merge quality gate | Skill/agent definition path | PASS / NEEDS WORK / REWRITE verdict |
| `/git-ship` | Git shipping (commit, PR, merge, cleanup) | Git state + $ARGUMENTS | Commits, PR, branch cleanup |
| `/prod-readiness` | Production readiness pipeline | Changed files | Build/lint/audit/test/verify + ship verdict |

### Commands (lightweight, stateless)

| Command | Purpose |
|---|---|
| `/lint` | Auto-fix linting and standards compliance |
| `/audit` | 14-dimension code quality audit |
| `/test` | Write tests to cover gaps, >=80% coverage |
| `/git-verify` | Secrets scan, sensitive files, commit quality |
| `/backlog` | View/manage deferred findings |

### Agents (dispatched by orchestrators)

| Agent | Dispatched by | Model recommendation |
|---|---|---|
| planner | orchestrator | opus (reasoning-heavy) |
| plan-reviewer | orchestrator | sonnet |
| frontend-engineer | orchestrator | opus (design system awareness) |
| backend-engineer | orchestrator | opus |
| staff-engineer | orchestrator | sonnet for data/config tasks |
| integration-verifier | orchestrator | haiku for structural, opus for cross-QA |
| quality-engineer | orchestrator | opus for remediation |
| security-engineer | orchestrator | opus (threat modeling) |
| site-reliability-engineer | orchestrator | opus |
| design-architect | orchestrator | opus (judgment-heavy) |
| release-gate | orchestrator | opus |
| doc-writer | orchestrator | sonnet |
| release-engineer | orchestrator | sonnet |

### Scripts

| Script | Lives in | Purpose |
|---|---|---|
| `parse-metrics.py` | retro | Parse orchestrator artifacts → structured JSON |
| `verify-claims.py` | retro | Verify retro claims (file paths, agent IDs, SHAs, severities) |
| `retro-history.py` | retro | Save/list/trends for retro history with --subject filtering |
| `lint-definition.py` | review-skill | 12 structural + 12 quality checks on skill/agent definitions |

### Persistence

All retro data lives at `~/.claude/retros/` (global, cross-project):

```
~/.claude/retros/
├── history.jsonl                              # append-only: all retro + improve entries
├── UI-TODO.md                                 # dashboard data spec
├── orchestrator/
│   ├── 2026-04-07T091330.md                   # retro: full markdown
│   ├── 2026-04-07T091330.json                 # retro: summary with subject, run_type, project, version
│   └── 2026-04-07T093000-improve.json         # improve: outcome with diffs, versions, accepted/reverted
├── git-ship/
│   └── ...
└── {subject}/
    └── ...
```

### Changelogs

Maintained by `/improve` on version bumps:

| Type | Location |
|---|---|
| Skills | `skills/{name}/CHANGELOG.md` (per-skill) |
| Agents | `agents/CHANGELOG.md` (all agents, organized by name) |
| Commands | `commands/CHANGELOG.md` (all commands, organized by name) |

## Flow

### The feedback loop

```
Run task → /retro (diagnosis) → /improve (treatment) → next run
                                                          ↓
                                              /retro (did treatment work?)
```

1. **Any workflow completes** (The orchestrator auto-prompts for retro; other workflows: user invokes)
2. **`/retro`** analyzes artifacts, identifies root causes, produces recommendations with file paths
3. **`/retro` saves** full markdown + summary JSON + appends to history.jsonl (with subject, project, run_type)
4. **`/retro` checks trends** — filters history by subject, flags regressions, notes if prior retro's /improve was run
5. **`/retro` prompts** "Want me to run /improve?"
6. **`/improve`** applies fixes with accept/revert verification, saves patterns to memory, records diffs
7. **`/improve` saves** outcome JSON + appends to history.jsonl
8. **Next run** — retro compares: did the same root causes recur? Were accepted changes effective?

### Pre-merge gate (for LOB contribution repos)

```
PR submitted → lint-definition.py --strict (CI) → /review-skill (semantic) → merge or reject
```

- `lint-definition.py --strict` runs in CI — fails on any error or warning
- `/review-skill` runs semantic review → PASS / NEEDS WORK / REWRITE
- NEEDS WORK output feeds directly into `/improve` (same table format)

### Cross-references

| From | To | Mechanism |
|---|---|---|
| /retro → /improve | Recommendations table in conversation | /improve parses section 3.7 from conversation context |
| /improve → lint-definition.py | Script invocation | Resilient path: tries ~/.claude then .claude then skips |
| /retro → retro-history.py | Script invocation | ${CLAUDE_SKILL_DIR}/scripts/ |
| /improve → retro-history.py | Script invocation | ~/.claude/skills/retro/scripts/ |
| /review-skill → /improve | NEEDS WORK output table | Same format as retro recommendations |
| /improve → /review-skill | Rewrite threshold | 5+ findings on same file → recommend /review-skill |
| orchestrator → autoresearch-analyst (retro mode) | Agent dispatch | Phase 7a, isolated context, preloaded retro + improve skills |
| orchestrator → autoresearch-analyst (improve mode) | Agent dispatch | Phase 7c, after user approves, isolated context |
| retro (single-agent) → /review-skill | Recommendation | "Rewrite signal" in single-agent-deep-dive.md |
