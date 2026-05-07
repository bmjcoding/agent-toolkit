# scripts/

Repository maintenance scripts for generation, validation, linting, smoke checks, and
release hygiene.

## Contribution Entry Point

Before opening a pull request that touches scripts, run the repo-local Claude
contribution assistant at `.claude/agents/contribution-assistant.md`. It checks the
changed automation, updates versioned changelogs, regenerates generated assets, and runs
the local gate.

## Ownership

- Root `scripts/` contains repo-level automation used by local checks and CI.
- Prefer deterministic scripts that can run locally and in CI without tool-specific state.
- Keep generated output checks idempotent: repeated `npm run ci`
  should leave a clean working tree.
- Repo-level script behavior changes are tracked in the root `CHANGELOG.md` unless a
  script clearly belongs to a component with its own changelog.

## Component Evals

- `run-component-evals.py` executes schema-backed eval files under
  `skills/**/evals/evals.json` and `agents/**/evals/evals.json`.
- Legacy prose-only eval files are skipped during migration. Executable eval files
  declare `schema_version: 1` and must use one of the runner-supported deterministic
  eval types.
