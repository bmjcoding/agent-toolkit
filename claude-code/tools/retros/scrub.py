"""
PII redaction utility for retro files.

Applied rules: R-01, R-02, R-03, R-04, R-05, R-06, R-07, R-10, R-11, R-12, R-13, R-14

Skipped rules:
  R-08: bmjcoding/claude-toolkit  -- bmjcoding org preserved (user decision)
  R-09: bmjcoding/agent-toolkit   -- bmjcoding org preserved (user decision)
  R-15: git@github.com:bmjcoding/ -- bmjcoding org preserved (user decision)
  R-16: commit SHAs               -- preserved (user decision)

Content-agnostic: treats .md and .json as raw text; no JSON parse/reserialize.
CLI: scrub.py INPUT OUTPUT [--dry-run]
"""

import re
import sys
import argparse
from pathlib import Path


# ---------------------------------------------------------------------------
# Rule definitions -- ordered so more-specific patterns run before catch-alls
# ---------------------------------------------------------------------------

# Each entry: (rule_id, compiled_pattern, replacement)
_RULES = []


def _add(rule_id, pattern, replacement, flags=0):
    _RULES.append((rule_id, re.compile(pattern, flags), replacement))


# R-10 and R-11 run first: they match specific JSON field patterns containing
# paths/project names that would otherwise be consumed by the catch-all rules.

# R-10: "project": "/Users/bmj/..." -> "project": "<path>"
_add("R-10", r'("project"\s*:\s*")(/Users/bmj[^"]*)(")', r'\1<path>\3')

# R-11: "project": "alt-central..." -> "project": "<project>"
_add("R-11", r'("project"\s*:\s*")(alt-central[^"]*)(")', r'\1<project>\3')

# R-01: /Users/bmj/Developer/git/ -> /Users/<user>/Developer/git/
_add("R-01", r"/Users/bmj/Developer/git/", "/Users/<user>/Developer/git/")

# R-02: /Users/bmj/.claude/ -> ~/.claude/
_add("R-02", r"/Users/bmj/\.claude/", "~/.claude/")

# R-03: /Users/bmj/ (catch-all, after R-01, R-02, and R-10)
_add("R-03", r"/Users/bmj/", "/Users/<user>/")

# R-04: -Users-bmj-Developer-git- -> -Users-<user>-Developer-git-
_add("R-04", r"-Users-bmj-Developer-git-", "-Users-<user>-Developer-git-")

# R-05: -Users-bmj--claude -> -Users-<user>--claude
_add("R-05", r"-Users-bmj--claude", "-Users-<user>--claude")

# R-06: bmjcoding/alt-central -> <user>/<project>
_add("R-06", r"bmjcoding/alt-central", "<user>/<project>")

# R-07: bmjcoding/ftfb-automation -> REDACT
_add("R-07", r"bmjcoding/ftfb-automation", "REDACT")

# R-12: alt-central (narrative) -> <project>
_add("R-12", r"alt-central", "<project>")

# R-13: ftfb-automation -> <project>
_add("R-13", r"ftfb-automation", "<project>")

# R-14: ftb-automation -> <project>
_add("R-14", r"ftb-automation", "<project>")


def scrub(text):
    """Apply all active redaction rules to *text* and return the result."""
    for _rule_id, pattern, replacement in _RULES:
        text = pattern.sub(replacement, text)
    return text


def main(argv=None):
    parser = argparse.ArgumentParser(
        prog="scrub.py",
        description="Apply PII redaction rules to a retro file (rules R-01..R-07, R-10..R-14).",
    )
    parser.add_argument("input", metavar="INPUT", help="Source file path")
    parser.add_argument("output", metavar="OUTPUT", help="Destination file path")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print a summary of changes without writing OUTPUT",
    )
    args = parser.parse_args(argv)

    input_path = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():
        print(f"scrub.py: error: input file not found: {input_path}", file=sys.stderr)
        return 1

    original = input_path.read_text(encoding="utf-8", errors="replace")
    redacted = scrub(original)

    if args.dry_run:
        print(f"[dry-run] Input:  {input_path}")
        print(f"[dry-run] Output: {output_path} (not written)")
        total_changes = 0
        for rule_id, pattern, _replacement in _RULES:
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
