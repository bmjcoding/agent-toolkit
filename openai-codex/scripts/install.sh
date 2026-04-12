#!/usr/bin/env bash
# install.sh — Codex CLI skill discovery stub
#
# Purpose
# -------
# Documents how Codex CLI discovers skills and shows one approach for making
# the shared/ skills in this repo available to Codex sessions.
#
# Codex skill discovery order (v0.120.0)
# ----------------------------------------
# 1. Individual paths listed as [[skills.config]] entries in .codex/config.toml
# 2. .agents/skills/ directory at the repo root (note: .agents/, not .claude/)
# 3. $HOME/.agents/skills/ (user-global)
# 4. /etc/codex/skills/ (system-wide)
# 5. Bundled skills shipped with the Codex CLI binary
#
# This file is a STUB. Symlink or copy as appropriate for your workflow.
# No auto-apply logic is included to avoid modifying system paths silently.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SKILLS_SRC="${REPO_ROOT}/shared/skills"
AGENTS_SKILLS_DIR="${REPO_ROOT}/.agents/skills"

echo "agent-toolkit: Codex skill setup stub"
echo ""
echo "Shared skills location : ${SKILLS_SRC}"
echo "Target discovery path  : ${AGENTS_SKILLS_DIR}"
echo ""
echo "Options:"
echo ""
echo "  Option A — project-local symlink (affects this repo only):"
echo "    mkdir -p '${AGENTS_SKILLS_DIR}'"
echo "    ln -s '${SKILLS_SRC}/changelog' '${AGENTS_SKILLS_DIR}/changelog'"
echo "    # Repeat for each skill you want Codex to discover."
echo ""
echo "  Option B — user-global symlink (affects all Codex sessions):"
echo "    mkdir -p \"\${HOME}/.agents/skills\""
echo "    ln -s '${SKILLS_SRC}/changelog' \"\${HOME}/.agents/skills/changelog\""
echo "    # Repeat for each skill you want globally available."
echo ""
echo "  Option C — per-skill config.toml entries (most explicit):"
echo "    Add [[skills.config]] blocks to .codex/config.toml:"
echo "      [[skills.config]]"
echo "      path = \"${SKILLS_SRC}/changelog\""
echo "    See openai-codex/config.toml.template for the full template."
echo ""
echo "No changes were made. Run one of the commands above to complete setup."
