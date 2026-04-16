# Hooks

Claude Code hooks that enforce safety and orchestration constraints. Wire these in `~/.claude/settings.json` under the `hooks` key.

## Universal (use as-is)

### `branch-guard.sh`
**Event:** `PreToolUse` on `Bash(git commit*)`, `Bash(git push*)`

Prevents commits and pushes directly to `main`/`master`. Prompts the user to create a feature branch instead. Safe default for any repo.

### `pre-push-secrets.sh`
**Event:** `PreToolUse` on `Bash(git commit*)`, `Bash(git push*)`

Scans for secrets before commits and pushes. Uses [gitleaks](https://github.com/gitleaks/gitleaks) if installed, falls back to grep patterns for common secret formats (AWS keys, private keys, tokens). Exits gracefully if neither tool is available.

### `extract-handoff.sh`
**Event:** `SubagentStop`

Extracts structured handoff JSON from a subagent's final message (fenced in ` ```handoff ` blocks) and writes it to `.orchestrator/sessions/<SESSION_ID>/handoffs/<agent_id>.json` when a valid session id is present, otherwise to the flat fallback `.orchestrator/handoffs/<agent_id>.json`. Also logs agent stop events with token/turn/duration metrics to `.orchestrator/sessions/<SESSION_ID>/logs/agents.log` when session-scoped mode is active. Exits silently when not in an orchestrator context.

### `inject-context.sh`
**Event:** `SubagentStart`

Injects orchestrator constraints into subagent context at launch: file ownership rules, protected file list, single-writer discipline, and handoff protocol. Reads the session-scoped plan from `.orchestrator/sessions/<SESSION_ID>/plan.json` when available, otherwise falls back to `.orchestrator/plan.json`. Exits silently when not in an orchestrator context.

## Template (customize per environment)

### `protect-config.sh`
**Event:** `PreToolUse` on `Bash(*)`

Blocks Bash commands that would write to Claude Code control-plane files (`settings.json`, `hooks/`, `CLAUDE.md`). This is one layer of a defense-in-depth approach:

1. **Deny patterns** in `settings.json` — catches literal string matches
2. **This hook** — regex-based write-intent detection on Bash commands
3. **Filesystem permissions** (`chmod 444` / `chflags uchg`) — the only bypass-resistant layer

**Customize before use:** The `PROTECTED` regex pattern hardcodes `~/.claude/` paths. Adjust for your directory structure. See the security assessment in the hook comments for known bypass paths (variable indirection, eval, subprocess writes).

## Wiring Example

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash(*)",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/protect-config.sh",
            "timeout": 5
          }
        ]
      },
      {
        "matcher": "Bash(git commit*)|Bash(git push*)",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/branch-guard.sh",
            "timeout": 3
          },
          {
            "type": "command",
            "command": "~/.claude/hooks/pre-push-secrets.sh",
            "timeout": 30
          }
        ]
      }
    ],
    "SubagentStart": [
      {
        "matcher": "planner|frontend-engineer|backend-engineer|...",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/inject-context.sh",
            "timeout": 5
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/extract-handoff.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

## Filesystem Hardening (recommended)

After wiring hooks, lock down control-plane files from your terminal:

```bash
chmod 444 ~/.claude/settings.json ~/.claude/CLAUDE.md ~/.claude/hooks/*.sh
# Optional (macOS): immutable flag — survives chmod attempts
chflags uchg ~/.claude/settings.json ~/.claude/CLAUDE.md ~/.claude/hooks/*.sh
```

To edit a protected file: `chflags nouchg <file> && chmod 644 <file>`, edit, then re-lock.
