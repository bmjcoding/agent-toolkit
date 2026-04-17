#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <base-ref> <head-ref>" >&2
  exit 2
fi

BASE_REF="$1"
HEAD_REF="$2"

SECRET_PATTERNS='AKIA[0-9A-Z]{16}|sk-[a-zA-Z0-9]{20,}|-----BEGIN (RSA |EC |DSA |PGP |OPENSSH )?PRIVATE KEY|ghp_[a-zA-Z0-9]{36}|xox[bsp]-[a-zA-Z0-9-]{10,}|glpat-[a-zA-Z0-9-]{20}|eyJ[a-zA-Z0-9_-]{20,}\.eyJ'

DIFF_OUTPUT="$(
  git diff --find-renames "${BASE_REF}..${HEAD_REF}" -- . \
    ':(exclude).orchestrator/handoffs/**' \
    ':(exclude).orchestrator/sessions/*/handoffs/**'
)"

MATCHES="$(printf '%s\n' "${DIFF_OUTPUT}" | grep -inE "^\+[^+].*(${SECRET_PATTERNS})" || true)"

if [[ -n "${MATCHES}" ]]; then
  echo "Potential secrets detected in added lines between ${BASE_REF} and ${HEAD_REF}:" >&2
  printf '%s\n' "${MATCHES}" >&2
  exit 1
fi

echo "No secret patterns detected between ${BASE_REF} and ${HEAD_REF}."
