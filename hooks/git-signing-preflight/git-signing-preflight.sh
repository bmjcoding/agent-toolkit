#!/usr/bin/env bash
# lifecycle: stable
# PreToolUse hook for `git commit` and `git tag`: verifies signing keys are
# available BEFORE the command runs, eliminating the recurring 1Password /
# GPG signing failure mode that has cost multiple agent dispatches and a
# 4h 7m human-wait gap (2026-04-21 retro, S-5 in 2026-04-27 retro).
#
# Detection logic:
#   A signing-required command is one where:
#     (a) the command contains -S/-s flag (commit -S, tag -s), OR
#     (b) `git config --get commit.gpgsign` returns true (and command is commit), OR
#     (c) `git config --get tag.gpgsign` returns true (and command is tag)
#
#   For (a) we treat tag's -s as signing intent (`git tag -s` = signed tag)
#   and ignore commit's -s (`git commit -s` = signoff, not signing).
#
# Pre-flight check:
#   For ssh format: `ssh-add -l` must return at least one key.
#   For openpgp format: `gpg --list-secret-keys` must return at least one key.
#
# Behavior:
#   On signing required + keys unavailable: deny via emit_deny with structured
#   guidance to unlock the agent or bypass with `git -c <key>=false ...`.
#
# This is a generalist class-of-error hook: it catches signing-unavailable
# regardless of cause (1Password locked, agent not running, key revoked).
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd -P)"
# shellcheck source=../_adapter_lib.sh
source "${SCRIPT_DIR}/../_adapter_lib.sh"

read_adapter_input

# Only act on Bash tool calls.
TOOL=$(extract_tool_name)
if [ "$TOOL" != "Bash" ]; then
  exit 0
fi

CMD=$(extract_command)
if [ -z "$CMD" ]; then
  exit 0
fi

# Quick filter: does the command contain a `git commit` or `git tag` invocation?
# Match cases:
#   - `git commit ...` / `git tag ...`
#   - `git -c key=value commit ...` (flags between git and subcommand)
#   - `git -c k1=v1 -c k2=v2 commit ...` (multiple flags)
# We accept any token between `git` and `(commit|tag)` that starts with `-`,
# plus its argument. The simpler heuristic: search for the literal subcommand
# `commit` or `tag` preceded somewhere in the command by `git`.
if ! echo "$CMD" | grep -qE '\bgit\b'; then
  exit 0
fi
if ! echo "$CMD" | grep -qE '\b(commit|tag)\b'; then
  exit 0
fi
# Confirm the `commit`/`tag` we found is actually a git subcommand, not part
# of an unrelated word. We require: somewhere in the command, `git` followed
# by `-c <expr>` zero or more times, then `commit` or `tag` as a token.
if ! echo "$CMD" | grep -qE 'git([[:space:]]+-c[[:space:]]+[^[:space:]]+)*[[:space:]]+(commit|tag)([[:space:]]|$)'; then
  exit 0
fi

# ── Determine which git subcommand and whether signing is required. ───────
# A command can chain multiple subcommands. We check each occurrence.

requires_signing() {
  local subcmd="$1"     # commit or tag
  local raw="$2"        # the full command string

  # Extract the per-subcommand argument list. Naive but sufficient: take
  # everything from `git commit` up to the next `&&`, `;`, or `|`.
  local segment
  segment=$(echo "$raw" | sed -E "s/.*git[[:space:]]+${subcmd}\b/git ${subcmd}/" \
    | sed -E 's/[[:space:]]*(&&|\|\||;|\|).*$//')

  # Inline overrides: `-c commit.gpgsign=false` or `-c tag.gpgsign=false`.
  if echo "$segment" | grep -qE -- "-c[[:space:]]+${subcmd}\.gpgsign=(false|0|no)"; then
    return 1
  fi
  # Inline forces: `-c commit.gpgsign=true`.
  if echo "$segment" | grep -qE -- "-c[[:space:]]+${subcmd}\.gpgsign=(true|1|yes)"; then
    return 0
  fi

  # Explicit -S / --gpg-sign flag on commit always means signing.
  if [ "$subcmd" = "commit" ] && echo "$segment" | grep -qE -- '(^|[[:space:]])(-S|--gpg-sign)([=[:space:]]|$)'; then
    return 0
  fi
  # Explicit -s / --sign flag on tag means signing (commit's -s is signoff).
  if [ "$subcmd" = "tag" ] && echo "$segment" | grep -qE -- '(^|[[:space:]])(-s|--sign|--local-user)([=[:space:]]|$)'; then
    return 0
  fi
  # Explicit --no-gpg-sign always disables.
  if echo "$segment" | grep -qE -- '--no-gpg-sign|--no-sign'; then
    return 1
  fi

  # Otherwise consult git config (commit.gpgsign / tag.gpgsign).
  local key="${subcmd}.gpgsign"
  local val
  val=$(git config --get "$key" 2>/dev/null || echo "")
  case "$val" in
    true|1|yes) return 0 ;;
    *) return 1 ;;
  esac
}

NEEDS_SIGNING=false
SIGNING_REASON=""

# Match `git ... commit` or `git ... tag` allowing -c key=val flags between.
GIT_COMMIT_PATTERN='git([[:space:]]+-c[[:space:]]+[^[:space:]]+)*[[:space:]]+commit([[:space:]]|$)'
GIT_TAG_PATTERN='git([[:space:]]+-c[[:space:]]+[^[:space:]]+)*[[:space:]]+tag([[:space:]]|$)'

if echo "$CMD" | grep -qE "$GIT_COMMIT_PATTERN"; then
  if requires_signing commit "$CMD"; then
    NEEDS_SIGNING=true
    SIGNING_REASON="git commit (commit.gpgsign or -S flag)"
  fi
fi
if echo "$CMD" | grep -qE "$GIT_TAG_PATTERN"; then
  if requires_signing tag "$CMD"; then
    NEEDS_SIGNING=true
    SIGNING_REASON="${SIGNING_REASON:+$SIGNING_REASON; }git tag (tag.gpgsign or -s flag)"
  fi
fi

if [ "$NEEDS_SIGNING" = false ]; then
  exit 0
fi

# ── Signing format detection. ──────────────────────────────────────────────
GPG_FORMAT=$(git config --get gpg.format 2>/dev/null || echo "openpgp")

# ── Verify signing keys are available. ─────────────────────────────────────
KEYS_AVAILABLE=false
DIAGNOSTIC=""

case "$GPG_FORMAT" in
  ssh)
    # ssh-add -l: exit 0 with key list, exit 1 with "no identities", exit 2 if no agent
    if SSH_OUT=$(ssh-add -l 2>&1); then
      KEYS_AVAILABLE=true
    else
      RC=$?
      if [ "$RC" -eq 2 ]; then
        DIAGNOSTIC="ssh-add: cannot connect to authentication agent (\$SSH_AUTH_SOCK is not set or the agent is not running)"
      elif [ "$RC" -eq 1 ]; then
        DIAGNOSTIC="ssh-add: agent has no identities loaded"
      else
        DIAGNOSTIC="ssh-add returned exit $RC: $SSH_OUT"
      fi
    fi
    ;;
  openpgp|"")
    # gpg --list-secret-keys: exit 0 if any key, non-zero if none
    if GPG_OUT=$(gpg --list-secret-keys --with-colons 2>&1) && \
       echo "$GPG_OUT" | grep -q '^sec:'; then
      KEYS_AVAILABLE=true
    else
      DIAGNOSTIC="gpg has no usable secret keys (run: gpg --list-secret-keys; or unlock 1Password and retry)"
    fi
    ;;
  *)
    # Unknown format — let it through and surface a warning.
    echo "WARNING: unknown gpg.format '$GPG_FORMAT'; cannot pre-flight signing" >&2
    exit 0
    ;;
esac

if [ "$KEYS_AVAILABLE" = true ]; then
  exit 0
fi

# ── Deny with structured guidance. ─────────────────────────────────────────
REASON=$(cat <<EOF
Git signing pre-flight failed: $SIGNING_REASON requires a signing key but none is available.

Format: $GPG_FORMAT
Diagnostic: $DIAGNOSTIC

To resolve, either:
  1. Make the key available:
     - ssh format: run \`ssh-add ~/.ssh/id_rsa\` (or unlock 1Password)
     - openpgp format: import or unlock the configured signing key
  2. Bypass signing for this single command (use sparingly):
     - For commit: \`git -c commit.gpgsign=false commit ...\`
     - For tag:    \`git -c tag.gpgsign=false tag ...\`

Note: This pre-flight check exists because un-pre-flighted signing failures have
been the #1 recurring release-engineer dispatch failure across recent retros.
EOF
)

if command -v emit_deny >/dev/null 2>&1; then
  emit_deny "$REASON"
else
  echo "BLOCKED: $REASON" >&2
  exit 2
fi
