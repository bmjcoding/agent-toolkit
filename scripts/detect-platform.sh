#!/usr/bin/env bash
# detect-platform.sh — Detect the git hosting platform from the origin remote URL.
#
# Usage:
#   detect-platform.sh [--format=identifier|url]
#
#   --format=identifier  (default) Print one of:
#                          github | gitlab | bitbucket-cloud | bitbucket-datacenter | unknown
#   --format=url         Print a compare-URL template with placeholders:
#                          {old}       — older tag (base of diff)
#                          {new}       — newer tag (head of diff)
#                          {slug}      — component slug (used in tag_format substitution)
#
# Config override:
#   If .changelog-platform.yml exists in the repo root (i.e., the directory where the
#   script is invoked from), the `platform` key overrides auto-detection, and `base_url`
#   overrides the host parsed from the remote URL.
#
# Exit codes:
#   0 — platform identified (including "unknown")
#   1 — fatal error (no remote, git not available, etc.)
#
# Detection signals (heuristic, in priority order):
#   1. .changelog-platform.yml `platform` key (explicit override)
#   2. Host is github.com or matches *.github.com (GHE)       → github
#   3. Host is gitlab.com or matches *.gitlab.com              → gitlab
#   4. Host is bitbucket.org                                   → bitbucket-cloud
#   5. URL path contains /scm/ segment (BB DC HTTP clone)      → bitbucket-datacenter
#   6. URL path contains /projects/ segment (BB DC web/SSH)    → bitbucket-datacenter
#   7. Anything else                                           → unknown
#
# Inline test-case comments (prefixed TEST:):
#   TEST: https://github.com/owner/repo.git          → github
#   TEST: git@github.com:owner/repo.git              → github
#   TEST: https://myenterprise.github.com/org/r.git  → github
#   TEST: https://gitlab.com/group/sub/repo.git      → gitlab
#   TEST: git@gitlab.com:group/repo.git              → gitlab
#   TEST: https://gitlab.myco.com/team/repo.git      → gitlab
#   TEST: https://bitbucket.org/workspace/repo.git   → bitbucket-cloud
#   TEST: git@bitbucket.org:workspace/repo.git       → bitbucket-cloud
#   TEST: https://bitbucket.myco.com/scm/PROJ/r.git  → bitbucket-datacenter
#   TEST: ssh://git@bitbucket.myco.com/scm/PROJ/r    → bitbucket-datacenter
#   TEST: git@bitbucket.myco.com:PROJ/repo.git       → unknown (no /scm/ or /projects/)
#   TEST: https://example.com/some/repo.git          → unknown

set -euo pipefail

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
FORMAT="identifier"

for arg in "$@"; do
  case "$arg" in
    --format=identifier) FORMAT="identifier" ;;
    --format=url)        FORMAT="url" ;;
    --format=*)
      echo "ERROR: unknown --format value: ${arg#--format=}" >&2
      echo "       Valid values: identifier, url" >&2
      exit 1
      ;;
    *)
      echo "ERROR: unknown argument: $arg" >&2
      exit 1
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Locate repo root (git rev-parse works from any subdirectory)
# ---------------------------------------------------------------------------
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
  echo "ERROR: not inside a git repository" >&2
  exit 1
}

# ---------------------------------------------------------------------------
# Read .changelog-platform.yml override (if present)
# ---------------------------------------------------------------------------
OVERRIDE_PLATFORM=""
OVERRIDE_BASE_URL=""
OVERRIDE_PROJECT_KEY=""
OVERRIDE_REPO_SLUG=""
OVERRIDE_TAG_FORMAT=""
OVERRIDE_DEFAULT_BRANCH=""

PLATFORM_CFG="${REPO_ROOT}/.changelog-platform.yml"
if [[ -f "$PLATFORM_CFG" ]]; then
  # Parse YAML with pure POSIX tools — only handles simple key: value lines.
  # Does not parse anchors, arrays, or multiline values.
  while IFS= read -r line; do
    # Skip comments and blank lines
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line//[[:space:]]/}" ]] && continue

    key=$(echo "$line" | sed 's/:[[:space:]]*.*//' | tr -d '[:space:]')
    value=$(echo "$line" | sed 's/^[^:]*:[[:space:]]*//' | sed 's/[[:space:]]*#.*//' | tr -d '"'"'" | tr -d '[:space:]')

    case "$key" in
      platform)        OVERRIDE_PLATFORM="$value"   ;;
      base_url)        OVERRIDE_BASE_URL="$value"   ;;
      project_key)     OVERRIDE_PROJECT_KEY="$value" ;;
      repo_slug)       OVERRIDE_REPO_SLUG="$value"  ;;
      tag_format)      OVERRIDE_TAG_FORMAT="$value"  ;;
      default_branch)  OVERRIDE_DEFAULT_BRANCH="$value" ;;
    esac
  done < "$PLATFORM_CFG"
fi

# ---------------------------------------------------------------------------
# Validate OVERRIDE_PLATFORM against the allowlist (DA-012)
# ---------------------------------------------------------------------------
if [[ -n "$OVERRIDE_PLATFORM" ]]; then
  case "$OVERRIDE_PLATFORM" in
    github|gitlab|bitbucket-cloud|bitbucket-datacenter|unknown)
      : # valid
      ;;
    *)
      echo "WARN: invalid platform override '$OVERRIDE_PLATFORM' — falling through to auto-detection" >&2
      echo "WARN: valid values: github | gitlab | bitbucket-cloud | bitbucket-datacenter | unknown" >&2
      OVERRIDE_PLATFORM=""
      ;;
  esac
fi

# ---------------------------------------------------------------------------
# If platform is explicitly overridden, skip URL detection
# ---------------------------------------------------------------------------
if [[ -n "$OVERRIDE_PLATFORM" ]]; then
  PLATFORM="$OVERRIDE_PLATFORM"
  HOST="${OVERRIDE_BASE_URL:-}"
else
  # -------------------------------------------------------------------------
  # Read the origin remote URL
  # -------------------------------------------------------------------------
  REMOTE_URL=$(git remote get-url origin 2>/dev/null) || {
    # No remote configured — emit unknown (not an error; exit 0 per spec)
    echo "<!-- remote: (none) — no origin remote configured; set platform in .changelog-platform.yml -->" >&2
    echo "unknown"
    exit 0
  }

  # -------------------------------------------------------------------------
  # Normalize remote URL to https://host/path form
  # (strips .git suffix and trailing slash before analysis)
  # -------------------------------------------------------------------------

  # Remove trailing .git
  URL="${REMOTE_URL%.git}"
  # Remove trailing slash
  URL="${URL%/}"

  # SSH SCP-style: git@host:path/to/repo  →  https://host/path/to/repo
  if [[ "$URL" =~ ^git@([^:]+):(.+)$ ]]; then
    HOST="${BASH_REMATCH[1]}"
    PATH_PART="/${BASH_REMATCH[2]}"
    URL="https://${HOST}${PATH_PART}"
  fi

  # SSH with scheme: ssh://git@host[:port]/path  →  https://host/path
  if [[ "$URL" =~ ^ssh://git@([^/]+)(/.+)$ ]]; then
    HOST_WITH_PORT="${BASH_REMATCH[1]}"
    PATH_PART="${BASH_REMATCH[2]}"
    # Strip optional port number (e.g., host:7999  →  host)
    HOST="${HOST_WITH_PORT%%:*}"
    URL="https://${HOST}${PATH_PART}"
  fi

  # Extract host and path from the normalized https:// URL
  # URL format after normalization: https://host/path
  if [[ "$URL" =~ ^https?://([^/]+)(/.*)$ ]]; then
    HOST="${BASH_REMATCH[1]}"
    URL_PATH="${BASH_REMATCH[2]}"
  elif [[ "$URL" =~ ^https?://([^/]+)$ ]]; then
    HOST="${BASH_REMATCH[1]}"
    URL_PATH="/"
  else
    HOST=""
    URL_PATH="/"
  fi

  # -------------------------------------------------------------------------
  # Platform detection (priority order matches header comments)
  # -------------------------------------------------------------------------

  # 1. github.com or *.github.com (GitHub Enterprise)
  if [[ "$HOST" == "github.com" ]] || [[ "$HOST" == *.github.com ]]; then
    PLATFORM="github"

  # 2. gitlab.com or *.gitlab.com (GitLab self-hosted)
  elif [[ "$HOST" == "gitlab.com" ]] || [[ "$HOST" == *.gitlab.com ]]; then
    PLATFORM="gitlab"

  # 3. bitbucket.org (Bitbucket Cloud SaaS — only SaaS, never self-hosted)
  elif [[ "$HOST" == "bitbucket.org" ]]; then
    PLATFORM="bitbucket-cloud"

  # 4. /scm/ in path — strong BB Datacenter HTTP clone URL signal
  elif [[ "$URL_PATH" == /scm/* ]] || [[ "$URL_PATH" == */scm/* ]]; then
    PLATFORM="bitbucket-datacenter"

  # 5. /projects/ in path — BB Datacenter web/SSH URL signal
  elif [[ "$URL_PATH" == /projects/* ]] || [[ "$URL_PATH" == */projects/* ]]; then
    PLATFORM="bitbucket-datacenter"

  # 6. Catch-all: ambiguous or unsupported host
  else
    PLATFORM="unknown"
  fi
fi

# ---------------------------------------------------------------------------
# Resolved config values — merge YAML overrides with defaults (DA-003)
# ---------------------------------------------------------------------------

# tag_format default: {slug}-v{version}  (canonical per SKILL.md)
TAG_FORMAT="${OVERRIDE_TAG_FORMAT:-{slug}-v{version}}"
# default_branch used in Bitbucket Cloud/DC Unreleased links (HEAD not confirmed)
DEFAULT_BRANCH="${OVERRIDE_DEFAULT_BRANCH:-main}"
# project_key / repo_slug for Bitbucket Datacenter URL construction
PROJECT_KEY="${OVERRIDE_PROJECT_KEY:-{project-key}}"
REPO_SLUG="${OVERRIDE_REPO_SLUG:-{repo}}"

# ---------------------------------------------------------------------------
# URL templates — one per platform, using {old}/{new}/{slug} placeholders
# Template semantics:
#   {old}   = older tag (base of compare range)
#   {new}   = newer tag (head of compare range)
#   {slug}  = component slug (caller prepends before substituting {old}/{new})
#
# tag_format (default "{slug}-v{version}") controls how the slug maps to a tag;
# it is available as $TAG_FORMAT for callers that need to construct full tag names.
#
# GitHub/GitLab use three-dot (...) for merge-base diff.
# Bitbucket Cloud uses two-dot (..) — note REVERSED order (new..old).
# Bitbucket DC uses query params; refs use full refs/tags/ prefix for safety.
# See .orchestrator/context/platform-inventory.md for rationale.
# ---------------------------------------------------------------------------

emit_url_template() {
  local platform="$1"
  local host="${HOST:-}"

  # Read base_url from override if set, otherwise derive from detected host
  local base_url="${OVERRIDE_BASE_URL:-}"
  if [[ -z "$base_url" ]] && [[ -n "$host" ]]; then
    base_url="https://${host}"
  fi

  case "$platform" in
    github)
      # https://{host}/{owner}/{repo}/compare/{old}...{new}
      # HEAD works in GitHub compare URLs (VERIFIED, see platform-verified-detail.md)
      echo "${base_url}/{owner}/{repo}/compare/{old}...{new}"
      ;;

    gitlab)
      # https://{host}/{owner}/{repo}/-/compare/{old}...{new}
      # The /-/ separator is required for GitLab routing.
      echo "${base_url}/{owner}/{repo}/-/compare/{old}...{new}"
      ;;

    bitbucket-cloud)
      # https://bitbucket.org/{workspace}/{repo}/branches/compare/{new}..{old}
      # TWO dots; order is REVERSED (new first, old second) — Bitbucket Cloud quirk.
      # Tag refs in branches/compare are CANNOT VERIFY (see platform-verified.md item 3).
      # Uses $DEFAULT_BRANCH (not HEAD) for the Unreleased compare source.
      echo "${base_url:-https://bitbucket.org}/{workspace}/{repo}/branches/compare/${DEFAULT_BRANCH}..{old}"
      ;;

    bitbucket-datacenter)
      # https://{dc-host}/projects/{PROJECT-KEY}/repos/{repo}/compare/commits
      #   ?targetBranch=refs%2Ftags%2F{old}&sourceBranch=refs%2Fheads%2F{default_branch}
      # Uses $PROJECT_KEY and $REPO_SLUG from YAML config (or placeholders if not set).
      # refs/tags/ prefix avoids ambiguity with same-name branches.
      # URL-encoded slashes (%2F) in tag names: CANNOT VERIFY for slash-style tags;
      # use dash-style tags ({slug}-vX.Y.Z) to avoid the issue entirely.
      echo "${base_url}/projects/${PROJECT_KEY}/repos/${REPO_SLUG}/compare/commits?targetBranch=refs%2Ftags%2F{old}&sourceBranch=refs%2Fheads%2F${DEFAULT_BRANCH}"
      ;;

    unknown|*)
      # Emit a generic git-log fallback; caller should handle unknown gracefully.
      echo "git log {old}..{new} --oneline -- {slug-path}/"
      ;;
  esac
}

# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

# Emit stderr advisory when platform could not be detected
if [[ "$PLATFORM" == "unknown" ]]; then
  RAW_URL="${REMOTE_URL:-}"
  # DA-011: sanitize embedded credentials before echoing to stderr.
  # Replaces :password@ with :***@ to prevent credential leakage in CI logs.
  SAFE_URL="${RAW_URL//:*@/:***@}"
  echo "<!-- remote: ${SAFE_URL} — platform not detected; set platform in .changelog-platform.yml -->" >&2
fi

case "$FORMAT" in
  identifier)
    echo "$PLATFORM"
    ;;
  url)
    emit_url_template "$PLATFORM"
    ;;
esac
