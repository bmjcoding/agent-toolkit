# claude-code/rules/

Generated Claude-facing rule adapters.

## Ownership

- Canonical rule content lives in repo-root `rules/`.
- `claude-code/rules/<slug>/<slug>.md` is generated from that canonical source by
  `node scripts/sync-canonical-adapters.js`.
- Do not hand-edit generated rule adapters; edit the root rule and regenerate instead.

## Install Surface

`claude-code/scripts/install.sh` points `~/.claude/rules` at this directory so Claude
receives a tool-local, adapter-shaped rule surface while root `rules/` remains the single
source of truth.
