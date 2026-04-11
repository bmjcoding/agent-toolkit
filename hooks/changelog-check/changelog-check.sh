#!/usr/bin/env bash
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
  changelog_modified=$(git diff --name-only "$range" 2>/dev/null | grep -c "CHANGELOG.md")

  if [ "$changelog_modified" -eq 0 ]; then
    echo ""
    echo "⚠️  CHANGELOG.md was not updated in the commits being pushed."
    echo ""
    echo "   Run the /changelog skill or dispatch the release-engineer agent"
    echo "   to generate changelog entries before pushing."
    echo ""
    echo "   To bypass this check (emergency): git push --no-verify"
    echo ""
    exit 1
  fi
done

exit 0
