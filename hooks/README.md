# Hooks

Root `hooks/` is the canonical shared owner for hook logic and per-hook changelogs.
Tool directories keep the runtime-specific adapter surfaces they need:

- `claude-code/hooks/` for Claude install wiring and examples
- `github-copilot/hooks/` for VS Code Copilot manifests plus any payload adapters
- `openai-codex/hooks/hooks.json` for the Codex registry plus any payload adapters

## Layout

Each logical hook lives under:

```text
hooks/<slug>/<slug>.sh
hooks/<slug>/CHANGELOG.md
```

Generated tool-local adapters can be refreshed with:

```sh
node scripts/sync-canonical-adapters.js --hooks
```

## Canonical Set

These canonical scripts are seeded from the current tool-local implementations described
in `docs/adr/0009-root-hooks-ownership.md`:

- Seeded from Claude: `changelog-check`, `protect-config`
- Seeded from an existing current copy: `branch-guard`, `extract-handoff`, `inject-context`, `integrity-warn`, `pre-push-secrets`

Root `hooks/` is the final canonical shared layer. Copilot and Codex adapters remain
intentionally tool-local because their runtime payloads and event semantics differ.

## Execution Contracts

| Hook | Canonical intent | Shared script contract | Adapter note |
|---|---|---|---|
| `branch-guard` | Block `git commit` / `git push` on protected branches | No stdin required; runtime should self-filter to relevant Bash commands | Copilot/Codex payload filtering still belongs in tool-local adapters if matcher semantics are insufficient |
| `changelog-check` | Enforce changelog/tag policy before shipping | Current seeded logic is still the git pre-push style implementation | Copilot/Codex should keep a tool-local adapter until they have a safe command-to-range mapping |
| `extract-handoff` | Extract fenced handoff JSON and append agent-stop logs | Consumes agent-stop style JSON on stdin | Keep adapters where event names or payload fields differ |
| `inject-context` | Inject orchestrator guidance into subagents/sessions | No payload required today | Safe to share once adapter output semantics are confirmed |
| `integrity-warn` | Run non-blocking integrity verification | No payload required | Adapter should select the tool-specific `scripts/integrity-check.sh` when needed |
| `pre-push-secrets` | Scan for secrets before commit/push | No stdin required; runtime should self-filter to relevant Bash commands | Copilot/Codex payload filtering still belongs in tool-local adapters if matcher semantics are insufficient |
| `protect-config` | Deny writes to control-plane files | Expects a Bash-style command payload | Copilot/Codex should normalize payload fields before delegating |

## Notes

- The root scripts are canonical source now, and Copilot/Codex adapters are generated
  runtime surfaces rather than temporary duplicates.
- Root hook changelogs are intentionally seeded with Phase 1 ownership notes. Historical
  release continuity still lives in the existing tool-local changelog redirects where the
  migration preserved prior history.
