# github-copilot/hooks/

GitHub Copilot hook adapter components for the agent-toolkit.

## Source layout

Canonical shared hook logic now lives under repo-root `hooks/`. The Copilot subtree keeps
the tool-facing manifests plus any tool-local adapters required by VS Code Copilot's
payload semantics.

Each logical hook still lives in its own adapter directory:

- `github-copilot/hooks/<slug>/<slug>.json` — VS Code Copilot manifest
- `github-copilot/hooks/<slug>/<slug>.sh` — generated Copilot adapter

This keeps the repo aligned with the shared per-hook component layout while still
preserving the flat install surface Copilot expects.

## Installed layout

VS Code Copilot discovers hooks from flat manifest files under `.github/hooks/*.json`.
The installer now creates `.github/hooks/` as a real directory and symlinks each nested
manifest into that flat location:

```text
.github/hooks/branch-guard.json        -> github-copilot/hooks/branch-guard/branch-guard.json
.github/hooks/changelog-check.json     -> github-copilot/hooks/changelog-check/changelog-check.json
...
```

Each manifest then invokes its paired adapter script from the toolkit checkout via
`$AGENT_TOOLKIT_DIR/github-copilot/hooks/<slug>/<slug>.sh`. Those adapters are generated
from the canonical root hook set and delegate to `hooks/<slug>/`.

Refresh them with:

```sh
node scripts/sync-canonical-adapters.js --hooks
```

## VS Code Hook Format

Manifest shape:

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

Exit code semantics:

| Exit code | Meaning |
|-----------|---------|
| 0 | Continue — no intervention |
| 1 | Warn — advisory message, does not block |
| 2 | Block — denies the tool call |

## Hook Inventory

GitHub Copilot does not have more logical hooks than Claude here. The apparent
"abundance" came from storing both a manifest and an adapter script side by side for each
of the same shared hooks.

| Slug | Event | Purpose |
|------|-------|---------|
| `branch-guard` | `PreToolUse` | Block git push or commit directly to `main` or `master` |
| `changelog-check` | `PreToolUse` | Validate `CHANGELOG.md` was updated in commits being pushed |
| `pre-push-secrets` | `PreToolUse` | Scan for secrets before git push |
| `protect-config` | `PreToolUse` | Block writes to control-plane files |
| `integrity-warn` | `SubagentStop` | Advisory integrity check via `integrity-check.sh`; never blocks |
| `inject-context` | `SubagentStart` | Inject orchestrator project brief and ownership constraints |
| `extract-handoff` | `SubagentStop` | Extract handoff JSON from the agent final message into the session-scoped handoff directory, with flat fallback semantics when no valid session id exists |

## Environment Variable

Each manifest expects `AGENT_TOOLKIT_DIR` to point at the toolkit checkout:

```sh
export AGENT_TOOLKIT_DIR=/path/to/agent-toolkit
```
