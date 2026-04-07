# Provider Detection & API Patterns

Detect the git provider from the remote URL and use the corresponding CLI/API.

## Detection

```bash
REMOTE_URL=$(git remote get-url origin 2>/dev/null)
```

| Pattern in URL | Provider | CLI |
|---|---|---|
| `github.com` | GitHub | `gh` CLI |
| Anything else | Bitbucket Data Center | `curl` + `$BITBUCKET_TOKEN` REST API v1.0 |

## GitHub Patterns

**Auth check**: `gh auth status`

**Find PR for branch**:
```bash
gh pr list --head <branch> --json number,url --jq '.[0]'
```

**Create PR**:
```bash
gh pr create --fill [--draft] [--title "..."]
```
Parse branch/commits for issue refs (`#\d+`). Include `Closes #N` in the body.

**Enable auto-merge**:
1. Check repo supports it: `gh api repos/{owner}/{repo} --jq '.allow_auto_merge'`
2. Detect strategy from args or repo settings (prefer squash)
3. `gh pr merge <number> --auto --<strategy>`

**Check PR merged**:
```bash
gh pr list --head <branch> --state merged --json number --jq '.[0]'
```

## Bitbucket Data Center Patterns

**Auth check**: Verify `$BITBUCKET_TOKEN` is set.

**Parse project/repo from remote URL**:
```
https://bitbucket.example.com/scm/PROJ/repo.git → project=PROJ, repo=repo
ssh://git@bitbucket.example.com:7999/PROJ/repo.git → project=PROJ, repo=repo
```

**Base URL**: `https://<host>/rest/api/1.0/projects/{project}/repos/{repo}`

**Find PR for branch**:
```bash
curl -s -H "Authorization: Bearer $BITBUCKET_TOKEN" \
  "$BASE_URL/pull-requests?state=OPEN&at=refs/heads/{branch}"
```

**Create PR**:
```bash
curl -s -X POST -H "Authorization: Bearer $BITBUCKET_TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/pull-requests" \
  -d '{"title":"...","description":"...","fromRef":{"id":"refs/heads/..."},"toRef":{"id":"refs/heads/..."},"reviewers":[]}'
```

**Check PR merged**:
```bash
curl -s -H "Authorization: Bearer $BITBUCKET_TOKEN" \
  "$BASE_URL/pull-requests?state=MERGED&at=refs/heads/{branch}"
```

**Auto-merge**: Not supported natively. Inform the user.
