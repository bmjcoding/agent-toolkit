# Version Ownership Note

Released versions are tracked only in each component's `CHANGELOG.md`.
`improve` does **not** bump inline definition markers, `metadata.version`, or `# version:`
comments.

Use this rule set instead:

1. Record the accepted change under `## [Unreleased]` in the component changelog.
2. Let the changelog/release flow determine the next released version from the accumulated
   categories when a release is cut.
3. If a definition file still contains a legacy inline version marker, remove it rather
   than updating it.

The changelog skill is authoritative for release numbering and promotion behavior.
