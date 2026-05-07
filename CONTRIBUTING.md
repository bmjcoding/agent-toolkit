# Contributing to agent-toolkit

## Repository structure

```text
agent-toolkit/
  agents/          # Canonical shared agent instruction bodies
  skills/          # Canonical shared skills, categorized as skills/<category>/.../<slug>/
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
  files change, and when indexed shared assets such as skills, root hooks, or root bundles
  change.
- Pull requests fail if generated agent/workflow/rule surfaces, generated hook adapters,
  or `index.json` are stale.
- Pushes to branches auto-commit regenerated tool surfaces and `index.json` back to the
  branch when needed.

## Contribution assistant

Claude contributors should use the repo-local `.claude/agents/contribution-assistant.md`
agent before committing or opening a pull request. It reviews and improves changed
definitions, applies the toolkit-specific changelog policy, regenerates generated
assets, and runs local validation.

The companion `.claude/skills/contribution-changelog/SKILL.md` skill is intentionally
toolkit-specific: contribution PRs add a versioned changelog section immediately instead
of staging entries under `[Unreleased]`.

The repo-local `.claude/skills/definition-review` and `.claude/skills/improve` entries are
symlinks to the canonical shared skills under `skills/self-improvement/`, so the
assistant does not require a prior global `~/.claude/skills` install.

## Contributing an existing skill

Most contributors will already have a skill folder or `SKILL.md` before they open a
toolkit contribution. Treat these as candidate skills, not finished contributions.
Prefer using the contribution assistant to import, audit, improve, and validate the skill
instead of manually copying generated or tool-specific wrappers.

Before prompting the assistant, put the existing skill somewhere in the checkout or paste
the skill contents into the conversation. Include the intended category, slug, target
users, expected inputs, and any files that must stay bundled with the skill.

Recommended prompt:

```text
Use .claude/agents/contribution-assistant.md to import the existing skill at
<path-or-pasted-content> into this repository.

Target:
- canonical path: skills/<category>/.../<slug>/
- skill name: <slug>
- intended users/tasks: <what this skill helps an agent do>
- expected inputs: <body/path/options or "none">
- portability: keep it portable across Claude, Codex, and Copilot unless a
  platform-specific surface is unavoidable

Please treat this as a candidate skill, not a finished contribution. Normalize it to
agent-toolkit conventions, preserve the skill's intent, improve the skill authoring
quality before final validation, move detailed reference content into references/ only
when it improves progressive disclosure, add or update CHANGELOG.md, run
definition-review, apply fixes until the review passes or progress stalls, then run
npm run ci. Report any behavior changes you made.
```

For a quick import where the category can be inferred:

```text
Use .claude/agents/contribution-assistant.md to prepare my existing skill in <path> for
contribution. Choose the appropriate skills/<category>/ path, preserve the intent,
standardize it for this toolkit, rigorously improve it with definition-review/improve
before CI validation, update the changelog, and run npm run ci.
```

Manual contributors should apply the same rules: edit only the canonical
`skills/<category>/.../<slug>/` source, prefer a portable `## Inputs` section over
tool-specific argument metadata, keep `SKILL.md` concise, put detailed reference material
under `references/`, run `definition-review` and fix findings before the final gate, add a
versioned `CHANGELOG.md` entry, and finish with `npm run ci`.

## Commit style

Use [Conventional Commits](https://www.conventionalcommits.org/):
`type(scope): short description`

Common scopes: `skills`, `rules`, `claude-code`, `github-copilot`, `openai-codex`,
`docs`, `chore`.

Commits must be GPG-signed. The repository's branch protections expect signed commits,
so verify your signing key is configured before opening the pull request.

## Component versioning

Each component owns its own `CHANGELOG.md`. Versions live in changelog section headers,
for example `## [1.2.3] - 2026-04-28`; release tags are not required.

Root skill and root rule changelogs are canonical. Tool-specific changelogs should describe
adapter/runtime changes only.

### Which changelog?

| If you change... | Update... |
|---|---|
| `agents/<name>/...` | `agents/<name>/CHANGELOG.md` |
| `skills/<category>/.../<name>/...` | that skill's `CHANGELOG.md` |
| `rules/<name>/...` | `rules/<name>/CHANGELOG.md` |
| `workflows/<name>/...` | `workflows/<name>/CHANGELOG.md` |
| `hooks/<name>/...` | `hooks/<name>/CHANGELOG.md` |
| generated adapters only | the canonical source component changelog |
| generator, CI, install, catalog, or contributor policy | root `CHANGELOG.md` |

Do not use `[Unreleased]` for toolkit contributions. Add a new top version section
(`## [X.Y.Z] - YYYY-MM-DD`) to every touched component changelog and bump SemVer in the
same pull request.

## Install scripts

Test installer changes with `--dry-run` and `--check` before merging:

```bash
./claude-code/scripts/install.sh --dry-run
./claude-code/scripts/install.sh --check
bash github-copilot/scripts/install.sh --target /tmp/example --dry-run
./openai-codex/scripts/install.sh --dry-run
```

## Linting

Before opening a pull request, run:

```sh
npm ci
npm run ci
```

`npm ci` installs the pinned Node dependencies. `npm run ci` runs the local validation
gate, including generated asset sync, linting, definition checks, smoke tests, whitespace
checks, and the repository secret scan.

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
