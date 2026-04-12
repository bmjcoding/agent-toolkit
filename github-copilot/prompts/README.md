# GitHub Copilot Prompts

These prompt files are ported from the Claude Code slash commands in `claude-code/commands/`. They run as full agent flows in GitHub Copilot Chat.

## Available prompts

| Prompt | Description |
|--------|-------------|
| `audit` | Comprehensive code audit: correctness, security, accessibility, type safety, operational resilience |
| `backlog` | View, resolve, retriage, or clear items in the pipeline backlog |
| `git-verify` | Verify git hygiene and commit safety before pushing |
| `lint` | Run linting and standards compliance checks; auto-fix everything possible |
| `sync-toolkit` | Detect changed toolkit components, bump versions, generate CHANGELOGs, and open a PR |
| `test` | Write tests to cover gaps; target >=80% coverage on changed files |

## Installation

### Workspace scope (recommended for team use)

Copy the `.prompt.md` files to `.github/prompts/` in your repository:

```
.github/
  prompts/
    audit.prompt.md
    backlog.prompt.md
    git-verify.prompt.md
    lint.prompt.md
    sync-toolkit.prompt.md
    test.prompt.md
```

VS Code picks up any `.prompt.md` file under `.github/prompts/` automatically when the GitHub Copilot extension is installed.

### User scope (personal, across all repos)

1. Open VS Code settings (`Cmd+,` on macOS).
2. Search for `chat.promptFilesLocations`.
3. Add an entry pointing to the directory containing these `.prompt.md` files.

## Invocation

In GitHub Copilot Chat, type `/` followed by the prompt name (without the `.prompt.md` extension):

```
/audit src/
/lint --dry-run
/git-verify
/test src/components/
/backlog --retriage
/sync-toolkit --dry-run
```

Arguments after the prompt name are passed through as `$ARGUMENTS` in the prompt body.

## Tool availability

Each prompt declares a `tools` list in its frontmatter. The tools used are a subset of the GitHub Copilot VS Code agent tools:

| Tool | Purpose |
|------|---------|
| `read_file` | Read source files |
| `search_files` | Search by filename pattern or content |
| `run_in_terminal` | Execute shell commands (linters, test runners, git) |
| `list_dir` | List directory contents |

Tool availability depends on your GitHub Copilot plan and VS Code extension version. If a tool is unavailable, Copilot will skip it and proceed with available tools.

## Notes on `$ARGUMENTS`

The source commands use `$ARGUMENTS` as a placeholder for user-supplied arguments. In VS Code prompt files, the equivalent mechanism is `${input:argumentName}` with a registered input, but `$ARGUMENTS` is tolerated as a literal string that users can read and mentally map to their typed arguments. If you want typed input prompts, replace `$ARGUMENTS` with `${input:args}` and add an `inputs` section to the frontmatter per the VS Code prompt file spec.

## Source

Ported from `claude-code/commands/` in this repository. Do not edit these files to patch behavior — edit the canonical source in `claude-code/commands/` and re-run the port.
