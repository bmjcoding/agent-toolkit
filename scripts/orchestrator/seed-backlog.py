#!/usr/bin/env python3
"""Seed .orchestrator/backlog.md from session handoff findings."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path
from typing import Any

BACKLOG_TITLE = "# Backlog"
AGENT_HEADER = "## Agent Actionable"
HUMAN_HEADER = "## Needs Human Decision"
TABLE_HEADER = "| # | status | severity | environment | file | item | reason | source | finding_id | phase | added_at | session_id |"
TABLE_SEP = "|---|--------|----------|-------------|------|------|--------|--------|-----------|-------|----------|------------|"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--session", required=True)
    return parser.parse_args()


def cell(value: Any) -> str:
    text = str(value or "").replace("\n", " ").replace("|", "\\|")
    return re.sub(r"\s+", " ", text).strip()


def split_row(row: str) -> list[str]:
    text = row.strip().strip("|")
    parts: list[str] = []
    current: list[str] = []
    escaped = False

    for char in text:
        if escaped:
            current.append(char)
            escaped = False
            continue
        if char == "\\":
            current.append(char)
            escaped = True
            continue
        if char == "|":
            parts.append("".join(current).strip().replace("\\|", "|"))
            current = []
            continue
        current.append(char)

    parts.append("".join(current).strip().replace("\\|", "|"))
    return parts


def extract_finding_id(row: str) -> str:
    parts = split_row(row)
    if len(parts) > 8:
        return parts[8]
    if len(parts) > 1 and parts[1] != "finding_id":
        return parts[1]
    return ""


def read_existing_backlog(path: Path) -> tuple[list[str], list[str], list[str], set[str]]:
    if not path.exists():
        return [BACKLOG_TITLE, ""], [], [], set()

    preamble: list[str] = []
    agent_rows: list[str] = []
    human_rows: list[str] = []
    seen: set[str] = set()
    section: str | None = None

    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if stripped == AGENT_HEADER:
            section = "agent"
            continue
        if stripped == HUMAN_HEADER:
            section = "human"
            continue
        if section is None:
            preamble.append(line)
            continue
        if stripped in {TABLE_HEADER, TABLE_SEP}:
            continue
        if line.startswith("| "):
            finding_id = extract_finding_id(line)
            if finding_id:
                seen.add(finding_id)
            (agent_rows if section == "agent" else human_rows).append(line)

    return preamble, agent_rows, human_rows, seen


def iter_findings(handoff_dir: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for path in sorted(handoff_dir.glob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        agent = data.get("agent_id") or path.stem
        for index, finding in enumerate(data.get("findings") or []):
            if not isinstance(finding, dict):
                continue
            finding_id = finding.get("finding_id") or finding.get("id") or f"{agent}-{index + 1}"
            rows.append(
                {
                    "finding_id": finding_id,
                    "severity": finding.get("severity") or finding.get("priority") or "medium",
                    "file": finding.get("file") or finding.get("path") or finding.get("area") or "",
                    "finding": finding.get("finding") or finding.get("message") or finding.get("what") or "",
                    "source": finding.get("source") or agent,
                    "requires_human": bool(finding.get("requires_human")),
                }
            )
    return rows


def make_row(finding: dict[str, Any], session: str, added_at: str) -> str:
    agent = finding.get("source") or finding.get("agent") or ""
    return (
        f"| 0 | open | {cell(finding.get('severity') or finding.get('priority') or 'medium')} | "
        f"{cell(finding.get('environment') or 'any')} | "
        f"{cell(finding.get('file') or finding.get('path') or finding.get('area') or '')} | "
        f"{cell(finding.get('finding') or finding.get('message') or finding.get('what') or '')} | "
        f"{cell(finding.get('reason') or '')} | "
        f"{cell(agent)} | "
        f"{cell(finding.get('finding_id') or finding.get('id') or '')} | "
        f"{cell(finding.get('phase') or 'review')} | "
        f"{cell(added_at)} | "
        f"{cell(session)} |"
    )


def renumber(rows: list[str]) -> list[str]:
    numbered: list[str] = []
    for index, row in enumerate(rows, 1):
        if not row.startswith("| "):
            numbered.append(row)
            continue
        parts = split_row(row)
        if not parts:
            numbered.append(row)
            continue
        parts[0] = str(index)
        numbered.append("| " + " | ".join(cell(part) for part in parts) + " |")
    return numbered


def update_preamble(preamble: list[str], timestamp: str) -> list[str]:
    if not preamble:
        preamble = [BACKLOG_TITLE, ""]

    updated: list[str] = []
    replaced = False
    for line in preamble:
        if line.startswith("Last updated:"):
            updated.append(f"Last updated: {timestamp}")
            replaced = True
        else:
            updated.append(line)

    if not replaced:
        insert_at = 2 if len(updated) >= 2 else len(updated)
        updated.insert(insert_at, f"Last updated: {timestamp}")
        updated.insert(insert_at + 1, "")

    return updated


def render_backlog(preamble: list[str], agent_rows: list[str], human_rows: list[str]) -> str:
    normalized_preamble = list(preamble)
    while normalized_preamble and normalized_preamble[-1] == "":
        normalized_preamble.pop()

    lines = [
        *normalized_preamble,
        "",
        AGENT_HEADER,
        "",
        TABLE_HEADER,
        TABLE_SEP,
        *renumber(agent_rows),
        "",
        HUMAN_HEADER,
        "",
        TABLE_HEADER,
        TABLE_SEP,
        *renumber(human_rows),
    ]
    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    args = parse_args()
    base = Path(".orchestrator") / "sessions" / args.session
    handoff_dir = base / "handoffs"
    if not handoff_dir.is_dir():
        print(f"handoff directory not found: {handoff_dir}", file=sys.stderr)
        return 2

    backlog = Path(".orchestrator/backlog.md")
    preamble, agent_rows, human_rows, seen = read_existing_backlog(backlog)
    new_agent_count = 0
    new_human_count = 0
    added_at = dt.datetime.now().strftime("%Y-%m-%dT%H:%M")

    for finding in iter_findings(handoff_dir):
        finding_id = str(finding["finding_id"])
        if finding_id in seen:
            continue
        row = make_row(finding, args.session, added_at)
        if finding["requires_human"]:
            human_rows.append(row)
            new_human_count += 1
        else:
            agent_rows.append(row)
            new_agent_count += 1
        seen.add(finding_id)

    if new_agent_count == 0 and new_human_count == 0:
        print("no new findings to seed", file=sys.stderr)
        return 1

    preamble = update_preamble(preamble, added_at)
    tmp = backlog.with_suffix(".md.tmp")
    tmp.write_text(render_backlog(preamble, agent_rows, human_rows), encoding="utf-8")
    tmp.replace(backlog)
    print(f"backlog seed: {new_agent_count} agent + {new_human_count} human rows added")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
