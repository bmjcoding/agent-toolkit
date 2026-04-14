"""
PII redaction utility for retro files.

By default, applies built-in rules R-01..R-07, R-10..R-14 targeting the
bundled example patterns. For production use, provide a rule config file
(JSON) via --rules or SCRUB_RULES env var so per-user patterns are not
hardcoded in this source file.

Default built-in rules (applied when no --rules file is given):
  R-01: /Users/bmj/Developer/git/  -> /Users/<user>/Developer/git/
  R-02: /Users/bmj/.claude/        -> ~/.claude/
  R-03: /Users/bmj/                -> /Users/<user>/  (catch-all)
  R-04: -Users-bmj-Developer-git-  -> -Users-<user>-Developer-git-
  R-05: -Users-bmj--claude         -> -Users-<user>--claude
  R-06: bmjcoding/alt-central      -> <user>/<project>
  R-07: bmjcoding/ftfb-automation  -> REDACT
  R-10: "project": "/Users/bmj/..."  (JSON field) -> "project": "<path>"
  R-11: "project": "alt-central..." (JSON field) -> "project": "<project>"
  R-12: alt-central (narrative)    -> <project>
  R-13: ftfb-automation            -> <project>
  R-14: ftb-automation             -> <project>

Skipped built-in rules (preserved by user decision):
  R-08: bmjcoding/claude-toolkit   -- bmjcoding org preserved
  R-09: bmjcoding/agent-toolkit    -- bmjcoding org preserved
  R-15: git@github.com:bmjcoding/  -- bmjcoding org preserved
  R-16: commit SHAs                -- preserved

Content-agnostic: treats .md and .json as raw text; no JSON parse/reserialize.
CLI: scrub.py INPUT OUTPUT [--dry-run] [--rules RULES_JSON]
     SCRUB_RULES=/path/to/rules.json scrub.py INPUT OUTPUT
"""

import json
import os
import re
import sys
import argparse
from pathlib import Path


# ---------------------------------------------------------------------------
# Rule definitions -- ordered so more-specific patterns run before catch-alls
#
# ORDERING CONSTRAINT (do not reorder without understanding these dependencies):
#   1. R-10 and R-11 MUST run before R-03 and R-12.
#      R-10 matches `"project": "/Users/bmj/..."` and R-11 matches
#      `"project": "alt-central..."` as JSON field patterns. If R-03 (catch-all
#      path rule) or R-12 (narrative alt-central rule) ran first, they would
#      consume the path/name portion of these JSON field values before R-10/R-11
#      could match the full `"project": "..."` structure. The result would be a
#      partial substitution that produces malformed JSON output.
#   2. R-01 and R-02 (specific path prefixes) MUST run before R-03 (catch-all).
#      R-01 maps `/Users/bmj/Developer/git/` and R-02 maps `/Users/bmj/.claude/`
#      to distinct placeholders. R-03 maps the remaining `/Users/bmj/` occurrences
#      to `/Users/<user>/`. If R-03 ran first, R-01 and R-02 would never match.
#   3. R-06 (specific `bmjcoding/alt-central` compound) MUST run before R-12
#      (narrative `alt-central` standalone). Same specificity principle.
#
# This ordering was caught and fixed during the 2026-04-14 pipeline (ST-03 agent
# proactively reordered R-10/R-11 before R-03). Codified here to prevent
# accidental reversion by future editors.
#
# When loading rules from a config file (--rules / SCRUB_RULES), the array
# order in the config file is the applied order. See scrub-rules.example.json
# for a template with the same ordering constraints documented inline.
# ---------------------------------------------------------------------------

# Each entry: (rule_id, compiled_pattern, replacement)
_BUILTIN_RULES_SPEC = [
    # R-10 and R-11 run first: they match specific JSON field patterns containing
    # paths/project names that would otherwise be consumed by the catch-all rules.
    # See ORDERING CONSTRAINT above for why this ordering is required.
    ("R-10", r'("project"\s*:\s*")(/Users/bmj[^"]*)(")', r'\1<path>\3', 0),
    ("R-11", r'("project"\s*:\s*")(alt-central[^"]*)(")', r'\1<project>\3', 0),
    # R-01: /Users/bmj/Developer/git/ -> /Users/<user>/Developer/git/
    ("R-01", r"/Users/bmj/Developer/git/", "/Users/<user>/Developer/git/", 0),
    # R-02: /Users/bmj/.claude/ -> ~/.claude/
    ("R-02", r"/Users/bmj/\.claude/", "~/.claude/", 0),
    # R-03: /Users/bmj/ (catch-all, after R-01, R-02, and R-10)
    ("R-03", r"/Users/bmj/", "/Users/<user>/", 0),
    # R-04: -Users-bmj-Developer-git- -> -Users-<user>-Developer-git-
    ("R-04", r"-Users-bmj-Developer-git-", "-Users-<user>-Developer-git-", 0),
    # R-05: -Users-bmj--claude -> -Users-<user>--claude
    ("R-05", r"-Users-bmj--claude", "-Users-<user>--claude", 0),
    # R-06: bmjcoding/alt-central -> <user>/<project>
    ("R-06", r"bmjcoding/alt-central", "<user>/<project>", 0),
    # R-07: bmjcoding/ftfb-automation -> REDACT
    ("R-07", r"bmjcoding/ftfb-automation", "REDACT", 0),
    # R-12: alt-central (narrative) -> <project>
    ("R-12", r"alt-central", "<project>", 0),
    # R-13: ftfb-automation -> <project>
    ("R-13", r"ftfb-automation", "<project>", 0),
    # R-14: ftb-automation -> <project>
    ("R-14", r"ftb-automation", "<project>", 0),
]

_BUILTIN_RULES = [
    (rule_id, re.compile(pattern, flags), replacement)
    for rule_id, pattern, replacement, flags in _BUILTIN_RULES_SPEC
]


def _load_rules_from_file(rules_path):
    """Load redaction rules from a JSON config file.

    Returns a list of (rule_id, compiled_pattern, replacement) tuples in
    config array order. Raises ValueError on malformed config.

    Config format: {"rules": [{"id": "R-01", "pattern": "...", "replacement": "...",
                                "flags_dotall": false}, ...]}
    See scrub-rules.example.json for a documented template.
    """
    path = Path(rules_path)
    if not path.exists():
        raise FileNotFoundError(f"Rules file not found: {path}")
    try:
        config = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON in rules file {path}: {exc}") from exc

    rules_list = config.get("rules")
    if not isinstance(rules_list, list):
        raise ValueError(f"Rules file {path} must have a top-level 'rules' array")

    compiled = []
    for entry in rules_list:
        if not isinstance(entry, dict):
            continue
        rule_id = entry.get("id", "unknown")
        pattern = entry.get("pattern")
        replacement = entry.get("replacement", "")
        if not pattern:
            raise ValueError(f"Rule {rule_id} in {path} has no 'pattern' field")
        flags = re.DOTALL if entry.get("flags_dotall") else 0
        try:
            compiled.append((rule_id, re.compile(pattern, flags), replacement))
        except re.error as exc:
            raise ValueError(f"Rule {rule_id} pattern compile error: {exc}") from exc

    return compiled


def _resolve_rules(rules_path=None):
    """Return the active rule list.

    Priority: --rules arg > SCRUB_RULES env var > built-in defaults.
    """
    source = rules_path or os.environ.get("SCRUB_RULES")
    if source:
        return _load_rules_from_file(source), str(source)
    return _BUILTIN_RULES, "built-in"


def scrub(text, rules=None):
    """Apply all active redaction rules to *text* and return the result.

    If *rules* is None, uses the built-in rule set.
    """
    if rules is None:
        rules = _BUILTIN_RULES
    for _rule_id, pattern, replacement in rules:
        text = pattern.sub(replacement, text)
    return text


def main(argv=None):
    parser = argparse.ArgumentParser(
        prog="scrub.py",
        description=(
            "Apply PII redaction rules to a retro file. "
            "Uses built-in rules by default; supply --rules to override with a "
            "JSON config file (see scrub-rules.example.json for format)."
        ),
    )
    parser.add_argument("input", metavar="INPUT", help="Source file path")
    parser.add_argument("output", metavar="OUTPUT", help="Destination file path")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print a summary of changes without writing OUTPUT",
    )
    parser.add_argument(
        "--rules",
        metavar="RULES_JSON",
        help=(
            "Path to a JSON rule config file. Overrides built-in rules and the "
            "SCRUB_RULES environment variable. See scrub-rules.example.json."
        ),
    )
    args = parser.parse_args(argv)

    try:
        active_rules, rules_source = _resolve_rules(args.rules)
    except (FileNotFoundError, ValueError) as exc:
        print(f"scrub.py: error: {exc}", file=sys.stderr)
        return 1

    input_path = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():
        print(f"scrub.py: error: input file not found: {input_path}", file=sys.stderr)
        return 1

    original = input_path.read_text(encoding="utf-8", errors="replace")
    redacted = scrub(original, rules=active_rules)

    if args.dry_run:
        print(f"[dry-run] Input:  {input_path}")
        print(f"[dry-run] Output: {output_path} (not written)")
        print(f"[dry-run] Rules:  {rules_source} ({len(active_rules)} rules)")
        total_changes = 0
        for rule_id, pattern, _replacement in active_rules:
            matches = pattern.findall(original)
            count = len(matches)
            if count:
                print(f"  {rule_id}: {count} match(es)")
                total_changes += count
        print(f"[dry-run] Total matches: {total_changes}")
        if original == redacted:
            print("[dry-run] No changes would be made.")
        else:
            orig_lines = original.splitlines()
            redc_lines = redacted.splitlines()
            changed_lines = sum(
                1 for a, b in zip(orig_lines, redc_lines) if a != b
            )
            print(f"[dry-run] Lines with changes: {changed_lines}")
        return 0

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(redacted, encoding="utf-8")
    print(f"scrub.py: wrote {output_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
