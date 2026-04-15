# OpenAI Codex Hooks

Experimental hooks adapted for the OpenAI Codex CLI hook surface.

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

- **Stdin payload schema**: These scripts read JSON from stdin and currently
  expect fields such as `.tool_name`, `.tool_input.command`,
  `.tool_input.file_path`, `.agent_id`, and `.last_assistant_message`. Verify
  those field names against your Codex version and update the `jq` expressions
  if the payload shape differs.

- **Session/config paths**: `toolkit-drift-check.sh` reads
  `$CLAUDE_SESSION_ID` as a compatibility fallback for per-session dedup.
  Replace it with the equivalent Codex session env var if one exists, or use
  the PID fallback. `protect-config.sh` guards compatibility shims and
  canonical toolkit paths by default; extend the `PROTECTED` regex if your
  Codex install uses additional config directories.

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

For implementation details, inspect the corresponding shell scripts in this
directory and the shared integrity helper at
[`openai-codex/scripts/integrity-check.sh`](../scripts/integrity-check.sh).
