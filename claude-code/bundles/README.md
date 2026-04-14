# claude-code/bundles/

Bundle manifests group related Claude Code components for selective install. A bundle is a flat JSON file that declares which agents, skills, commands, hooks, and rules belong together for a particular workflow.

## Bundle Format

Each bundle is a `.json` file with the following required fields:

```jsonc
{
  "bundleId": "kebab-case-identifier",   // unique slug, matches filename
  "name":     "Human Readable Name",     // display name
  "description": "One-sentence summary",
  "items": [
    { "category": "agent|skill|command|hook|rule", "itemId": "slug", "required": true }
  ],
  "tags":   ["tag1", "tag2"],            // searchable labels
  "status": "stable|placeholder"        // placeholder = authoring in progress
}
```

`category` values map to subdirectories within `claude-code/`:

| category | resolved path |
|----------|---------------|
| `agent`  | `claude-code/agents/<itemId>.md` |
| `skill`  | `skills/<itemId>/SKILL.md` |
| `command`| `claude-code/commands/<itemId>.md` |
| `hook`   | `claude-code/hooks/<itemId>/<itemId>.sh` |
| `rule`   | `claude-code/rules/<itemId>/<itemId>.md` |

## Bundles

| Bundle ID | Name | Status | Description |
|-----------|------|--------|-------------|
| `frankenstein-orchestration` | Frankenstein Orchestration | stable | Full multi-agent delivery pipeline — all orchestrator agents, skills, commands, and hooks. |
| `backend-development` | Backend Development | stable | Backend workflow covering service and API implementation patterns. |
| `frontend-development` | Frontend Development | stable | Frontend workflow covering implementation, design system compliance, and UI quality checks. |
| `code-quality` | Code Quality | stable | Linting, auditing, testing, and definition quality review pipeline. |
| `git-workflow` | Git Workflow | stable | Branching safety, secrets scanning, changelog, and release mechanics. |
| `security-hardening` | Security Hardening | stable | OWASP review, secrets scanning, and config protection. |
| `self-improvement` | Self-Improvement | stable | Autonomous retro, improve, and validate loop for evolving toolkit definitions. |
| `infrastructure` | Infrastructure | placeholder | SRE observability and infrastructure patterns (authoring in progress). |

## Using Bundles

Bundles are consumed by `claude-code/scripts/install.sh`. Pass a bundle ID to install only that bundle's components:

```sh
# Install a specific bundle
./claude-code/scripts/install.sh --bundle frankenstein-orchestration

# Install all bundles
./claude-code/scripts/install.sh
```

The install script resolves each `itemId` to its target path, then creates or updates the corresponding symlink under `~/.claude/`.

## Adding a Bundle

1. Create `claude-code/bundles/<slug>.json` following the schema above.
2. Set `"status": "placeholder"` until all referenced items exist.
3. Add an entry to the table in this README.
4. Add a `CHANGELOG.md` entry under the component that owns the bundle if version-tracking is required.
