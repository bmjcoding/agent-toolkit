#!/usr/bin/env bash
# backfill-changelog-tags.sh — Create per-component git tags from a CHANGELOG.md.
#
# Reads "## [X.Y.Z] - YYYY-MM-DD" headers from a CHANGELOG.md and tags the commit that
# introduced each version header with a signed annotated {full-slug}-v{X.Y.Z} tag.
# Existing conformant tags are skipped. Lightweight or unsigned tags are reported as failures.
#
# Intended use: one-time migration from monolithic (`vX.Y.Z`) to per-component
# (`{namespace}/{slug}-vX.Y.Z`) tagging. See references/migration.md.

set -euo pipefail

show_help() {
  cat <<'HELP_EOF'
backfill-changelog-tags.sh — Create per-component git tags from CHANGELOG.md history.

USAGE:
  backfill-changelog-tags.sh --slug SLUG --changelog PATH [--dry-run]
  backfill-changelog-tags.sh --help

OPTIONS:
  --slug SLUG         Full component slug (e.g., skill/changelog, agent/frankenstein). Required.
  --changelog PATH    Path to the CHANGELOG.md file. Required.
  --dry-run           Print tags that would be created without creating them.
  --help, -h          Show this help.

BEHAVIOR:
  1. Parse "## [X.Y.Z] - YYYY-MM-DD" headers from the CHANGELOG (skips [Unreleased]).
  2. For each version, use `git log -S "## [X.Y.Z]"` on the CHANGELOG path to find
     the commit that introduced that version header.
  3. Tag that commit with a signed annotated {full-slug}-v{X.Y.Z} tag.
  4. Skip any version whose existing tag is already signed and annotated.
  5. Fail any version whose existing tag is lightweight or unsigned.

AFTER SUCCESS:
  Run: git push origin --tags
  After all CHANGELOG footers reference canonical namespaced tags, you may delete
  superseded flat component tags and redundant mirrored tool-local tags that no
  longer have live references.

EXIT CODES:
  0  success (or dry-run completed cleanly)
  2  argument error
  3  changelog file not found
  4  no version headers found in changelog
  5  unable to locate introducing commit for one or more versions
HELP_EOF
}

SLUG=""
CHANGELOG=""
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --slug)
      if [[ -z "${2:-}" ]]; then echo "Missing value for --slug" >&2; exit 2; fi
      SLUG="$2"; shift 2 ;;
    --changelog)
      if [[ -z "${2:-}" ]]; then echo "Missing value for --changelog" >&2; exit 2; fi
      CHANGELOG="$2"; shift 2 ;;
    --dry-run)
      DRY_RUN=1; shift ;;
    --help|-h)
      show_help; exit 0 ;;
    *)
      echo "Unknown argument: $1" >&2
      show_help >&2
      exit 2 ;;
  esac
done

if [[ -z "$SLUG" || -z "$CHANGELOG" ]]; then
  echo "Missing required arguments: --slug and --changelog" >&2
  show_help >&2
  exit 2
fi

if [[ ! -f "$CHANGELOG" ]]; then
  echo "Changelog not found: $CHANGELOG" >&2
  exit 3
fi

# Extract X.Y.Z from "## [X.Y.Z] - YYYY-MM-DD" headers (skips [Unreleased]).
VERSIONS="$(grep -E '^## \[[0-9]+\.[0-9]+\.[0-9]+\]' "$CHANGELOG" \
  | sed -E 's/^## \[([0-9]+\.[0-9]+\.[0-9]+)\].*/\1/')"

if [[ -z "$VERSIONS" ]]; then
  echo "No version headers found in $CHANGELOG" >&2
  exit 4
fi

FAIL_COUNT=0
CREATED_COUNT=0
SKIPPED_COUNT=0

tag_has_signature() {
  local tag_name="$1"
  git cat-file -p "refs/tags/${tag_name}" 2>/dev/null \
    | grep -Eq '^-----BEGIN [A-Z0-9 ]*SIGNATURE-----$'
}

while IFS= read -r VERSION; do
  [[ -z "$VERSION" ]] && continue
  TAG="${SLUG}-v${VERSION}"

  # Skip if tag already exists
  if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null 2>&1; then
    if [[ "$(git cat-file -t "refs/tags/${TAG}" 2>/dev/null || true)" != "tag" ]]; then
      echo "FAIL  ${TAG} (existing tag is lightweight; recreate it as a signed annotated tag)" >&2
      FAIL_COUNT=$((FAIL_COUNT + 1))
      continue
    fi
    if ! tag_has_signature "$TAG"; then
      echo "FAIL  ${TAG} (existing tag is annotated but unsigned; recreate it as a signed annotated tag)" >&2
      FAIL_COUNT=$((FAIL_COUNT + 1))
      continue
    fi
    echo "skip  ${TAG} (already exists and is signed annotated)"
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    continue
  fi

  # Find commit where "## [X.Y.Z]" first appeared in the changelog
  COMMIT="$(git log --reverse --format=%H -S "## [${VERSION}]" -- "$CHANGELOG" | head -1)"

  if [[ -z "$COMMIT" ]]; then
    echo "FAIL  ${TAG} (no introducing commit found for '## [${VERSION}]' in $CHANGELOG)" >&2
    FAIL_COUNT=$((FAIL_COUNT + 1))
    continue
  fi

  if [[ $DRY_RUN -eq 1 ]]; then
    echo "plan  ${TAG} -> ${COMMIT:0:12}"
  else
    if ! git tag -s -m "$TAG" "$TAG" "$COMMIT"; then
      echo "FAIL  ${TAG} (signed tag creation failed; verify your signing agent and git tag signing config)" >&2
      FAIL_COUNT=$((FAIL_COUNT + 1))
      continue
    fi
    echo "tag   ${TAG} -> ${COMMIT:0:12}"
    CREATED_COUNT=$((CREATED_COUNT + 1))
  fi
done <<< "$VERSIONS"

echo ""
if [[ $DRY_RUN -eq 1 ]]; then
  echo "Dry run complete. Re-run without --dry-run to create tags."
else
  echo "Created: $CREATED_COUNT  Skipped: $SKIPPED_COUNT  Failed: $FAIL_COUNT"
  echo "To push: git push origin --tags"
fi

[[ $FAIL_COUNT -gt 0 ]] && exit 5
exit 0
