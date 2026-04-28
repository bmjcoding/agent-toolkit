#!/usr/bin/env python3
"""Validate agent dispatch prompt shape before a subagent is spawned."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

MODE_PATTERNS = {
    "retro": [r"\bretro mode\b", r"\brun (?:a )?retro\b"],
    "improve": [r"\bimprove mode\b", r"\brun improve\b"],
    "review": [r"\breview mode\b", r"\brun review\b"],
    "recon": [r"\brecon mode\b", r"\bpre-planner recon\b"],
    "full-cycle": [r"\bfull-cycle mode\b", r"\brun full-cycle\b"],
}

SUPPRESSION_RE = re.compile(
    r"do\s+not\s+run\s+the\s+retro\s+skill\s+after\s+task\s+completion",
    re.IGNORECASE,
)
TARGET_RE = re.compile(r"\b(?:agents|skills|workflows)/[a-z0-9-]+/(?:AGENT|SKILL|WORKFLOW)\.md\b")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target", required=True, help="Subagent type being dispatched")
    parser.add_argument("--prompt-file", required=True, help="File containing the dispatch prompt")
    return parser.parse_args()


def mode_hits(prompt: str) -> list[str]:
    hits: list[str] = []
    for mode, patterns in MODE_PATTERNS.items():
        if any(re.search(pattern, prompt, re.IGNORECASE) for pattern in patterns):
            hits.append(mode)
    return hits


def finding(priority: str, code: str, message: str) -> dict[str, str]:
    return {"priority": priority, "code": code, "message": message}


def validate(target: str, prompt: str) -> list[dict[str, str]]:
    findings: list[dict[str, str]] = []
    target_slug = target.strip().lower()
    hits = mode_hits(prompt)

    if "autoresearch-analyst" in target_slug:
        if "retro" in hits and len(hits) > 1:
            findings.append(
                finding(
                    "P1",
                    "forbidden_retro_combination",
                    "autoresearch-analyst dispatch mixes retro mode with another mode",
                )
            )

        if "retro" not in hits and not SUPPRESSION_RE.search(prompt):
            findings.append(
                finding(
                    "P1",
                    "missing_retro_suppression",
                    "non-retro autoresearch-analyst dispatch must include the retro suppression line",
                )
            )

        if not hits and not TARGET_RE.search(prompt):
            findings.append(
                finding(
                    "P1",
                    "mode_word_missing",
                    "autoresearch-analyst dispatch has no recognized mode word or concrete target path",
                )
            )

    return findings


def main() -> int:
    args = parse_args()
    prompt = Path(args.prompt_file).read_text(encoding="utf-8")
    findings = validate(args.target, prompt)
    result = {"valid": not findings, "target": args.target, "findings": findings}
    print(json.dumps(result, indent=2))
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())
