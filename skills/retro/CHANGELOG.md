# Changelog — /retro

## 1.0.0 — 2026-04-07
- Initial version. Structured retrospective for any run type (single agent, subagent, orchestration).
- Depth calibration: lightweight / standard / full.
- Root cause taxonomy: spec gap, prompt gap, dispatch error, contract drift, context overflow, misconfig, tool failure, external.
- Specification & Planning section applies to all run types.
- Execution efficiency with per-agent metrics, cost estimation, model selection analysis.
- Progressive disclosure: 5 reference files (example-output, finalization, single-agent-deep-dive, orchestration-deep-dive, model-pricing).
- Scripts: parse-metrics.py, verify-claims.py, retro-history.py (save/list/trends with --subject filtering).
- Global persistence at ~/.claude/retros/{subject}/.
- Cross-run trend analysis with subject filtering and improve-record correlation.
- Automatic /improve prompt after retro.
- System architecture diagrams (SVG + mmd).
- Evals: 4 test cases.
