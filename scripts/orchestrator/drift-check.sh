#!/usr/bin/env bash
# Compare current HEAD to the orchestrator session base SHA.
set -euo pipefail

base_file=".orchestrator/session-base-sha"
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  jq -n '{drift: false, skipped: true, reason: "not_git_repo"}'
  exit 0
fi

if [[ ! -f "$base_file" ]]; then
  jq -n '{drift: false, skipped: true, reason: "missing_session_base_sha"}'
  exit 0
fi

stored="$(cat "$base_file")"
current="$(git rev-parse HEAD)"
if [[ "$stored" == "$current" ]]; then
  jq -n --arg stored "$stored" --arg current "$current" '{drift: false, stored_sha: $stored, current_sha: $current}'
  exit 0
fi

jq -n --arg stored "$stored" --arg current "$current" '{drift: true, stored_sha: $stored, current_sha: $current}'
exit 1
