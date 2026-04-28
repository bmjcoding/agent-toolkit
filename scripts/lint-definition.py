#!/usr/bin/env python3
"""Repo-level wrapper for the definition-review definition linter."""

from __future__ import annotations

import os
import sys
from pathlib import Path


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    candidates = sorted(
        repo_root.glob("skills/**/definition-review/scripts/lint-definition.py")
    )
    if not candidates:
        print("could not locate definition-review/scripts/lint-definition.py", file=sys.stderr)
        return 2

    target = candidates[0]
    os.execv(sys.executable, [sys.executable, str(target), *sys.argv[1:]])
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
