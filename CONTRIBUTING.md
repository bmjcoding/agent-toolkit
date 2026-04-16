# Contributing to agent-toolkit

## Repository structure

```text
agent-toolkit/
  agents/          # Canonical shared agent instruction bodies
  skills/          # Canonical shared skills
  rules/           # Canonical shared rules
  workflows/       # Canonical shared workflow definitions
  claude-code/     # Claude-native assets
  github-copilot/  # VS Code Copilot-native assets
  openai-codex/    # Codex-native assets
  AGENTS.md        # Primary shared instructions
  CLAUDE.md        # One-line Claude compatibility shim: @AGENTS.md
```

## Ownership rules

- Put shared, editable agent content in `agents/`.
- Put shared, editable skill content in `skills/`.
- Put shared, editable rule content in `rules/`.
- Put shared, editable workflow content in `workflows/`.
- Put tool-native runtime assets in the matching tool directory.
- Treat adapters and generated copies as replaceable surfaces; do not make them the
  canonical editing location.

## Branching

- Work from `main` on short-lived branches.
- Keep shareable content at the repo root.
- Keep tool-specific behavior inside its own tool directory.
- Edit shared agent definitions in `agents/<slug>/AGENT.md` and shared workflows in
  `workflows/<slug>/WORKFLOW.md`.
- Edit shared rule definitions in `rules/<slug>/<slug>.md`.
- Regenerate adapters with `node scripts/sync-canonical-adapters.js` and the catalog with
  `node scripts/generate-index.js` after editing those canonical definitions.
- Smoke-test the full generation flow with `node scripts/smoke-generated-assets.js`.
- CI also re-runs both generators when canonical `agents/`, `workflows/`, or `rules/`
  files change, and when indexed shared assets such as skills, hooks, or Claude bundles
  change.
- Pull requests fail if generated agent/workflow/rule surfaces or `index.json` are stale.
- Pushes to branches auto-commit regenerated tool surfaces and `index.json` back to the
  branch when needed.

## Commit style

Use [Conventional Commits](https://www.conventionalcommits.org/):
`type(scope): short description`

Common scopes: `skills`, `rules`, `claude-code`, `github-copilot`, `openai-codex`,
`docs`, `chore`.

## Component versioning

Each component owns its own `CHANGELOG.md`.

- Shared skills: `skill/<slug>-v<version>`
- Shared rules: `rule/<slug>-v<version>`
- Shared agents: `agent/<slug>-v<version>`
- Shared workflows: `workflow/<slug>-v<version>`
- Tool-specific assets:
  - `claude-code/<slug>-v<version>`
  - `github-copilot/<slug>-v<version>`
  - `openai-codex/<slug>-v<version>`

Root skill and root rule changelogs are canonical. Tool-specific changelogs should describe
adapter/runtime changes only.

## Install scripts

Test installer changes with `--dry-run` and `--check` before merging:

```bash
./claude-code/scripts/install.sh --dry-run
./claude-code/scripts/install.sh --check
./github-copilot/scripts/install.sh --target /tmp/example --dry-run
./openai-codex/scripts/install.sh --dry-run
```

## Linting

Before opening a pull request, run:

```sh
npm ci
npm run lint
npm run lint:py
```

If you want auto-fixes where available, run:

```sh
npm run lint:fix
npm run lint:py:fix
```

## Pull requests

- Link the relevant ADR if architecture changed.
- Update the affected canonical `CHANGELOG.md`.
- If you change ownership or discovery behavior, update the README and install docs in the
  same pull request.
