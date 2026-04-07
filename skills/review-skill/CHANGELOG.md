# Changelog — /review-skill

## 1.0.0 — 2026-04-07
- Initial version. Pre-merge quality gate for skills and agent definitions.
- lint-definition.py: 14 structural checks (S01-S10) + 14 quality checks (Q01-Q14).
- Q13: version existence check (metadata.version or # version comment).
- Q14: version-not-bumped-on-modification check (git diff).
- Semantic review: description, instructions, architecture, completeness.
- Three-tier verdict: PASS / NEEDS WORK / REWRITE.
- NEEDS WORK output table matches /improve input format.
- Evals: 4 test cases.
