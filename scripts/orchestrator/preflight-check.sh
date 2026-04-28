#!/usr/bin/env bash
# Session preflight for orchestrator runs. Always emits JSON and exits 0.
set -euo pipefail

SID="${1:-}"
mkdir -p .orchestrator/logs
if [[ -n "$SID" ]]; then
  mkdir -p ".orchestrator/sessions/$SID/logs"
fi

is_git_repo=false
base_sha=""
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  is_git_repo=true
  base_sha="$(git rev-parse HEAD 2>/dev/null || true)"
  printf '%s' "$base_sha" > .orchestrator/session-base-sha
fi

wip_files=""
if [[ "$is_git_repo" == true ]]; then
  wip_files="$({
    git diff --name-only HEAD 2>/dev/null
    git ls-files --others --exclude-standard 2>/dev/null
  } | sort -u)"
fi

stale_toolkit_plan=""
toolkit_dir="${AGENT_TOOLKIT_DIR:-${TOOLKIT_PATH:-}}"
if [[ -n "$toolkit_dir" && -f "$toolkit_dir/.orchestrator/plan.json" && "$toolkit_dir" != "$(pwd -P)" ]]; then
  stale_toolkit_plan="$toolkit_dir/.orchestrator/plan.json"
fi

jq -n \
  --arg sid "$SID" \
  --argjson is_git_repo "$is_git_repo" \
  --arg base_sha "$base_sha" \
  --arg wip_files "$wip_files" \
  --arg stale_toolkit_plan "$stale_toolkit_plan" \
  '{
    session_id: ($sid | select(length > 0)),
    is_git_repo: $is_git_repo,
    base_sha: ($base_sha | select(length > 0)),
    git_repo_warning: (if $is_git_repo then null else "Current directory is not a git repository." end),
    wip_files: ($wip_files | split("\n") | map(select(length > 0))),
    wip_warning: (if ($wip_files | length) > 0 then "Working tree has tracked or untracked changes." else null end),
    stale_toolkit_plan: ($stale_toolkit_plan | select(length > 0)),
    stale_toolkit_warning: (if ($stale_toolkit_plan | length) > 0 then "A toolkit checkout has a stale .orchestrator/plan.json; agents must read the current workspace plan." else null end)
  }'

exit 0
