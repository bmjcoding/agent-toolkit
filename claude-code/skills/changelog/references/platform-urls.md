# Platform-Specific Compare URL Formats

Full templates for generating `CHANGELOG.md` comparison links on each supported git
hosting platform. `SKILL.md` only covers GitHub inline — load this file when working on
a repository hosted on GitLab, Bitbucket Cloud, or Bitbucket Datacenter.

## Detecting the Platform

Run `scripts/detect-platform.sh` to determine the platform for the current repo. To
override auto-detection, create `.changelog-platform.yml` at the repo root:

```yaml
platform: gitlab   # or github, bitbucket-cloud, bitbucket-datacenter
```

When the platform is unknown, omit compare links rather than generating broken ones and
document the omission with an inline comment above the link section.

`{BASE_URL}` in every template below is the remote repository URL with the `.git`
suffix stripped.

---

## GitHub (github.com and GitHub Enterprise)

Three-dot (`...`) semantics: shows commits reachable from the newer ref but not the
older. `HEAD` resolves correctly in GitHub compare URLs (verified live against public
repos).

```
Compare:    {BASE_URL}/compare/{slug}-v{old}...{slug}-v{new}
Unreleased: {BASE_URL}/compare/{slug}-v{latest}...HEAD
Tag view:   {BASE_URL}/tree/{slug}-v{version}             (always valid; preferred default)
            {BASE_URL}/releases/tag/{slug}-v{version}     (valid only if a GitHub Release object exists)
```

**Branch/tag name collision:** If a branch and a tag share the same name, GitHub uses
the branch. Disambiguate with `tags/`:

```
{BASE_URL}/compare/tags/{slug}-v{old}...tags/{slug}-v{new}
```

This is rare with component-prefixed tags but worth knowing.

---

## GitLab (gitlab.com and self-hosted)

GitLab routing requires the `/-/` path separator.

```
Compare:    {BASE_URL}/-/compare/{slug}-v{old}...{slug}-v{new}
Unreleased: {BASE_URL}/-/compare/{slug}-v{latest}...HEAD
Tag view:   {BASE_URL}/-/tags/{slug}-v{version}
```

**Nested groups:** GitLab supports nested groups (`group/subgroup/repo`). The
`{BASE_URL}` for self-hosted GitLab may have more than two path segments before the
repo name — extract it from `git remote get-url origin`.

**Self-hosted detection:** `scripts/detect-platform.sh` cannot auto-detect self-hosted
GitLab from hostname alone. Override with `.changelog-platform.yml` → `platform: gitlab`.

---

## Bitbucket Cloud (bitbucket.org)

**IMPORTANT:** Bitbucket Cloud uses **two dots** (`..`), not three. The argument
**order is reversed**: newer ref first, older ref second.

```
Compare:    {BASE_URL}/branches/compare/{slug}-v{new}..{slug}-v{old}
Unreleased: {BASE_URL}/branches/compare/main..{slug}-v{latest}
Tag view:   {BASE_URL}/src/{slug}-v{version}/
```

Substitute the actual default branch name for `main` in the Unreleased link. `HEAD` is
**not confirmed** to work in Bitbucket Cloud compare URLs — use the branch name
explicitly.

**Fallback:** Whether `branches/compare/` accepts tag refs is not officially documented
by Atlassian. If the generated URL returns 404 at click time, use the git log fallback:

```bash
git log {slug}-v{latest}..HEAD --oneline -- {component-path}/
```

---

## Bitbucket Datacenter (self-hosted / Bitbucket Server)

Uses query parameters, not path segments, for the compared refs. Both refs require the
`refs/tags/` prefix. `targetBranch` is the **older** ref (base); `sourceBranch` is the
**newer** ref (head).

```
Compare:    {BASE_URL}/compare/commits?targetBranch=refs%2Ftags%2F{slug}-v{old}&sourceBranch=refs%2Ftags%2F{slug}-v{new}
Unreleased: {BASE_URL}/compare/commits?targetBranch=refs%2Ftags%2F{slug}-v{latest}&sourceBranch=refs%2Fheads%2Fmain
Tag view:   {BASE_URL}/browse?at=refs%2Ftags%2F{slug}-v{version}
```

`{BASE_URL}` for Datacenter: `https://{dc-host}/projects/{PROJECT-KEY}/repos/{repo}`

For **personal repositories** on Datacenter, the project key uses a tilde prefix:
`https://{dc-host}/projects/~{userSlug}/repos/{repo}`

The `?targetBranch=`/`?sourceBranch=` web UI parameters are from community documentation
— not verified from official Atlassian docs. Use with awareness that the format may
behave differently on custom-proxied Datacenter installations. If the generated URL
404s, fall back to the git log method shown in the Bitbucket Cloud section above.

Substitute the actual default branch name for `main` in the Unreleased link. Use
`refs/heads/{branch}` format — bare `HEAD` is not confirmed to work in the
`sourceBranch` param.

**Clone URL quirks:** If the Datacenter installation omits `/scm/` from clone URLs
(custom proxy), platform auto-detection may fail. Override with
`.changelog-platform.yml` → `platform: bitbucket-datacenter`.
