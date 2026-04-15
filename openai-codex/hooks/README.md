# OpenAI Codex Hooks

Experimental hooks adapted for the OpenAI Codex CLI hook surface.

## Source layout

- `hooks/<slug>/<slug>.sh` — canonical shared hook logic
- `openai-codex/hooks/hooks.json` — Codex hook registry
- `openai-codex/hooks/<slug>/<slug>.sh` — generated Codex adapter where needed

The Codex public surface stays centered on the single `hooks.json` registry. Tool-local
shell files remain only where Codex still needs adapter behavior instead of a direct call
to the shared root script.

## Status

Codex hooks are **experimental** and require an opt-in feature flag:

```toml
[features]
codex_hooks = true
```

## How to install

Preferred:

```sh
bash openai-codex/scripts/install.sh
```

Manual wiring:

1. Point `AGENT_TOOLKIT_DIR` at this repo checkout.
2. Symlink or copy `openai-codex/hooks/hooks.json` to `~/.codex/hooks.json`.
3. Enable `features.codex_hooks = true` in `~/.codex/config.toml`.

The shared hook scripts stay in the repo under `hooks/<slug>/`. Generated Codex adapters,
where still needed, remain under `openai-codex/hooks/<slug>/`; do not copy a flat `*.sh`
set into `~/.codex/hooks/`.

Refresh the generated adapters and registry with:

```sh
node scripts/sync-canonical-adapters.js --hooks
```

## Supported events and matchers

Only `Bash` is confirmed for `PreToolUse` and `PostToolUse`. This repo keeps the active
Codex registry aligned to that documented limitation instead of assuming Claude-style
`Edit` or `Write` parity.

| Event | Supported matchers |
|---|---|
| `PreToolUse` | `Bash` |
| `PostToolUse` | `Bash` |
| `UserPromptSubmit` | `*` |
| `Stop` | `*` |
| `SessionStart` | `*` (empty in this release) |

## Hooks in this release

| Hook | Codex event | Matcher | Purpose |
|---|---|---|---|
| `branch-guard` | `PreToolUse` | `Bash` | Block direct pushes to `main` or `master` |
| `changelog-check` | `PreToolUse` | `Bash` | Enforce changelog updates before git push |
| `extract-handoff` | `Stop` | `*` | Extract and validate handoff JSON from the final message |
| `inject-context` | `UserPromptSubmit` | `*` | Inject orchestrator project brief and constraints |
| `integrity-warn` | `PostToolUse` | `Bash` | Advisory integrity check after tool use |
| `pre-push-secrets` | `PreToolUse` | `Bash` | Secrets scan before git push |
| `protect-config` | `PreToolUse` | `Bash` | Block writes to control-plane files |

## Known caveats

- Windows is not supported because hook execution relies on POSIX shell scripts.
- Generated adapter scripts still expect a Codex JSON stdin payload. Verify field names in your local Codex build if a hook appears inert.
- `integrity-warn` ultimately delegates to [`openai-codex/scripts/integrity-check.sh`](../scripts/integrity-check.sh).
