# github-copilot/

This directory contains **GitHub Copilot-specific content** — agents, instructions, prompts, skills, rules, hooks, and bundles formatted for the GitHub Copilot agent model (both VS Code extension and GitHub.com cloud agent).

## Subdirectory Layout

```
github-copilot/
  agents/       # 15 custom agent definitions (.agent.md for VS Code; .md for cloud)
  bundles/      # 8 bundle manifests grouping agents + skills for common workflows
  hooks/        # 9 hook JSON manifests + shell scripts (VS Code .github/hooks/)
  instructions/ # 4 path-specific instruction files (docker, logging, node, python)
  mcp/
    mcp.json    # Stub/template for .vscode/mcp.json MCP server config
  prompts/      # 6 reusable prompt files (.prompt.md — VS Code, VS, JetBrains only)
  rules/        # 4 rule directories (docker, logging, node, python)
  scripts/
    install.sh  # Wire github-copilot/ content into .github/ for VS Code
  skills/       # 13 Copilot skill wrappers (one per universal skill)
```

## Install

Run the install script from the agent-toolkit root, pointing it at your project:

```sh
# Dry-run first to preview what will be symlinked
bash github-copilot/scripts/install.sh --target /path/to/your-project --dry-run

# Apply
bash github-copilot/scripts/install.sh --target /path/to/your-project

# Verify later
bash github-copilot/scripts/install.sh --target /path/to/your-project --check
```

Or manually symlink each directory from your project root:

```sh
TOOLKIT=/path/to/agent-toolkit
ln -s "${TOOLKIT}/github-copilot/agents"       .github/agents
ln -s "${TOOLKIT}/github-copilot/bundles"      .github/bundles
ln -s "${TOOLKIT}/github-copilot/hooks"        .github/hooks
ln -s "${TOOLKIT}/github-copilot/instructions" .github/instructions
ln -s "${TOOLKIT}/github-copilot/prompts"      .github/prompts
ln -s "${TOOLKIT}/github-copilot/rules"        .github/rules
ln -s "${TOOLKIT}/github-copilot/skills"       .github/skills
```

The install script creates all seven symlinks in one pass, skipping any whose source directory does not yet exist (graceful — re-run after adding new content).

## Agent Format (VS Code)

Custom agents for the VS Code Copilot extension use `.github/agents/<name>.agent.md` path with optional frontmatter fields: `name`, `description`, `tools`, `model`, `mcp-servers`, `handoffs`, `hooks`.

## Agent Format (GitHub Cloud)

GitHub.com cloud agents use `.github/agents/<name>.md` with `description` required and optional `tools`, `model` fields. Cloud agents do not support `hooks`, `mcpServers`, or `permissionMode` (silently ignored).

## Instructions

The 4 instruction files map directly to the 4 universal rules:

| File | Rule | `applyTo` |
|---|---|---|
| `docker.instructions.md` | Docker | `Dockerfile, docker-compose*.yml` |
| `logging.instructions.md` | Logging | `**/*.{ts,js,py}` |
| `node.instructions.md` | Node | `**/*.{ts,js}, package.json` |
| `python.instructions.md` | Python | `**/*.py, pyproject.toml` |

## Prompts

The 6 prompt files are direct Copilot equivalents of the 6 Claude Code slash commands:

| Prompt | Claude Code command |
|---|---|
| `audit.prompt.md` | `/audit` |
| `backlog.prompt.md` | `/backlog` |
| `git-verify.prompt.md` | `/git-verify` |
| `lint.prompt.md` | `/lint` |
| `sync-toolkit.prompt.md` | `/sync-toolkit` |
| `test.prompt.md` | `/test` |

## Skills

All 13 universal skills have Copilot wrappers in `github-copilot/skills/`. Each wrapper
mirrors the universal skill body with Copilot-compatible frontmatter (no `metadata.version`
or `disable-model-invocation` fields).

| Skill | Description |
|---|---|
| `backend` | Backend service and API implementation patterns |
| `changelog` | Changelog entry authoring (Keep a Changelog format) |
| `design-authority` | Architecture decision records and design review |
| `design-lint` | Design and UX consistency review |
| `frontend` | Frontend component and UI implementation patterns |
| `git-ship` | Git commit, branch, and PR workflow |
| `improve` | Iterative code improvement and refactoring |
| `infra` | Infrastructure-as-code and deployment patterns |
| `observability-patterns` | Logging, metrics, tracing, and alerting patterns |
| `owasp-reference` | OWASP Top 10 security reference |
| `prod-readiness` | Production readiness checklist and verification |
| `retro` | Retrospective facilitation and action items |
| `review-skill` | Code review guidelines and checklist |

Skills are discovered by Copilot from `.github/skills/<name>/SKILL.md`.

## Rules

The 4 universal rules have Copilot wrappers in `github-copilot/rules/`:

| Rule | Description |
|---|---|
| `docker` | Docker and container conventions (pinned image tags, non-root USER, layer ordering) |
| `logging` | Structured logging conventions (log levels, context fields, no secrets in logs) |
| `node` | Node.js / TypeScript conventions (imports, error handling, async patterns) |
| `python` | Python conventions (type hints, virtual envs, pyproject.toml, uv) |

Rule content is discovered from `.github/rules/<slug>/`.

## Hooks

The 9 hooks in `github-copilot/hooks/` provide VS Code Copilot automation via
`.github/hooks/<slug>.json` manifests. Each JSON file declares the event binding; the
corresponding `.sh` script contains the implementation.

| Hook | Event | Purpose |
|---|---|---|
| `branch-guard` | `PreToolUse` | Block direct push/commit to main or master |
| `changelog-check` | `PreToolUse` | Verify changelog entry exists before commit |
| `extract-handoff` | `SubagentStop` | Extract structured handoff data from subagent output |
| `inject-context` | `SubagentStart` | Inject session context into subagent environment |
| `integrity-warn` | `PostToolUse` | Warn on file integrity or checksum mismatches |
| `pre-push-secrets` | `PreToolUse` | Scan for secrets before git push (gitleaks) |
| `protect-config` | `PreToolUse` | Prevent modification of protected config files |
| `toolkit-drift-check` | `PostToolUse` | Detect toolkit drift after toolkit file edits |
| `toolkit-edit-reminder` | `PostToolUse` | Remind to update CHANGELOG after toolkit edits |

Hook JSON format follows the VS Code Copilot `.github/hooks/` convention:

```json
{
  "hooks": {
    "PreToolUse": [
      { "type": "command", "command": "bash \"$AGENT_TOOLKIT_DIR/github-copilot/hooks/<slug>.sh\"" }
    ]
  }
}
```

## Bundles

The 8 bundle manifests in `github-copilot/bundles/` group agents and skills for common
development workflows. Bundles are informational — they document which agents and skills
belong together; the `install.sh` script wires the underlying directories.

| Bundle | Description |
|---|---|
| `backend-development` | Backend service and API workflow |
| `code-quality` | Linting, review, and improvement workflow |
| `frankenstein-orchestration` | Full Frankenstein multi-agent orchestration |
| `frontend-development` | Frontend component and UI workflow |
| `git-workflow` | Git commit, PR, and release workflow |
| `infrastructure` | Infrastructure-as-code and deployment workflow |
| `security-hardening` | Security review and OWASP workflow |
| `self-improvement` | Retrospective and iterative improvement workflow |

## MCP Configuration

`github-copilot/mcp/mcp.json` is a stub template for `.vscode/mcp.json` (workspace-scoped
MCP server configuration). Copy or adapt the relevant server block into your project's
`.vscode/mcp.json` to activate MCP tools in VS Code Copilot.

Copilot MCP constraints:
- Only `tools` transport is supported (no resources, no prompts).
- No OAuth remote MCP — `stdio` or `http+sse` only.
- For cloud agents: secrets must be prefixed `COPILOT_MCP_` in the `copilot` environment.
- MCP servers can also be declared per-agent in `.github/agents/<name>.agent.md` frontmatter
  under the `mcp-servers` key.

## Copilot-Specific Constraints

- Repository-wide instructions in `.github/copilot-instructions.md` are additive (not exclusive) alongside `AGENTS.md`.
- Nested `AGENTS.md` support in VS Code is **off by default** — requires `chat.useCustomizationsInParentRepositories: true` in VS Code settings.
- Copilot code-review mode reads only the first 4000 characters of any instruction file. Keep agent descriptions concise.
- MCP in cloud agents: only `tools` transport is supported; no OAuth remote MCP; secrets prefixed `COPILOT_MCP_`.

## Tag Format

```
github-copilot/<slug>-v<major>.<minor>.<patch>
```

Example: `github-copilot/frankenstein-v1.0.0`
