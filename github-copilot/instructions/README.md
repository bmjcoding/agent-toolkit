# GitHub Copilot Path-Scoped Instructions

This directory contains VS Code Copilot workspace-scoped instruction files, one per rule domain.

## What these files are

Each `.instructions.md` file corresponds to a rule in `rules/<name>/<name>.md` and is converted into the format expected by GitHub Copilot's [path-scoped instructions](https://code.visualstudio.com/docs/copilot/copilot-customization#_use-instructionsmd-files) feature.

The `applyTo` frontmatter field restricts each file to the glob patterns most relevant to that rule, so Copilot only injects the instruction when editing matching files.

## Files

| File | Source rule | applyTo glob |
|---|---|---|
| `docker.instructions.md` | `rules/docker/docker.md` | `**/Dockerfile,**/Dockerfile.*,**/docker-compose*.{yml,yaml}` |
| `logging.instructions.md` | `rules/logging/logging.md` | `**/*.{py,ts,tsx,js,jsx,go,rb,java}` |
| `node.instructions.md` | `rules/node/node.md` | `**/*.{ts,tsx,js,jsx,mjs,cjs},**/package.json,**/package-lock.json,**/pnpm-lock.yaml,**/yarn.lock` |
| `python.instructions.md` | `rules/python/python.md` | `**/*.{py,pyi},**/requirements*.txt,**/pyproject.toml,**/poetry.lock,**/uv.lock,**/setup.py,**/setup.cfg` |

## Install (workspace scope)

VS Code Copilot loads instructions from `.github/instructions/` at the workspace root. Run the install script to symlink these files into place:

```sh
bash github-copilot/scripts/install.sh
```

The script is maintained separately and creates symlinks of the form:

```
.github/instructions/<name>.instructions.md -> ../../github-copilot/instructions/<name>.instructions.md
```

After running the script, restart VS Code (or reload the window) for the instructions to take effect.
