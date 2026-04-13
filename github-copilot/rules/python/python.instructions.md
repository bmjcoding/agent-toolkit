---
description: "Python dependency management: use uv for all installs and upgrades, never pip install directly."
applyTo: "**/*.{py,pyi},**/requirements*.txt,**/pyproject.toml,**/poetry.lock,**/uv.lock,**/setup.py,**/setup.cfg"
---
- Use `uv` for dependency management — never `pip install` directly.
- `uv sync --upgrade` to update dependencies.
