# Claude Toolkit

A collection of Claude Code slash commands, agents, skills, hooks, and rules for the Frankenstein orchestration pipeline.

## Commands

### `/backlog`

View and manage the pipeline backlog. The backlog uses a unified 12-column schema shared between the `/backlog` slash command (`.claude/backlog.md`) and the Frankenstein orchestration pipeline (`.orchestrator/backlog.md`).

**Columns**: `# | status | severity | environment | file | item | reason | source | finding_id | phase | added_at | session_id`

**Status values**: `open`, `in-progress`, `deferred-env`, `deferred-session`, `blocked`, `resolved`, `wont-fix`

**Common usage**:
- `/backlog` — display all backlog items
- `/backlog --open` — show only open and blocked items
- `/backlog --resolve N` — mark item N resolved (row retained until `--clear-resolved`)
- `/backlog --env work` — filter to items workable in the work environment
- `/backlog --sync` — sync backlog between `.claude/backlog.md` and `.orchestrator/backlog.md`

See [`commands/backlog/backlog.md`](commands/backlog/backlog.md) for the full command reference and [`docs/backlog-migration-guide.md`](docs/backlog-migration-guide.md) for migrating existing backlog files.
