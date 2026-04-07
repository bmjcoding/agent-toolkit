# Changelog — /improve

## 1.0.0 — 2026-04-07
- Initial version. Apply retro recommendations with accept/revert verification.
- AutoResearch-inspired loop: fixed-budget verification, binary accept/reject.
- Resilient linter discovery (tries ~/.claude then .claude then skips).
- Resilient retro-history.py discovery.
- Diff tracking: lines added/removed per change, recorded in outcome JSON.
- Semver version bumping on accepted changes (PATCH/MINOR/MAJOR).
- Short-circuit for pattern-only recommendations.
- Rewrite threshold: 5+ findings on same file → recommend /review-skill.
- Model change recommendations presented separately (never auto-applied).
- Outcome saved to ~/.claude/retros/{subject}/ with version tracking.
- Evals: 4 test cases.
