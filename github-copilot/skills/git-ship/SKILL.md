---
name: git-ship
description: >
  Git shipping workflow — commit, push, open PRs, enable auto-merge, and clean up worktrees.
  Use when the user wants to ship code, open a PR, merge, or clean up branches.
---

# Git Ship

Unified git shipping workflow. Subcommand is inferred from `$ARGUMENTS`:

| Argument starts with | Action |
|---|---|
| `pr` | Push + open PR only |
| `merge` | Enable auto-merge on existing PR |
| `cleanup` | Remove current worktree and branch |
| `--force` (standalone) | **Guard**: warn "Did you mean `cleanup --force`?" and stop — do not route to Full Ship |
| *(anything else or empty)* | Full ship: commit + push + open PR + optional auto-merge |

Read `references/provider-detection.md` for GitHub vs Bitbucket DC API patterns. All commands are provider-aware.

## Shared Context

```
Remote URL: !`git remote get-url origin 2>/dev/null`
Current branch: !`git branch --show-current`
Default branch: !`git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||' || echo "main"`
```

On any failure, stop and report the error so the user can resume.

---

## Full Ship *(default)*

**Pre-flight guard**: abort if current branch equals the default branch. Full Ship must not run on the default branch — use a feature branch.

**Performance**: Minimize tool calls. Batch independent commands as parallel Bash calls. Chain dependent commands with `&&`. Target 4 or fewer total tool calls.

### Call 1 (parallel)

1. **Auth + worktree prune**: verify provider auth, `git worktree prune`
2. **Merged PRs + remote branches** (for cleanup): fetch merged PR branch names and remote branch list
3. **Stale local branch cleanup**: for each local branch with upstream `gone` — skip if current branch, remove worktree if exists, delete branch

### Call 2 (parallel)

1. **Delete stale remote branches** (if any from Call 1): `git push origin --delete <branches>` — exclude default, current, `release/*`, `hotfix/*`
2. **Commit** (skip if clean): stage changed files specifically (never `git add -A`), generate message matching repo style, append `Co-Authored-By: Claude <noreply@anthropic.com>`. Exclude sensitive files (`.env`, `*.key`, `*.pem`, `credentials.*`)

**Empty-branch guard**: after Call 2, if no commit was created (working tree was already clean) and the branch has 0 commits ahead of the default branch, report "Nothing to ship" and stop. Do not proceed to Call 3.

### Call 3 (sequential chain)

Rebase on default branch + push + check for existing PR:
```bash
git fetch origin <default> && git rebase origin/<default> && git push --force-with-lease --force-if-includes -u origin HEAD
```
If rebase conflicts: `git rebase --abort`, report conflicting files, stop.

### Call 4 (if no existing PR)

Create PR. Parse branch/commits for issue refs (`#\d+`). See `references/provider-detection.md` for provider-specific create commands. Pass `--draft` from `$ARGUMENTS` if present.

**Auto-merge** (only if `--auto-merge` and not `--draft`): enable via provider API. See `references/provider-detection.md`.

### Output format

```
| Item | Value |
|---|---|
| Commit | SHA |
| PR | URL (or "existing: URL") |
| Auto-merge | enabled / not requested / not supported |
| Branches pruned | list or "none" |
```

---

## PR Only *(when $ARGUMENTS starts with `pr`)*

Remaining arguments after `pr` are passed through (e.g., `pr --draft --title "Fix auth"`).

1. **Pre-flight**: verify auth, abort if on default branch, check for existing open PR — if exists, report URL and stop
2. **Rebase and push**: fetch, rebase on default, push with `--force-with-lease --force-if-includes`
3. **Create PR**: parse issue refs from branch/commits, create via provider API

Report the PR URL.

---

## Merge *(when $ARGUMENTS starts with `merge`)*

Remaining arguments: `--squash | --rebase | --merge`, `--pr-number N`.

1. **Resolve PR**: use `--pr-number` if provided, otherwise find PR for current branch
2. **Enable auto-merge**: see `references/provider-detection.md` for provider-specific flow. If repo doesn't support auto-merge, report and stop.

---

## Cleanup *(when $ARGUMENTS starts with `cleanup`)*

Remaining arguments: `--force`.

1. **Validate**: abort if current directory is the main checkout (not a worktree). Record worktree path, branch, main repo path.
2. **Check PR status** (skip if `--force`): verify PR for this branch is merged. If not merged and no `--force`, warn and stop.
3. **Remove**: kill processes using the worktree, `cd` to main repo, `git worktree remove`, `git branch -D`, `git worktree prune`. Report what was removed.

---

## Gotchas

- **Push rejected by branch protection**: report the protection rule, don't bypass. The user may need to add reviewers or wait for CI.
- **`gh` not authenticated**: if `gh auth status` fails, report it and stop. Don't fall back to raw git for PR creation — the user needs to run `gh auth login`.
- **Rebase conflicts on stale branches**: always `git rebase --abort` on conflict, report the conflicting files. Never force-resolve.
- **`--force-with-lease` fails**: this means someone else pushed to the branch. Report it — don't escalate to `--force`.
- **Worktree removal on current branch**: `git worktree remove` fails if you're inside the worktree. The cleanup flow handles this by `cd`-ing to main repo first.
- **Bitbucket DC token expired**: `curl` calls return 401. Report "BITBUCKET_TOKEN may be expired" rather than generic "request failed."
- **`--auto-merge` on repos with no required status checks**: the PR may merge immediately after creation. Before enabling auto-merge, warn the user: "This repo has no required status checks — enabling auto-merge may merge the PR instantly."

$ARGUMENTS
