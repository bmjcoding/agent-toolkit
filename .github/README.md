# .github/

GitHub repository automation, review templates, ownership metadata, and CI workflows.

## Contribution Entry Point

Before opening a pull request that touches GitHub automation, run the repo-local Claude
contribution assistant at `.claude/agents/contribution-assistant.md`. It checks changed
workflow and template files, updates versioned changelogs, regenerates generated assets,
and runs the local gate.

## Ownership

- `.github/workflows/` contains CI jobs for linting, generated asset validation, smoke
  checks, reference integrity, and secret scanning.
- `.github/PULL_REQUEST_TEMPLATE.md` and `.github/ISSUE_TEMPLATE/` define contributor
  intake surfaces.
- `.github/CODEOWNERS` defines review ownership.
- Repo-level GitHub automation changes are tracked in the root `CHANGELOG.md`.
