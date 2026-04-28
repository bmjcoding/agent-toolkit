---
name: recon
description: >
  Pre-planner repository reconnaissance for multi-repo toolkit pipelines. Reports
  branch status, hook registration, working-tree state, changelog versions, and
  any other operational facts the planner needs before producing plan.json.
lifecycle: stable
---

# Recon

Pre-planner reconnaissance, especially multi-repo toolkit pipelines. This skill is
loaded by `autoresearch-analyst` when dispatched in `recon mode` or
`pre-planner recon`.

## Workflow

1. Read the repo paths or repo names from the dispatch prompt.
2. Collect the requested operational checklist items:
   - Branch status in each repo (`git status -b` and `git log --oneline origin/main..HEAD`)
   - Hook registration state (paths in `settings.json`, layout flat vs subdirectory)
   - Working-tree state (`git status` per repo)
   - Changelog versions (latest `## [X.Y.Z]` header for every relevant component)
   - Any other pre-planner facts the prompt names
3. Write the requested report file under the orchestrator session context when the
   prompt provides a path.
4. Report confirmed items and explicit gaps. Do not fall back to on-demand target review.

## Required Output Checklist (multi-repo toolkit pipelines)

When dispatched for multi-repo pipelines, the recon output **must** confirm all of:

1. Current hook paths in `settings.json` (flat vs subdirectory layout)
2. `settings.json` hook registration state for every relevant hook event
   (SubagentStop, PreToolUse, PostToolUse, etc.)
3. Uncommitted file changes in both repos (`git status` in each)
4. Branch status in both repos vs origin (`git status -b` or
   `git log --oneline origin/main..HEAD` in each)
5. Current version of each target component's `CHANGELOG.md` (name + latest version
   header)

If any item cannot be confirmed, list it as an explicit gap. Do not guess.

## Handoff

```handoff
{
  "mode": "recon",
  "repos": ["repo-a", "repo-b"],
  "checklist_confirmed": ["item 1", "item 2"],
  "gaps": ["item 3 could not be confirmed"],
  "report_file": ".orchestrator/sessions/$SID/context/autoresearch-recon.md"
}
```
