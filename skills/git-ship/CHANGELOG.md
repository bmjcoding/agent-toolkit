# Changelog — /git-ship

## 1.0.0 — 2026-04-07
- Initial version. Consolidated from 4 separate commands (ship, pr, merge, cleanup).
- Subcommand routing via $ARGUMENTS (pr, merge, cleanup, or default full ship).
- Shared provider detection reference (GitHub + Bitbucket DC).
- Gotchas: branch protection, gh auth, rebase conflicts, force-with-lease, worktree removal, Bitbucket token.
