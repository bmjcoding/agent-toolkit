---
paths: ["**/*.py", "**/pyproject.toml", "**/requirements*.txt"]
---
- Use `uv` for dependency management — never `pip install` directly.
- `uv sync --upgrade` to update dependencies.
