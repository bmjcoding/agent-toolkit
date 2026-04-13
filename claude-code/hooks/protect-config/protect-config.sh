#!/usr/bin/env bash
# version: 2.0.0
# PreToolUse hook: block Bash writes to ~/.claude control-plane files
# Fires on EVERY Bash call. Kept minimal for latency (<10ms common case).
#
# Closed findings: HB-001..HB-013, HB-016, HB-017, HB-020..HB-031,
#                  R-01, RT-MCP-014, CLAUD-002 (protect-config portion)
set -uo pipefail

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
[[ "$TOOL" != "Bash" ]] && exit 0

CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
[[ -z "$CMD" ]] && exit 0

# HB-012: Normalize to single line so multi-line commands match correctly
CMD=$(echo "$CMD" | tr '\n' ' ')

# Fast path: skip if no .claude, agent-toolkit, claude-toolkit, or relative protected-path reference
# Covers CWD-bypass: agent with cwd=~/.claude/ can issue `cp /tmp/evil agents/X`
# with no .claude literal — catch relative forms too.
echo "$CMD" | grep -qE '\.claude|agent-toolkit|claude-toolkit|claude-code/hooks/|claude-code/agents/|claude-code/commands/|claude-code/(skills|rules)/|(^| )agents/|(^| )hooks/|(^| )CLAUDE\.md|(^| )settings\.json' || exit 0

deny() {
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"%s"}}' "$1"
  exit 0
}

MSG="Write to control-plane files is blocked. Protected paths (settings.json, hooks/, CLAUDE.md, agents/, statusline-command.sh, orchestrator logs, orchestrator session.id, hookify rules) require direct user action to modify."

# ------------------------------------------------------------------
# PROTECTED path fragments (v2 -- HB-009, HB-010, R-01, RT-MCP-014, CLAUD-002)
# Covers: settings.json, hooks/, CLAUDE.md, agents/, statusline-command.sh,
#         agent-toolkit/ real-path equivalents, root-level skills/ and rules/,
#         orchestrator/logs/,
#         orchestrator/sessions/<timestamp>/logs/ (timestamp-validated to prevent
#         path-traversal SIDs), orchestrator/session.id (prevents session hijacking),
#         hookify*.local.md rule files
# ------------------------------------------------------------------
PROTECTED='(\.claude/(settings\.json|hooks/|CLAUDE\.md|agents/|statusline-command\.sh)|agent-toolkit/|claude-toolkit/|claude-code/(agents|commands|hooks|skills|rules)/|(^|/)claude-code/(skills|rules)/|\.orchestrator/(logs/|sessions/[0-9]{8}T[0-9]{6}/logs/|session\.id)|hookify[^/]*\.local\.md)'

# ------------------------------------------------------------------
# WRITE_OPS (v2 -- comprehensive write-intent operator detection)
#
# Anchors: (^|[[:space:];|&(]) prevents embedded-word false-negatives
#          \b word boundary used where anchor-form already anchors left
#
# Operators covered:
#   Redirects      : >>[[:space:]]*, >[[:space:]]*, >& (HB-011)
#   tee            : (^|[[:space:];|&(])tee\b and tee -a (HB-013, HB-024, HB-025)
#   sed -i         : sed[[:space:]]+-[^[:space:]]*i and sed[[:space:]]+-'i' (HB-020)
#   cp/mv          : (^|[[:space:];|&(])cp\b / mv\b (HB-004, HB-024, HB-026)
#   python/ruby/perl: (^|[[:space:];|&(])python3?\b / ruby\b / perl\b (HB-017)
#   node/nodejs    : (^|[[:space:];|&(])node(js)?\b (HB-027)
#   shells         : bash|sh|zsh|dash|ksh (HB-021)
#   awk variants   : awk|gawk|mawk (HB-022)
#   curl -o/--output: curl[[:space:]].*(-o |--output) (HB-001)
#   dd of=         : \bdd\b.*\bof= (HB-002)
#   ln -s/-f       : \bln\b.*-[sf] (HB-003)
#   install        : (^|[[:space:];|&(])install\b (HB-005)
#   rsync          : (^|[[:space:];|&(])rsync\b (HB-006)
#   patch          : (^|[[:space:];|&(])patch\b (HB-007)
#   git checkout/restore: git[[:space:]].*(checkout|restore) (HB-008)
#   scp            : (^|[[:space:];|&(])scp\b (HB-029)
#   openssl        : (^|[[:space:];|&(])openssl\b (HB-030)
#   docker -v      : docker[[:space:]].*-v[[:space:]] (HB-031)
#   exec FD >      : exec[[:space:]]+[0-9]*>[^[:space:]] (HB-023)
#   lua/php/deno/swift: (^|[[:space:];|&(])(lua|php|deno|swift)\b (HB-028)
#   eval           : (^|[[:space:];|&(])eval\b (HB-016)
#   truncate       : truncate[[:space:]] (existing)
# ------------------------------------------------------------------
WRITE_OPS='(>>[[:space:]]*|>[[:space:]]*[^>]|>&|(^|[[:space:];|&(])tee\b|sed[[:space:]]+-('\''[^'\'']*'\'')?[^[:space:]]*i|(^|[[:space:];|&(])(cp|mv)\b|(^|[[:space:];|&(])python3?\b|(^|[[:space:];|&(])ruby\b|(^|[[:space:];|&(])perl\b|(^|[[:space:];|&(])node(js)?\b|(^|[[:space:];|&(])(bash|sh|zsh|dash|ksh)\b|(^|[[:space:];|&(])(awk|gawk|mawk)\b|curl[[:space:]].*(-o[[:space:]]|--output)|\bdd\b.*\bof=|\bln\b.*-[sf]|(^|[[:space:];|&(])install\b|(^|[[:space:];|&(])rsync\b|(^|[[:space:];|&(])patch\b|git[[:space:]].*(checkout|restore)|(^|[[:space:];|&(])scp\b|(^|[[:space:];|&(])openssl\b|docker[[:space:]].*-v[[:space:]]|exec[[:space:]]+[0-9]*>[^[:space:]]|(^|[[:space:];|&(])(lua|php|deno|swift)\b|(^|[[:space:];|&(])eval\b|truncate[[:space:]])'

# Primary check: write operator + protected path
if echo "$CMD" | grep -qE "$WRITE_OPS" 2>/dev/null; then
  if echo "$CMD" | grep -qE "$PROTECTED" 2>/dev/null; then
    deny "$MSG"
  fi
fi

# HB-017: Narrow interpreter + protected-path block (belt-and-suspenders for
# interpreter invocations that may not be caught by combined regex above)
INTERP_RE='(^|[[:space:];|&(])(python3?|ruby|perl|node(js)?|bash|sh|zsh|dash|ksh|awk|gawk|mawk|lua|php|deno|swift|eval)\b'
if echo "$CMD" | grep -qE "$INTERP_RE" 2>/dev/null; then
  if echo "$CMD" | grep -qE "$PROTECTED" 2>/dev/null; then
    deny "$MSG"
  fi
fi

# Block chmod/chown/chflags on protected paths
if echo "$CMD" | grep -qE '(chmod|chown|chflags)[[:space:]]' 2>/dev/null; then
  if echo "$CMD" | grep -qE "$PROTECTED" 2>/dev/null; then
    deny "chmod/chown/chflags on control-plane files is blocked."
  fi
fi

exit 0
