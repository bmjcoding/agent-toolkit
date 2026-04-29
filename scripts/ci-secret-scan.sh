#!/usr/bin/env bash

set -euo pipefail

INCLUDE_WORKING_TREE=false
if [[ "${1:-}" == "--include-working-tree" ]]; then
  INCLUDE_WORKING_TREE=true
  shift
fi

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 [--include-working-tree] <base-ref> <head-ref>" >&2
  exit 2
fi

BASE_REF="$1"
HEAD_REF="$2"

SECRET_PATTERNS='AKIA[0-9A-Z]{16}|sk-[a-zA-Z0-9]{20,}|-----BEGIN (RSA |EC |DSA |PGP |OPENSSH )?PRIVATE KEY|ghp_[a-zA-Z0-9]{36}|xox[bsp]-[a-zA-Z0-9-]{10,}|glpat-[a-zA-Z0-9-]{20}|eyJ[a-zA-Z0-9_-]{20,}\.eyJ'
EXCLUDE_PATHS=(
  ':(exclude).orchestrator/handoffs/**'
  ':(exclude).orchestrator/sessions/*/handoffs/**'
)

scan_added_lines() {
  local label="$1"
  shift
  local diff_output
  local matches

  diff_output="$(git diff --find-renames "$@" -- . "${EXCLUDE_PATHS[@]}")"
  matches="$(printf '%s\n' "${diff_output}" | grep -inE "^\+[^+].*(${SECRET_PATTERNS})" || true)"

  if [[ -n "${matches}" ]]; then
    echo "Potential secrets detected in added lines for ${label}:" >&2
    printf '%s\n' "${matches}" >&2
    return 1
  fi

  echo "No secret patterns detected in added lines for ${label}."
}

scan_untracked_files() {
  local failed=false
  local file
  local file_matches

  while IFS= read -r -d '' file; do
    file_matches="$(grep -IHnE "${SECRET_PATTERNS}" -- "${file}" || true)"
    if [[ -n "${file_matches}" ]]; then
      if [[ "${failed}" == false ]]; then
        echo "Potential secrets detected in untracked files:" >&2
      fi
      printf '%s\n' "${file_matches}" >&2
      failed=true
    fi
  done < <(git ls-files --others --exclude-standard -z -- . "${EXCLUDE_PATHS[@]}")

  if [[ "${failed}" == true ]]; then
    return 1
  fi

  echo "No secret patterns detected in untracked files."
}

scan_added_lines "committed diff between ${BASE_REF} and ${HEAD_REF}" "${BASE_REF}..${HEAD_REF}"

if [[ "${INCLUDE_WORKING_TREE}" == true ]]; then
  scan_added_lines "staged changes" --cached
  scan_added_lines "unstaged changes"
  scan_untracked_files
fi
