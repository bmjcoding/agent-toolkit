#!/usr/bin/env bash
# Codex adapter: point the canonical integrity-warn hook at the Codex integrity script.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd -P)"
REPO_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd -P)"

export AGENT_TOOLKIT_HOOK_TOOL="openai-codex"
export AGENT_TOOLKIT_INTEGRITY_SCRIPT="${REPO_DIR}/openai-codex/scripts/integrity-check.sh"

exec "${REPO_DIR}/hooks/integrity-warn/integrity-warn.sh"
