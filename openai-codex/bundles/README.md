# openai-codex/bundles/

Bundle manifests group related OpenAI Codex CLI components for selective install. A bundle is a flat JSON file that declares which agents, skills, and hooks belong together for a particular workflow.

**Note**: OpenAI Codex CLI has no custom slash commands or prompts — bundles include only `agent`, `skill`, and `hook` categories.

## Bundle Format

Each bundle is a `.json` file with the following required fields:

```jsonc
{
  "bundleId": "kebab-case-identifier",   // unique slug, matches filename
  "name":     "Human Readable Name",     // display name
  "description": "One-sentence summary",
  "items": [
    { "category": "agent|skill|hook", "itemId": "slug", "required": true }
  ],
  "tags":   ["tag1", "tag2"],            // searchable labels
  "status": "stable|placeholder"        // placeholder = authoring in progress
}
```

`category` values map to subdirectories within `openai-codex/`:

| category | resolved path |
|----------|---------------|
| `agent`  | `openai-codex/agents/<itemId>.toml` |
| `skill`  | `openai-codex/skills/<itemId>/SKILL.md` |
| `hook`   | entry in `openai-codex/hooks/hooks.json` under event matching `<itemId>` |

## Bundles

| Bundle ID | Name | Status | Description |
|-----------|------|--------|-------------|
| `frankenstein-orchestration` | Frankenstein Orchestration | stable | Full multi-agent delivery pipeline — all orchestrator agents, skills, and hooks. |
| `backend-development` | Backend Development | stable | Backend workflow covering service and API implementation patterns. |
| `frontend-development` | Frontend Development | stable | Frontend workflow covering implementation, design system compliance, and UI quality checks. |
| `code-quality` | Code Quality | stable | Review and definition quality checks. |
| `git-workflow` | Git Workflow | stable | Branching safety, secrets scanning, changelog, and release mechanics. |
| `security-hardening` | Security Hardening | stable | OWASP review, secrets scanning, and config protection. |
| `self-improvement` | Self-Improvement | stable | Autonomous retro, improve, and validate loop for evolving toolkit definitions. |
| `infrastructure` | Infrastructure | placeholder | SRE observability and infrastructure patterns (authoring in progress). |

## Using Bundles

Bundles serve as install manifests and documentation for `openai-codex/scripts/install.sh`. To install a bundle's agents:

```sh
# Install all agents (which covers every bundle's agent items)
bash openai-codex/scripts/install.sh

# Install agents to project-local .codex/
bash openai-codex/scripts/install.sh --project
```

Skill entries in bundles correspond to `[[skills.config]]` entries in `config.toml.template`. Hook entries are wired in `openai-codex/hooks/hooks.json`.

## Differences from claude-code/bundles/

| Aspect | claude-code | openai-codex |
|--------|-------------|--------------|
| `command` items | yes (6 slash commands) | no — Codex has no custom slash commands |
| `rule` items | yes | no — rules are embedded in AGENTS.md at install time |
| `hook` items | yes | yes |
| `agent` items | yes (`.md` format) | yes (`.toml` format) |
| `skill` items | yes | yes |

## Adding a Bundle

1. Create `openai-codex/bundles/<slug>.json` following the schema above.
2. Set `"status": "placeholder"` until all referenced items exist.
3. Add an entry to the table in this README.
