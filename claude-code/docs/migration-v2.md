# Migration Guide: claude-toolkit v1 → agent-toolkit v2

This guide covers upgrading a local install from the old flat `claude-toolkit` layout to the new per-tool `agent-toolkit` layout. The restructure is a breaking change because the symlink targets move. You must run the steps below to restore a working Claude Code install.

For the rationale behind the restructure, see [ADR 0005](adr/0005-multi-tool-restructure.md).

---

## What Changed

### Before (v1)

Your `~/.claude/` symlinks pointed into the root of the `claude-toolkit` repo:

```
~/.claude/agents    -> /path/to/claude-toolkit/agents
~/.claude/commands  -> /path/to/claude-toolkit/commands
~/.claude/docs      -> /path/to/claude-toolkit/docs
~/.claude/hooks     -> /path/to/claude-toolkit/hooks
~/.claude/rules     -> /path/to/claude-toolkit/rules
~/.claude/skills    -> /path/to/claude-toolkit/skills
```

All six directories lived at the repo root.

### After (v2)

The repository is renamed to `agent-toolkit`. Claude Code-specific content moves to `claude-code/`. Skills move to `shared/skills/` (single source of truth shared across tools).

```
~/.claude/agents    -> /path/to/agent-toolkit/claude-code/agents
~/.claude/commands  -> /path/to/agent-toolkit/claude-code/commands
~/.claude/docs      -> /path/to/agent-toolkit/claude-code/docs
~/.claude/hooks     -> /path/to/agent-toolkit/claude-code/hooks
~/.claude/rules     -> /path/to/agent-toolkit/claude-code/rules
~/.claude/skills    -> /path/to/agent-toolkit/shared/skills
```

---

## Upgrade Steps

### Step 1 — Pull the restructured repo

```bash
cd /path/to/agent-toolkit   # or whatever your local clone is named
git pull
```

If your local clone is still named `claude-toolkit`, the directory name does not need to change — the symlink targets are what matter. The GitHub remote URL has been updated to `https://github.com/bmjcoding/agent-toolkit.git`. Update your local remote if needed:

```bash
git remote set-url origin https://github.com/bmjcoding/agent-toolkit.git
```

### Step 2 — Run the install script

The install script retargets all six symlinks atomically. It is idempotent: running it multiple times is safe and produces the same result.

**Install script flags and env vars:**

| Flag / Env var | Effect |
|---|---|
| `--dry-run` | Print planned changes without writing anything. |
| `--check` | Verify all symlinks exist and point to valid targets. Exit non-zero if any are missing or broken. |
| `AGENT_TOOLKIT_DIR=/path/to/repo` | Override the repo root path (default: auto-detected from the script's own location). |

**Preview first (recommended):**

```bash
bash claude-code/scripts/install.sh --dry-run
```

This prints exactly which symlinks will be created or updated, without making any changes.

**Apply:**

```bash
bash claude-code/scripts/install.sh
```

**Verify the result:**

```bash
bash claude-code/scripts/install.sh --check
```

`--check` verifies that all six symlinks exist, point to valid targets under the new layout, and are not broken. It exits non-zero if any symlink is missing or dangling.

### Step 3 — GitHub Copilot users (optional)

If you use GitHub Copilot in VS Code, manually wire the Copilot instruction files into your project's `.github/` directory:

```bash
# From your project root:
cp /path/to/agent-toolkit/github-copilot/instructions/*.md .github/instructions/
```

Or add a symlink if you want live updates:

```bash
ln -sf /path/to/agent-toolkit/github-copilot/instructions .github/copilot-instructions
```

The `github-copilot/` content targets VS Code IDE integration only. It does not apply to the GitHub Copilot cloud agent or CLI surfaces.

### Step 4 — OpenAI Codex CLI users (optional)

If you use the OpenAI Codex CLI, copy (or symlink) the agent TOML files into your Codex agents directory:

```bash
cp /path/to/agent-toolkit/openai-codex/agents/*.toml ~/.codex/agents/
```

Or to keep them in sync with the repo:

```bash
ln -sf /path/to/agent-toolkit/openai-codex/agents ~/.codex/agents/agent-toolkit
```

---

## Troubleshooting

### `~/.claude/agents` (or other entry) is a real directory, not a symlink

If one of the `~/.claude/` entries was previously created as a real directory (rather than a symlink), `install.sh` will refuse to overwrite it to avoid data loss. You will see an error such as:

```
ERROR: ~/.claude/agents exists and is not a symlink. Remove it manually first.
```

To resolve:

1. Back up the contents if needed: `cp -r ~/.claude/agents ~/agents-backup`
2. Remove the real directory: `rm -rf ~/.claude/agents`
3. Re-run the install script: `bash claude-code/scripts/install.sh`

The script will then create the correct symlink pointing into the repo.

### Broken symlinks after pulling

If `ls -la ~/.claude/` shows symlinks with red highlighting or `-> /path/to/claude-toolkit/...` (old paths), the install script has not been run yet. Run Step 2 above.

To inspect broken symlinks manually:

```bash
find ~/.claude -maxdepth 1 -type l | while read link; do
  target=$(readlink "$link")
  if [ ! -e "$target" ]; then
    echo "BROKEN: $link -> $target"
  else
    echo "OK:     $link -> $target"
  fi
done
```

### Missing `claude-code/scripts/install.sh`

If the install script is not present after `git pull`, confirm you are on the correct branch or that your local clone fully pulled:

```bash
git status
git log --oneline -5
ls claude-code/scripts/
```

If `install.sh` is absent, your pull may have stalled or the file may be listed under a slightly different path. Check `claude-code/scripts/` for the actual filename.

### Skills not loading in Claude Code

If Claude Code cannot find skills after migration, verify the `~/.claude/skills` symlink points to `agent-toolkit/shared/skills` and not to the old `claude-toolkit/skills` path:

```bash
readlink ~/.claude/skills
```

Expected output: `/path/to/agent-toolkit/shared/skills`

If it still points to the old location, re-run `bash claude-code/scripts/install.sh`.

### Hook scripts not firing

After the restructure, hook scripts reference `agent-toolkit` paths internally. If a hook was pinned to a hardcoded `claude-toolkit/` path in a local customization, that reference needs updating. The canonical hook source files under `claude-code/hooks/` use `agent-toolkit` throughout.

### `toolkit-drift-check` warnings about unrecognized paths

The `COMPONENT_PATTERN` in `toolkit-drift-check.sh` was updated to match the new nested paths:

```
^(claude-code/(agents|hooks|commands|rules)|shared/skills|shared/rules)/[^/]+/[^/]+
```

If you see false-positive drift warnings, confirm your local clone has the latest version of `claude-code/hooks/toolkit-drift-check/toolkit-drift-check.sh`.

---

## Rollback

If you need to revert to the v1 layout (e.g., to use a `claude-toolkit` checkout that predates the restructure), restore the six symlinks to their old targets:

```bash
OLDREPO=/path/to/claude-toolkit   # adjust to your v1 checkout path

ln -sfn "$OLDREPO/agents"   ~/.claude/agents
ln -sfn "$OLDREPO/commands" ~/.claude/commands
ln -sfn "$OLDREPO/docs"     ~/.claude/docs
ln -sfn "$OLDREPO/hooks"    ~/.claude/hooks
ln -sfn "$OLDREPO/rules"    ~/.claude/rules
ln -sfn "$OLDREPO/skills"   ~/.claude/skills
```

Verify the result with `bash claude-code/scripts/install.sh --check` against the old repo, or inspect with `ls -la ~/.claude/`.

**Note:** the v1 layout no longer receives updates. Rolling back means you will not receive new agents, skills, or bug fixes added after the v2 restructure.

---

## Version Notes

All 48 components received a `v2.0.0` major version bump to mark this breaking layout change. Component changelogs and tag lineage continue under the new tag format `<tool>/<slug>-v<version>` (e.g., `claude-code/frankenstein-v2.0.0`, `shared/changelog-v2.0.0`). See [ADR 0004](adr/0004-per-component-changelog-tag-format.md) for the tag format rationale.

---

## References

- [ADR 0005 — Multi-Tool Restructure](adr/0005-multi-tool-restructure.md)
- [ADR 0004 — Per-Component Changelog Tag Format](adr/0004-per-component-changelog-tag-format.md)
- Install script: `claude-code/scripts/install.sh`
