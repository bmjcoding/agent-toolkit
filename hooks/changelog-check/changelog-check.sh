#!/usr/bin/env bash
# lifecycle: stable
# changelog-check — pre-push hook
# Blocks git push if CHANGELOG.md was not modified in any commit being pushed.
# This enforces the changelog-first workflow: run the /changelog skill before shipping.

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
  # versioned Keep a Changelog 1.1.0 release header.
  # Valid headers:
  #   ## [X.Y.Z] - YYYY-MM-DD
  # Rejected (old bracketless format):
  #   ## X.Y.Z
  #   ## X.Y.Z - YYYY-MM-DD
  while IFS= read -r changelog_path; do
    # Accept:  ## [X.Y.Z] - YYYY-MM-DD
    #          ## [X.Y.Z] - YYYY-MM-DD [YANKED]
    # Reject:  ## [X.Y.Z]  (missing date on a released version)
    show_output=$(git show "${local_sha}:${changelog_path}" 2>/dev/null)
    if [ -z "$show_output" ]; then
      echo "WARNING: could not read ${changelog_path} at ${local_sha} — skipping format validation (shallow clone?)" >&2
      continue
    fi
    if printf '%s\n' "$show_output" | grep -qE '^(## \[Unreleased\]|\[Unreleased\]:)'; then
      echo ""
      echo "WARNING: CHANGELOG.md contains an [Unreleased] marker."
      echo ""
      echo "   Add a versioned ## [X.Y.Z] - YYYY-MM-DD section for this contribution instead."
      echo "   File: $changelog_path"
      echo ""
      echo "   To bypass: git push --no-verify"
      echo ""
      exit 1
    fi
    if ! printf '%s\n' "$show_output" | grep -qE '^## \[[0-9]+\.[0-9]+\.[0-9]+\] - [0-9]{4}-[0-9]{2}-[0-9]{2}'; then
      echo ""
      echo "WARNING: CHANGELOG.md does not contain a valid Keep a Changelog header."
      echo ""
      echo "   Expected format: ## [X.Y.Z] - YYYY-MM-DD"
      echo "   File: $changelog_path"
      echo ""
      echo "   Run the /changelog skill to convert to Keep a Changelog 1.1.0 format."
      echo ""
      echo "   To bypass: git push --no-verify"
      echo ""
      exit 1
    fi
    if printf '%s\n' "$show_output" | grep -qE '^\[(Unreleased|[0-9]+\.[0-9]+\.[0-9]+)\]: https?://.*/(compare|tree|releases/tag)/'; then
      echo ""
      echo "WARNING: CHANGELOG.md contains tag-backed version footer links."
      echo ""
      echo "   Remove tag-backed version footers; toolkit changelogs must stay portable to Bitbucket Data Center."
      echo "   File: $changelog_path"
      echo ""
      echo "   To bypass: git push --no-verify"
      echo ""
      exit 1
    fi
  done < <(printf '%s\n' "$diff_output" | grep 'CHANGELOG.md')

done

exit 0
