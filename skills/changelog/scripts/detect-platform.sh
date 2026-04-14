#!/usr/bin/env bash
# detect-platform.sh — Detect git hosting platform for the current repo.
#
# Output: one of: github, gitlab, bitbucket-cloud, bitbucket-datacenter, unknown
#
# Resolution order:
#   1. .changelog-platform.yml at the repo root (override)
#   2. git remote get-url origin hostname match
#   3. unknown (cannot auto-detect self-hosted GitLab / Datacenter from hostname alone)

set -euo pipefail

show_help() {
  cat <<'HELP_EOF'
detect-platform.sh — Detect git hosting platform for the current repo.

USAGE:
  detect-platform.sh [--path PATH] [--help]

OPTIONS:
  --path PATH    Run against a specific repo path (default: pwd).
  --help, -h     Show this help.

OUTPUT:
  One of: github, gitlab, bitbucket-cloud, bitbucket-datacenter, unknown

RESOLUTION ORDER:
  1. .changelog-platform.yml at the repo root with "platform: <name>"
  2. git remote get-url origin hostname match
  3. unknown (self-hosted GitLab / Datacenter cannot be disambiguated from URL alone —
     create .changelog-platform.yml to override)

EXIT CODES:
  0 on success (including "unknown" result so callers can branch)
  2 on argument error
  3 when not inside a git repository
HELP_EOF
}

REPO_PATH="."

while [[ $# -gt 0 ]]; do
  case "$1" in
    --path)
      if [[ -z "${2:-}" ]]; then
        echo "Missing value for --path" >&2
        exit 2
      fi
      REPO_PATH="$2"
      shift 2
      ;;
    --help|-h)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      show_help >&2
      exit 2
      ;;
  esac
done

cd "$REPO_PATH" 2>/dev/null || { echo "Path not found: $REPO_PATH" >&2; exit 2; }

if ! git rev-parse --show-toplevel >/dev/null 2>&1; then
  echo "Not inside a git repository: $REPO_PATH" >&2
  exit 3
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"

# 1. Check for override file
OVERRIDE_FILE="$REPO_ROOT/.changelog-platform.yml"
if [[ -f "$OVERRIDE_FILE" ]]; then
  OVERRIDE="$(grep -E '^[[:space:]]*platform:[[:space:]]*' "$OVERRIDE_FILE" \
    | head -1 \
    | sed -E 's/^[[:space:]]*platform:[[:space:]]*//; s/[[:space:]]+$//; s/^["'"'"']//; s/["'"'"']$//')"
  case "$OVERRIDE" in
    github|gitlab|bitbucket-cloud|bitbucket-datacenter)
      echo "$OVERRIDE"
      exit 0
      ;;
  esac
fi

# 2. Inspect origin URL
ORIGIN="$(git remote get-url origin 2>/dev/null || echo "")"

if [[ -z "$ORIGIN" ]]; then
  echo "unknown"
  exit 0
fi

case "$ORIGIN" in
  *github.com*|*github.*)
    echo "github"
    ;;
  *gitlab.com*)
    echo "gitlab"
    ;;
  *bitbucket.org*)
    echo "bitbucket-cloud"
    ;;
  *)
    # Self-hosted fall-through: cannot disambiguate gitlab vs bitbucket-datacenter
    # vs enterprise-github from the hostname alone. Require override file.
    echo "unknown"
    ;;
esac

exit 0
