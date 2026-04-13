# github-copilot/bundles/

Bundle manifests group related GitHub Copilot components for selective install. A bundle is a flat JSON file that declares which agents, skills, prompts, hooks, and rules belong together for a particular workflow.

## Bundle Format

Each bundle is a `.json` file with the following required fields:

```jsonc
{
  "bundleId": "kebab-case-identifier",   // unique slug, matches filename
  "name":     "Human Readable Name",     // display name
  "description": "One-sentence summary",
  "items": [
    { "category": "agent|skill|prompt|hook|rule", "itemId": "slug", "required": true }
  ],
  "tags":   ["tag1", "tag2"],            // searchable labels
  "status": "stable|placeholder"        // placeholder = authoring in progress
}
```

`category` values map to subdirectories within `github-copilot/`:

| category | resolved path |
|----------|---------------|
| `agent`  | `github-copilot/agents/<itemId>.agent.md` |
| `skill`  | `github-copilot/skills/<itemId>/SKILL.md` |
| `prompt` | `github-copilot/prompts/<itemId>.prompt.md` |
| `hook`   | `github-copilot/hooks/<itemId>/<itemId>.sh` |
| `rule`   | `github-copilot/instructions/<itemId>.instructions.md` |

> **Note:** Items with `category: "command"` in `claude-code/bundles/` are represented here as `category: "prompt"` — GitHub Copilot uses `.prompt.md` files rather than slash commands.

## Bundles

| Bundle ID | Name | Status | Description |
|-----------|------|--------|-------------|
| `frankenstein-orchestration` | Frankenstein Orchestration | stable | Full multi-agent delivery pipeline — all orchestrator agents, skills, prompts, and hooks. |
| `backend-development` | Backend Development | stable | Backend workflow covering service and API implementation patterns. |
| `frontend-development` | Frontend Development | stable | Frontend workflow covering implementation, design system compliance, and UI quality checks. |
| `code-quality` | Code Quality | stable | Linting, auditing, testing, and definition quality review pipeline. |
| `git-workflow` | Git Workflow | stable | Branching safety, secrets scanning, changelog, and release mechanics. |
| `security-hardening` | Security Hardening | stable | OWASP review, secrets scanning, and config protection. |
| `self-improvement` | Self-Improvement | stable | Autonomous retro, improve, and validate loop for evolving toolkit definitions. |
| `infrastructure` | Infrastructure | placeholder | SRE observability and infrastructure patterns (authoring in progress). |

## Using Bundles

Bundles are consumed by `github-copilot/scripts/install.sh`. Pass a bundle ID to install only that bundle's components:

```sh
# Install a specific bundle
./github-copilot/scripts/install.sh --bundle frankenstein-orchestration

# Install all bundles
./github-copilot/scripts/install.sh
```

The install script resolves each `itemId` to its target path, then creates or updates the corresponding file under `.github/`.

## Adding a Bundle

1. Create `github-copilot/bundles/<slug>.json` following the schema above.
2. Set `"status": "placeholder"` until all referenced items exist.
3. Add an entry to the table in this README.
4. Add a `CHANGELOG.md` entry under the component that owns the bundle if version-tracking is required.
