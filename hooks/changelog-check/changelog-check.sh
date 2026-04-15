#!/usr/bin/env bash
# changelog-check — pre-push hook
# Blocks git push if CHANGELOG.md was not modified in any commit being pushed.
# This enforces the changelog-first workflow: run the /changelog skill before shipping.

# changelog_slug PATH — derive "{tool}/{component}" slug from a CHANGELOG.md path.
# Strips the filename and type-directory segment (skills/agents/commands/hooks/rules/bundles).
# Returns empty string for root CHANGELOG.md (root uses bare vX.Y.Z tags).
# e.g. skills/changelog/CHANGELOG.md -> skill/changelog
changelog_slug() {
  local dir="${1%/CHANGELOG.md}"
  [ "$dir" = "$1" ] || [ "$dir" = "CHANGELOG.md" ] && echo "" && return
  local tool="${dir%%/*}" component="${dir##*/}" middle="${dir#*/}"
  case "$tool:$middle" in
    skills:*)
      if [[ "$dir" == "skills/"* && "$middle" != */* ]]; then
        echo "skill/${component}"
        return
      fi
      ;;
    rules:*)
      if [[ "$dir" == "rules/"* && "$middle" != */* ]]; then
        echo "rule/${component}"
        return
      fi
      ;;
    hooks:*)
      if [[ "$dir" == "hooks/"* && "$middle" != */* ]]; then
        echo "hook/${component}"
        return
      fi
      ;;
  esac
  case "$middle" in
    skills/*|agents/*|commands/*|hooks/*|rules/*|bundles/*)
      echo "${tool}/${component}" ;;
    *)
      echo "$dir" ;;
  esac
}

# Get the remote and URL
remote="$1"
url="$2"

# Read stdin for refs being pushed
while read local_ref local_sha remote_ref remote_sha; do
  # Skip delete pushes
  if [ "$local_sha" = "0000000000000000000000000000000000000000" ]; then
    continue
  fi

  # Determine the range of commits being pushed
  if [ "$remote_sha" = "0000000000000000000000000000000000000000" ]; then
    # New branch — check all commits not on the default branch
    default_branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's,refs/remotes/origin/,,')
    [ -z "$default_branch" ] && default_branch="main"
    range="origin/${default_branch}..${local_sha}"
  else
    range="${remote_sha}..${local_sha}"
  fi

  # Check if CHANGELOG.md was modified in any commit in the range
  # Capture output and exit code separately to handle shallow-clone / network failures.
  diff_output=$(git diff --name-only "$range" 2>/dev/null)
  diff_exit=$?
  if [ $diff_exit -ne 0 ]; then
    echo ""
    echo "WARNING: git diff --name-only failed (exit $diff_exit) for range $range."
    echo "   This can happen in a shallow clone. Skipping changelog enforcement."
    echo ""
    exit 0
  fi

  changelog_modified=$(printf '%s\n' "$diff_output" | grep -c "CHANGELOG.md")

  if [ "$changelog_modified" -eq 0 ]; then
    echo ""
    echo "WARNING: CHANGELOG.md was not updated in the commits being pushed."
    echo ""
    echo "   Run the /changelog skill or dispatch the release-engineer agent"
    echo "   to generate changelog entries before pushing."
    echo ""
    echo "   To bypass this check (emergency): git push --no-verify"
    echo ""
    exit 1
  fi

  # Format validation: each modified CHANGELOG.md must contain at least one
  # valid Keep a Changelog 1.1.0 version header.
  # Valid headers:
  #   ## [Unreleased]
  #   ## [X.Y.Z] - YYYY-MM-DD
  # Rejected (old bracketless format):
  #   ## X.Y.Z
  #   ## X.Y.Z - YYYY-MM-DD
  while IFS= read -r changelog_path; do
    # Accept:  ## [Unreleased]
    #          ## [X.Y.Z] - YYYY-MM-DD
    #          ## [X.Y.Z] - YYYY-MM-DD [YANKED]
    # Reject:  ## [X.Y.Z]  (missing date on a released version)
    show_output=$(git show "${local_sha}:${changelog_path}" 2>/dev/null)
    if [ -z "$show_output" ]; then
      echo "WARNING: could not read ${changelog_path} at ${local_sha} — skipping format validation (shallow clone?)" >&2
      continue
    fi
    if ! printf '%s\n' "$show_output" | grep -qE '^## (\[Unreleased\]|\[[0-9]+\.[0-9]+\.[0-9]+\] - [0-9]{4}-[0-9]{2}-[0-9]{2})'; then
      echo ""
      echo "WARNING: CHANGELOG.md does not contain a valid Keep a Changelog header."
      echo ""
      echo "   Expected format: ## [X.Y.Z] - YYYY-MM-DD or ## [Unreleased]"
      echo "   File: $changelog_path"
      echo ""
      echo "   Run the /changelog skill to convert to Keep a Changelog 1.1.0 format."
      echo ""
      echo "   To bypass: git push --no-verify"
      echo ""
      exit 1
    fi
  done < <(printf '%s\n' "$diff_output" | grep 'CHANGELOG.md')

  # Tag-presence check: every NEW ## [X.Y.Z] header in this push must have a matching tag.
  while IFS= read -r changelog_path; do
    slug=$(changelog_slug "$changelog_path")
    ver_pattern='^## \[[0-9]+\.[0-9]+\.[0-9]+\] - [0-9]{4}-[0-9]{2}-[0-9]{2}'
    ver_extract='s/^## \[([0-9]+\.[0-9]+\.[0-9]+)\].*/\1/'
    local_show=$(git show "${local_sha}:${changelog_path}" 2>/dev/null)
    if [ -z "$local_show" ]; then
      echo "WARNING: could not read ${changelog_path} at ${local_sha} — skipping tag-presence check (shallow clone?)" >&2
      continue
    fi
    new_headers=$(printf '%s\n' "$local_show" | grep -E "$ver_pattern" | sed -E "$ver_extract")
    [ -z "$new_headers" ] && continue
    if [ "$remote_sha" = "0000000000000000000000000000000000000000" ]; then
      existing_headers=""
    else
      remote_show=$(git show "${remote_sha}:${changelog_path}" 2>/dev/null)
      if [ -z "$remote_show" ]; then
        echo "WARNING: could not read ${changelog_path} at ${remote_sha} — treating all versions as new (shallow clone?)" >&2
        existing_headers=""
      else
        existing_headers=$(printf '%s\n' "$remote_show" | grep -E "$ver_pattern" | sed -E "$ver_extract")
      fi
    fi
    while IFS= read -r version; do
      [ -z "$version" ] && continue
      printf '%s\n' "$existing_headers" | grep -qxF "$version" && continue
      [ -n "$slug" ] && expected_tag="${slug}-v${version}" || expected_tag="v${version}"
      if ! git tag -l "$expected_tag" | grep -qxF "$expected_tag"; then
        echo ""
        echo "ERROR: Promoted CHANGELOG entry [${version}] in ${changelog_path%/CHANGELOG.md} has no matching tag ${expected_tag}."
        echo ""
        echo "   Run: /changelog release"
        echo "   Or: git push origin HEAD && git tag '${expected_tag}' && git push origin '${expected_tag}'"
        echo ""
        echo "   To bypass: git push --no-verify"
        echo ""
        exit 1
      fi
    done <<< "$new_headers"
  done < <(printf '%s\n' "$diff_output" | grep 'CHANGELOG.md')
done

exit 0
