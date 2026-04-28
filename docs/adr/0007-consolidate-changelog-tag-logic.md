# 0007. Consolidate CHANGELOG and Git Tag Logic

Date: 2026-04-14

## Status

Accepted

## Context

CHANGELOG promotion and tag creation logic had drifted across multiple prompts, agents, and
skills. The canonical owner also pointed at outdated tool-local skill paths instead of the
shared root skill tree.

## Decision

### 1. Single canonical owner

Root `skills/delivery/changelog/SKILL.md` is the sole owner of:

- changelog structure and formatting rules
- SemVer bump guidance
- `[Unreleased]` promotion rules
- per-component tag format guidance

### 2. Shared tag namespaces are explicit

- shared skills: `skill/<slug>-vX.Y.Z`
- shared rules: `rule/<slug>-vX.Y.Z`
- tool-specific assets keep their tool namespace

### 3. Other workflows delegate

`improve`, release flows, and tool-specific agents should reference the root changelog
skill instead of carrying separate canonical tag or release logic.

## Consequences

- tag and changelog behavior is updated in one place
- root skill changelogs stay canonical for shared skills
- tool-specific changelogs no longer imply ownership of duplicated shared content
