# Drift-Prevention Enforcement and Commit Classification

Two topics: the drift-prevention layers that enforce CHANGELOG hygiene across the
toolkit (informational — these run automatically), and how to map raw commits to
changelog categories when generating entries programmatically. Load this file when
building or debugging automated CHANGELOG pipelines (e.g., `/sync-toolkit`).

## Drift-Prevention Enforcement

Three layers enforce CHANGELOG hygiene across the toolkit.

### Layer 1 — Drift-check hook (SubagentStop)

After each subagent completes, `toolkit-drift-check.sh` checks whether any modified
component files have a paired `CHANGELOG.md` update. If not, it prints an advisory to
stderr listing the drifted components. Non-blocking. Per-session dedup prevents
repeated warnings within a single run.

### Layer 2 — Edit-reminder hook (PreToolUse)

When an agent begins writing or editing a toolkit component file,
`toolkit-edit-reminder.sh` injects a reminder into the agent context reinforcing the
user-facing summary requirement and the SemVer bump table.

### Layer 3 — `/sync-toolkit` command

The `/sync-toolkit` slash command orchestrates full synchronization: detects changes,
spawns per-component agents to generate user-facing CHANGELOG entries, bumps versions,
copies to `~/.claude`, and commits per-component. The command body explicitly prohibits
commit-log dumps in every spawned agent prompt.

Additional layers (semantic CHANGELOG validation, CI-side enforcement) are potential
future enhancements.

---

## Commit Classification Rules

Map commits and change descriptions to changelog categories when automating entry
generation. This is how `/sync-toolkit` and similar pipelines pick the right
`### Category` for each entry.

| Commit prefix / keyword | Category |
|---|---|
| `feat:` or `Added` prefix | `### Added` |
| `fix:` or `Fixed` prefix | `### Fixed` |
| `refactor:` / `chore:` / `Changed` prefix | `### Changed` |
| `docs:` touching documentation only | `### Changed` (omit if internal-only) |
| `security:` or `Security` prefix | `### Security` |
| `deprecate:` or `Deprecated` prefix | `### Deprecated` |
| `remove:` or `Removed` prefix | `### Removed` |

**Aggregation:** Collapse multiple related commits for the same version into one entry
per logical change. The entry summarizes the user-facing outcome, not the individual
commits. Always follow the "one idea per bullet" rule from `references/anti-patterns.md`.
