#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"

resolve_default_base() {
  local default_ref
  local base_ref

  if default_ref="$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null)"; then
    :
  else
    default_ref="origin/main"
  fi

  if ! git rev-parse --verify --quiet "${default_ref}" >/dev/null; then
    if git rev-parse --verify --quiet main >/dev/null; then
      default_ref="main"
    elif git rev-parse --verify --quiet master >/dev/null; then
      default_ref="master"
    else
      git rev-list --max-parents=0 HEAD | tail -1
      return
    fi
  fi

  base_ref="$(git merge-base HEAD "${default_ref}" 2>/dev/null || true)"
  if [[ -n "${base_ref}" ]]; then
    printf '%s\n' "${base_ref}"
  else
    git rev-list --max-parents=0 HEAD | tail -1
  fi
}

BASE_REF="${1:-}"
if [[ -z "${BASE_REF}" ]]; then
  BASE_REF="$(resolve_default_base)"
fi

npm run sync
npm run check
git diff --check
bash scripts/ci-secret-scan.sh --include-working-tree "${BASE_REF}" HEAD
