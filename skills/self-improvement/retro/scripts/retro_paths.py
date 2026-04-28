#!/usr/bin/env python3
"""Shared path helpers for canonical retro storage."""

from __future__ import annotations

import os
from pathlib import Path

RETRO_ROOT_ENV_VAR = "AGENT_RETRO_DIR"
DEFAULT_RETRO_ROOT = Path.home() / "agent-retros"


def expand_path(path: str | Path) -> Path:
    return Path(path).expanduser()


def _unique_paths(paths: list[Path]) -> list[Path]:
    unique: list[Path] = []
    seen: set[str] = set()
    for path in paths:
        key = str(path)
        if key in seen:
            continue
        seen.add(key)
        unique.append(path)
    return unique


def resolve_retro_root() -> Path:
    override = os.environ.get(RETRO_ROOT_ENV_VAR)
    if override:
        return expand_path(override)
    return DEFAULT_RETRO_ROOT


def default_history_dir() -> Path:
    return resolve_retro_root()


def default_sessions_dir() -> Path:
    return resolve_retro_root() / "sessions"


def default_meta_dir() -> Path:
    return resolve_retro_root() / "meta"


def legacy_state_roots() -> list[Path]:
    candidates: list[Path] = []

    env_state_root = os.environ.get("STATE_ROOT")
    if env_state_root:
        candidates.append(expand_path(env_state_root))

    candidates.extend([
        Path(".agents"),
        Path(".claude"),
        Path(".codex"),
        Path.home() / ".agents",
        Path.home() / ".claude",
        Path.home() / ".codex",
    ])
    return _unique_paths(candidates)


def legacy_retro_roots(*, existing_only: bool = False) -> list[Path]:
    roots = [state_root / "retros" for state_root in legacy_state_roots()]
    if existing_only:
        roots = [root for root in roots if root.exists()]
    return _unique_paths(roots)


def candidate_history_paths(
    history_dir: str | Path | None = None,
    *,
    include_legacy: bool = False,
) -> list[Path]:
    base_dir = expand_path(history_dir) if history_dir else default_history_dir()
    paths = [base_dir / "history.jsonl"]
    if include_legacy:
        paths.extend(root / "history.jsonl" for root in legacy_retro_roots(existing_only=True))
    return _unique_paths(paths)


def candidate_session_roots(*, include_legacy: bool = False) -> list[Path]:
    roots = [default_sessions_dir()]
    if include_legacy:
        for legacy_root in legacy_retro_roots(existing_only=True):
            roots.extend([
                legacy_root / "sessions",
                legacy_root / "orchestrator",
                legacy_root / "orchestration",
            ])
    return _unique_paths(roots)


def candidate_meta_dirs(*, include_legacy: bool = False) -> list[Path]:
    dirs = [default_meta_dir()]
    if include_legacy:
        dirs.extend(root / "meta" for root in legacy_retro_roots(existing_only=True))
    return _unique_paths(dirs)


def normalize_retro_path(path: str | Path) -> Path:
    """Best-effort canonicalization for legacy retro paths.

    If a path already points at the canonical root, return it unchanged.
    If it points at a legacy root and a canonical equivalent exists, return the
    canonical path. As a fallback for flat legacy subject directories, return a
    unique basename match under the canonical root when one exists.
    """

    target = expand_path(path)
    canonical_root = resolve_retro_root()

    if target == canonical_root or canonical_root in target.parents:
        return target

    for legacy_root in legacy_retro_roots():
        try:
            relative = target.relative_to(legacy_root)
        except ValueError:
            continue

        candidate = canonical_root / relative
        if candidate.exists():
            return candidate

        if canonical_root.exists():
            matches = sorted(canonical_root.rglob(target.name))
            if len(matches) == 1:
                return matches[0]
        return target

    return target
