#!/usr/bin/env bash
# Ported from claude-code/hooks/inject-context/inject-context.sh for Codex CLI hooks (experimental)
# Requires: features.codex_hooks=true in ~/.codex/config.toml
# Note: Codex hooks stdin payload schema may differ from Claude Code's; validate in your environment.
#
# Claude Code env vars used: none directly — reads .orchestrator/ filesystem state.
# Codex mapping: UserPromptSubmit (closest equivalent to SubagentStart / context injection)
# Uncertainty: Codex may not have a SubagentStart event; UserPromptSubmit is the nearest
# equivalent for injecting context at the start of each interaction. If Codex adds a
# SessionStart event, re-wire this hook there for once-per-session semantics.
#
# Original purpose: SubagentStart hook — inject orchestrator project-brief and constraints
# into subagents so they understand file ownership and handoff protocol.
set -uo pipefail

# If .orchestrator/session.id exists and is valid, use .orchestrator/sessions/$SID/ layout;
# otherwise fall back to flat .orchestrator/ layout.
SID=$(cat .orchestrator/session.id 2>/dev/null)
if [[ -n "$SID" && "$SID" =~ ^[0-9]{8}T[0-9]{6}$ ]]; then
  ORCH_BASE=".orchestrator/sessions/$SID"
else
  if [[ -n "$SID" ]]; then
    # Log invalid SID format for operational visibility
    echo "$(date -Iseconds) session_id_invalid sid=$SID reason=unexpected_format fallback=flat" >> .orchestrator/logs/agents.log 2>/dev/null || true
  fi
  ORCH_BASE=".orchestrator"
fi

BRIEF="$ORCH_BASE/context/project-brief.md"

CONSTRAINTS=$(cat <<'RULES'
## Orchestrator Constraints
- **File Ownership**: Write only to files listed in your `owned_files`. If another subtask's file needs a change, note it in handoff `notes` — do not modify it.
- **Protected Files**: Never modify: lockfiles (package-lock.json, yarn.lock, uv.lock, Cargo.lock, poetry.lock), CI/CD configs (.github/workflows/**, Jenkinsfile, .circleci/**, .gitlab-ci.yml), database migrations (migrations/**, alembic/**, db/migrate/**). If a fix requires changing these, set `status` to `needs_human` and note the required change.
- **Single-Writer Rule**: Before modifying any source file, run: `ls -t .orchestrator/handoffs/*.json 2>/dev/null | head -10`. If another agent's handoff lists the same file in `files_written`, do NOT modify it — report the conflict instead.
- **Handoff Protocol**: Your structured results MUST appear in your final message as a fenced ```handoff JSON block. A SubagentStop hook writes it to `.orchestrator/handoffs/`. Do not write handoff files yourself.
RULES
)

if [[ -f "$BRIEF" ]]; then
  jq -n --arg ctx "$CONSTRAINTS" '{
    hookSpecificOutput: {
      additionalContext: ("Orchestrator context available. Read .orchestrator/context/project-brief.md for project overview and .orchestrator/plan.json for task decomposition.\n\n" + $ctx)
    }
  }'
else
  # No project-brief yet (e.g., Phase 0 exploration agents) — still inject constraints
  jq -n --arg ctx "$CONSTRAINTS" '{
    hookSpecificOutput: {
      additionalContext: $ctx
    }
  }'
fi
