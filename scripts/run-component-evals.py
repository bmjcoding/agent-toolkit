#!/usr/bin/env python3
"""Run executable component evals.

Eval files are intentionally lightweight: they exercise deterministic contracts
around local fixtures, definition lint output, and generated adapter drift. Legacy
prose-only eval files are skipped so teams can migrate them incrementally.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import tempfile
from collections import defaultdict
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]


class EvalError(AssertionError):
    """Raised when an executable eval assertion fails."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "paths",
        nargs="*",
        help="Eval files or directories to run. Defaults to all component evals.",
    )
    parser.add_argument(
        "--require-component",
        action="append",
        default=[],
        help="Fail if this component has no executable evals.",
    )
    return parser.parse_args()


def rel_path(path: Path) -> str:
    try:
        return path.resolve().relative_to(REPO_ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def discover_eval_files(paths: list[str]) -> list[Path]:
    if not paths:
        roots = [REPO_ROOT / "skills", REPO_ROOT / "agents"]
        files: list[Path] = []
        for root in roots:
            files.extend(root.glob("**/evals/evals.json"))
        return sorted(files)

    files = []
    for raw_path in paths:
        path = Path(raw_path)
        if not path.is_absolute():
            path = REPO_ROOT / path
        if path.is_dir():
            files.extend(path.glob("**/evals/evals.json"))
        else:
            files.append(path)
    return sorted(files)


def load_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError as error:
        raise EvalError(f"{rel_path(path)} is invalid JSON: {error}") from error


def component_name(data: dict[str, Any], eval_path: Path) -> str:
    return (
        data.get("component_name")
        or data.get("skill_name")
        or data.get("agent_name")
        or eval_path.parents[1].name
    )


def run_linter(target: Path, force_type: str | None = None) -> dict[str, Any]:
    command = [
        sys.executable,
        str(REPO_ROOT / "scripts" / "lint-definition.py"),
        str(target),
        "--format",
        "json",
    ]
    if force_type:
        command.extend(["--type", force_type])

    result = subprocess.run(
        command,
        cwd=REPO_ROOT,
        check=False,
        text=True,
        capture_output=True,
    )
    if result.returncode not in (0, 1):
        raise EvalError(
            f"lint-definition.py failed with exit {result.returncode}: "
            f"{result.stderr.strip()}"
        )
    try:
        parsed = json.loads(result.stdout)
    except json.JSONDecodeError as error:
        raise EvalError(f"lint-definition.py produced invalid JSON: {error}") from error
    return {"exit_code": result.returncode, "results": parsed}


def flatten_findings(results: dict[str, list[dict[str, str]]]) -> list[dict[str, str]]:
    return [finding for findings in results.values() for finding in findings]


def require_equal(actual: int, expected: int, label: str) -> None:
    if actual != expected:
        raise EvalError(f"expected {label}={expected}, got {actual}")


def require_at_least(actual: int, expected: int, label: str) -> None:
    if actual < expected:
        raise EvalError(f"expected {label}>={expected}, got {actual}")


def require_codes(
    actual_codes: set[str],
    expected_codes: list[str],
    label: str,
) -> None:
    missing = sorted(set(expected_codes) - actual_codes)
    if missing:
        raise EvalError(f"missing {label} codes: {', '.join(missing)}")


def reject_codes(actual_codes: set[str], rejected_codes: list[str], label: str) -> None:
    present = sorted(actual_codes & set(rejected_codes))
    if present:
        raise EvalError(f"unexpected {label} codes: {', '.join(present)}")


def assert_lint_expectations(payload: dict[str, Any], expect: dict[str, Any]) -> None:
    results = payload["results"]
    findings = flatten_findings(results)
    errors = [finding for finding in findings if finding["level"] == "error"]
    warnings = [finding for finding in findings if finding["level"] == "warning"]
    error_codes = {finding["code"] for finding in errors}
    warning_codes = {finding["code"] for finding in warnings}
    all_codes = {finding["code"] for finding in findings}

    if "exit_code" in expect:
        require_equal(payload["exit_code"], expect["exit_code"], "exit_code")
    if "file_count" in expect:
        require_equal(len(results), expect["file_count"], "file_count")
    if "min_file_count" in expect:
        require_at_least(len(results), expect["min_file_count"], "file_count")
    if "errors" in expect:
        require_equal(len(errors), expect["errors"], "errors")
    if "warnings" in expect:
        require_equal(len(warnings), expect["warnings"], "warnings")
    if "min_warnings" in expect:
        require_at_least(len(warnings), expect["min_warnings"], "warnings")

    require_codes(error_codes, expect.get("error_codes_include", []), "error")
    require_codes(warning_codes, expect.get("warning_codes_include", []), "warning")
    require_codes(all_codes, expect.get("codes_include", []), "finding")
    reject_codes(all_codes, expect.get("codes_exclude", []), "finding")


def write_fixture_files(root: Path, fixture: dict[str, Any]) -> None:
    files = fixture.get("files", [])
    if not files:
        raise EvalError("lint-fixture eval requires fixture.files")

    for item in files:
        path = root / item["path"]
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(item["content"])


def run_lint_eval(case: dict[str, Any]) -> None:
    target = REPO_ROOT / case["target"]
    payload = run_linter(target, case.get("force_type"))
    assert_lint_expectations(payload, case.get("expect", {}))


def run_lint_fixture_eval(case: dict[str, Any]) -> None:
    with tempfile.TemporaryDirectory(prefix="component-eval-") as temp_dir:
        root = Path(temp_dir)
        write_fixture_files(root, case["fixture"])
        target = root / case["target"]
        payload = run_linter(target, case.get("force_type"))
        assert_lint_expectations(payload, case.get("expect", {}))


def run_text_contains_eval(case: dict[str, Any]) -> None:
    target = REPO_ROOT / case["target"]
    text = target.read_text()
    expect = case.get("expect", {})

    for needle in expect.get("contains", []):
        if needle not in text:
            raise EvalError(f"{rel_path(target)} does not contain: {needle}")
    for needle in expect.get("not_contains", []):
        if needle in text:
            raise EvalError(f"{rel_path(target)} unexpectedly contains: {needle}")


def split_frontmatter(markdown: str) -> tuple[str, str]:
    if not markdown.startswith("---"):
        return "", markdown
    end = markdown.find("---", 3)
    if end == -1:
        return "", markdown
    return markdown[3:end], markdown[end + 3 :]


def parse_yaml_list(frontmatter: str, field_name: str) -> list[str]:
    match = re.search(
        rf"(?m)^{re.escape(field_name)}:\s*\n((?:[ \t]+-\s+.+\n?)*)",
        frontmatter,
    )
    if not match:
        return []
    values = []
    for line in match.group(1).splitlines():
        item_match = re.match(r"^[ \t]+-\s+(.+?)\s*$", line)
        if item_match:
            values.append(item_match.group(1).strip().strip("\"'"))
    return values


def parse_mode_table(markdown: str) -> dict[str, dict[str, str]]:
    modes: dict[str, dict[str, str]] = {}
    row_pattern = re.compile(r"^\|\s*(.+?)\s*\|\s*([a-z][a-z-]*)\s*\|\s*`([^`]+)`\s*\|$")
    for line in markdown.splitlines():
        match = row_pattern.match(line)
        if not match:
            continue
        trigger, mode, skill = match.groups()
        modes[mode] = {"trigger": trigger, "skill": skill}
    return modes


def run_agent_routing_contract_eval(case: dict[str, Any]) -> None:
    target = REPO_ROOT / case["target"]
    markdown = target.read_text()
    frontmatter, _ = split_frontmatter(markdown)
    declared_skills = set(parse_yaml_list(frontmatter, "skills"))
    actual_modes = parse_mode_table(markdown)

    expected_modes = case.get("expect", {}).get("modes", {})
    for mode, expected in expected_modes.items():
        if mode not in actual_modes:
            raise EvalError(f"{rel_path(target)} is missing route mode: {mode}")

        actual = actual_modes[mode]
        expected_skill = expected["skill"]
        if actual["skill"] != expected_skill:
            raise EvalError(
                f"{mode} routes to {actual['skill']}, expected {expected_skill}"
            )
        if expected_skill not in declared_skills:
            raise EvalError(
                f"{rel_path(target)} route {mode} uses undeclared skill "
                f"{expected_skill}"
            )
        for trigger in expected.get("triggers", []):
            if trigger not in actual["trigger"]:
                raise EvalError(f"{mode} route is missing trigger text: {trigger}")


def run_agent_adapter_contract_eval(case: dict[str, Any]) -> None:
    target = REPO_ROOT / case["target"]
    markdown = target.read_text()
    frontmatter, _ = split_frontmatter(markdown)
    adapters = parse_yaml_list(frontmatter, "adapters")
    expect = case.get("expect", {})

    require_at_least(len(adapters), expect.get("min_adapters", 1), "adapters")
    for required in expect.get("adapters_include", []):
        if required not in adapters:
            raise EvalError(f"{rel_path(target)} is missing adapter: {required}")

    for adapter in adapters:
        adapter_path = REPO_ROOT / adapter
        if not adapter_path.is_file():
            raise EvalError(f"adapter file does not exist: {adapter}")
        adapter_text = adapter_path.read_text()
        for needle in expect.get("adapter_contains", []):
            if needle not in adapter_text:
                raise EvalError(f"{adapter} does not contain: {needle}")


EVAL_RUNNERS = {
    "lint": run_lint_eval,
    "lint-fixture": run_lint_fixture_eval,
    "text-contains": run_text_contains_eval,
    "agent-routing-contract": run_agent_routing_contract_eval,
    "agent-adapter-contract": run_agent_adapter_contract_eval,
}


def validate_eval_file_schema(data: dict[str, Any], eval_path: Path) -> None:
    schema_version = data.get("schema_version")
    if schema_version != 1:
        raise EvalError(
            f"{rel_path(eval_path)} has unsupported schema_version: {schema_version}"
        )
    if not isinstance(data.get("evals"), list):
        raise EvalError(f"{rel_path(eval_path)} must contain an evals array")

    ids = [case.get("id") for case in data["evals"]]
    expected_ids = list(range(1, len(ids) + 1))
    if ids != expected_ids:
        raise EvalError(f"{rel_path(eval_path)} has non-sequential eval IDs: {ids}")

    for case in data["evals"]:
        for field in ("id", "name", "type", "expect"):
            if field not in case:
                raise EvalError(
                    f"{rel_path(eval_path)} eval id={case.get('id', '?')} "
                    f"missing field: {field}"
                )
        if case["type"] not in EVAL_RUNNERS:
            raise EvalError(
                f"{rel_path(eval_path)} eval id={case['id']} has unknown type: "
                f"{case['type']}"
            )


def run_eval_file(eval_path: Path) -> tuple[str, int, bool]:
    data = load_json(eval_path)
    name = component_name(data, eval_path)

    if "schema_version" not in data:
        print(f"SKIP legacy prose evals: {rel_path(eval_path)}")
        return name, 0, True

    validate_eval_file_schema(data, eval_path)
    executed = 0
    for case in data["evals"]:
        try:
            EVAL_RUNNERS[case["type"]](case)
        except EvalError as error:
            raise EvalError(
                f"{name} eval {case['id']} ({case['name']}) failed: {error}"
            ) from error
        executed += 1
        print(f"PASS {name}#{case['id']} {case['name']}")
    return name, executed, False


def main() -> int:
    args = parse_args()
    eval_files = discover_eval_files(args.paths)
    if not eval_files:
        print("No eval files found.", file=sys.stderr)
        return 1

    executed_by_component: dict[str, int] = defaultdict(int)
    legacy_files = 0

    try:
        for eval_path in eval_files:
            name, executed, legacy = run_eval_file(eval_path)
            executed_by_component[name] += executed
            if legacy:
                legacy_files += 1
    except EvalError as error:
        print(f"FAIL {error}", file=sys.stderr)
        return 1

    missing = [
        name for name in args.require_component if executed_by_component.get(name, 0) == 0
    ]
    if missing:
        print(
            "FAIL required components have no executable evals: "
            + ", ".join(sorted(missing)),
            file=sys.stderr,
        )
        return 1

    total_executed = sum(executed_by_component.values())
    print(
        f"Executed {total_executed} evals across "
        f"{len([v for v in executed_by_component.values() if v])} components; "
        f"skipped {legacy_files} legacy prose eval files."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
