# github-copilot/hooks/

GitHub Copilot hook definitions for the agent-toolkit. Each hook is a pair of files:

- `<slug>.json` — VS Code Copilot hook manifest (event binding)
- `<slug>.sh` — Shell script implementing the hook logic

## VS Code Hook Format

Hooks are loaded from `.github/hooks/*.json` (install.sh symlinks `github-copilot/hooks/` to `.github/hooks/`).

Format per the [VS Code Copilot hooks spec](https://code.visualstudio.com/docs/copilot/customization/hooks) (Preview, April 2026):

```json
{
  "hooks": {
    "<Event>": [
      {
        "type": "command",
        "command": "..."
      }
    ]
  }
}
```

Exit code semantics (same as Claude Code):

| Exit code | Meaning |
|-----------|---------|
| 0 | Continue — no intervention |
| 1 | Warn — advisory message, does not block |
| 2 | Block — denies the tool call |

## Hook Inventory

| Slug | Event | Purpose |
|------|-------|---------|
| `branch-guard` | `PreToolUse` | Block git push/commit directly to `main` or `master` |
| `changelog-check` | `PreToolUse` | Validate CHANGELOG.md was updated in commits being pushed (KaC 1.1.0) |
| `pre-push-secrets` | `PreToolUse` | Scan for secrets before git push (gitleaks + grep fallback) |
| `protect-config` | `PreToolUse` | Block writes to control-plane files (settings.json, hooks/, compatibility shims, canonical definitions) |
| `integrity-warn` | `SubagentStop` | Advisory integrity check via integrity-check.sh; warns on mismatches, never blocks |
| `toolkit-drift-check` | `SubagentStop` | Warn (once per session) when toolkit components are edited without a CHANGELOG.md update |
| `toolkit-edit-reminder` | `PostToolUse` | Remind agents editing toolkit components to update CHANGELOG.md per KaC 1.1.0 |
| `inject-context` | `SubagentStart` | Inject orchestrator project-brief and file-ownership constraints into subagents |
| `extract-handoff` | `SubagentStop` | Extract handoff JSON from agent final message, validate schema, write to .orchestrator/handoffs/ |

## Event Mapping from Claude Code

| Claude Code event | VS Code Copilot event |
|-------------------|-----------------------|
| `PreToolUse` | `PreToolUse` |
| `PostToolUse` | `PostToolUse` |
| `SubagentStart` | `SubagentStart` |
| `SubagentStop` | `SubagentStop` |

All four events are natively supported by VS Code Copilot hooks (Preview as of April 2026). No event remapping is required.

## Activation

`install.sh` creates a symlink:

```sh
ln -sfn "$REPO_DIR/github-copilot/hooks" ".github/hooks"
```

VS Code Copilot automatically loads all `.json` files from `.github/hooks/` and registers the declared hooks.

## Environment Variable

Each hook's `command` field references `$AGENT_TOOLKIT_DIR`, which must be set to the absolute path of your agent-toolkit checkout:

```sh
export AGENT_TOOLKIT_DIR=/path/to/agent-toolkit
```

Add this to your shell profile or VS Code workspace settings.
