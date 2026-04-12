# OpenAI Codex Hooks

Experimental hooks ported from the Claude Code hook sources in
[`claude-code/hooks/`](../../claude-code/hooks/).

## Status

Codex hooks are **experimental** and require an opt-in feature flag:

```toml
# ~/.codex/config.toml
[features]
codex_hooks = true
```

Without this flag the hooks directory and `hooks.json` are ignored.

## Supported events and matchers

Only **Bash** commands are currently supported for `PreToolUse` and `PostToolUse`
matchers in the Codex CLI hook system. `Edit` and `Write` matchers are listed in
`hooks.json` for forward compatibility but may not fire in all Codex versions —
validate in your environment.

| Event | Supported matchers |
|---|---|
| `PreToolUse` | `Bash` (confirmed), `Edit`, `Write` (experimental) |
| `PostToolUse` | `Bash` (confirmed), `Edit`, `Write` (experimental) |
| `UserPromptSubmit` | `*` |
| `Stop` | `*` |
| `SessionStart` | `*` (empty in this release) |

## How to install

1. Create the hooks directory if it does not exist:

   ```bash
   mkdir -p ~/.codex/hooks
   ```

2. Copy the hook scripts:

   ```bash
   cp openai-codex/hooks/*.sh ~/.codex/hooks/
   chmod +x ~/.codex/hooks/*.sh
   ```

3. Copy the registry:

   ```bash
   cp openai-codex/hooks/hooks.json ~/.codex/hooks.json
   ```

4. Enable the feature flag in `~/.codex/config.toml` (see above).

5. Verify by running Codex and checking that hook output appears.

## Hooks in this release

| Script | Codex event | Matcher | Purpose |
|---|---|---|---|
| `branch-guard.sh` | `PreToolUse` | `Bash` | Block direct pushes to main/master |
| `changelog-check.sh` | `PreToolUse` | `Bash` | Enforce CHANGELOG.md updates before git push |
| `extract-handoff.sh` | `Stop` | `*` | Extract and validate handoff JSON from agent final message |
| `inject-context.sh` | `UserPromptSubmit` | `*` | Inject orchestrator project-brief and constraints |
| `integrity-warn.sh` | `PostToolUse` | `Bash\|Edit\|Write` | Advisory integrity check after tool use |
| `pre-push-secrets.sh` | `PreToolUse` | `Bash` | Secrets scan (gitleaks or grep fallback) before git push |
| `protect-config.sh` | `PreToolUse` | `Bash` | Block writes to control-plane files |
| `toolkit-drift-check.sh` | `Stop` (or `PostToolUse`) | `*` | Warn when components edited without CHANGELOG update |
| `toolkit-edit-reminder.sh` | `PreToolUse` | `Edit\|Write` | Remind agents to update CHANGELOG.md per KaC 1.1.0 |

## Known caveats

- **Windows not supported**: Hook script execution relies on a POSIX shell
  (`/usr/bin/env bash`). Codex hooks do not run on Windows.

- **Stdin payload schema**: These scripts were written for the Claude Code hook
  stdin payload format (e.g., `.tool_name`, `.tool_input.command`,
  `.tool_input.file_path`, `.agent_id`, `.last_assistant_message`). Codex may
  use different field names. Each script contains a comment noting which fields
  it reads — check and update the `jq` expressions if Codex differs.

- **Claude-specific env vars**: `toolkit-drift-check.sh` reads
  `$CLAUDE_SESSION_ID` for per-session dedup. Substitute the equivalent Codex
  session ID env var if one exists, or accept the PID-based fallback.
  `protect-config.sh` guards `~/.claude/` paths — if your Codex install uses a
  different config dir (e.g., `~/.codex/`), extend the `PROTECTED` regex
  accordingly.

- **`changelog-check.sh`** was originally a `git pre-push` hook invoked with
  positional args and refs on stdin. In Codex `PreToolUse` context, the script
  receives a JSON payload instead. The core validation logic is preserved; a
  thin wrapper to inspect the JSON payload for push commands is needed for full
  integration.

- **`integrity-warn.sh`** delegates to `integrity-check.sh` at
  `../integrity-check.sh` relative to the hooks directory. This script is not
  included in the Codex port. Place it at `~/.codex/integrity-check.sh` and
  make it executable, or update `INTEGRITY_SCRIPT` in the hook.

## Behavioral reference

For authoritative behavior documentation, read the Claude Code hook sources:

```
claude-code/hooks/branch-guard/branch-guard.sh
claude-code/hooks/changelog-check/changelog-check.sh
claude-code/hooks/extract-handoff/extract-handoff.sh
claude-code/hooks/inject-context/inject-context.sh
claude-code/hooks/integrity-warn/integrity-warn.sh
claude-code/hooks/pre-push-secrets/pre-push-secrets.sh
claude-code/hooks/protect-config/protect-config.sh
claude-code/hooks/toolkit-drift-check/toolkit-drift-check.sh
claude-code/hooks/toolkit-edit-reminder/toolkit-edit-reminder.sh
```
