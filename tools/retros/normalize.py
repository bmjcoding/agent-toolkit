"""
normalize.py — Gen1..Gen4 retro JSON normalizer to v5.0 schema.

Rules applied (15 total):
  1.  Set schema_version = '5.0'
  2.  Rename: session -> session_id (if present)
  3.  Rename: gate_verdict -> verdict (if present)
  4.  Rename: wall_clock_minutes -> wall_clock_min (if present)
  5.  Rename: estimated_cost_usd -> total_cost_usd (if present and total_cost_usd absent)
  6.  Rename: fix_churn_files -> fix_churn (if present and fix_churn absent)
  7.  Rename: wall_clock_minutes -> wall_clock_min (covered above; also duration_min -> wall_clock_min)
  8.  Findings normalization:
        - Schema A/B: {critical, high, medium, low[, total]} -> strip 'total', keep severity keys
        - Schema C: {total, p0, p1, p2} (review-skill) -> remap p0->critical, p1->high, p2->medium, low=0
        - Schema D: flat findings_critical/high/medium/low -> fold into findings object
  9.  Recommendations normalization:
        - int -> {total: N, p0: null, p1: null, p2: null, fix: null, pattern: null}
        - null -> {total: null, p0: null, p1: null, p2: null, fix: null, pattern: null}
        - dict: ensure fix/pattern keys from fix_count/pattern_count; fold root-level p0/p1/p2
  10. root_causes: default {} if absent or null
  11. Timestamp strip-hyphens: session_id like YYYY-MM-DDTHHMMSS -> YYYYMMDDTHHMMSS;
      also derive session_id from 'timestamp' field if session_id absent
  12. Derive 'date' from session_id if absent or if date contains a time component
  13. Required-field defaults for missing required fields
  14. Emit <input>.normalized.json alongside original (or in --output-dir)
  15. Verdict canonicalization: replace spaces with underscores in verdict value
      (e.g. 'CLEAR TO SHIP' -> 'CLEAR_TO_SHIP', 'SHIP WITH CAUTION' -> 'SHIP_WITH_CAUTION',
      'SHIPPED CLEAN' -> 'SHIPPED_CLEAN'). Null verdict is preserved as-is.

Does NOT modify originals.

CLI: normalize.py INPUT [...] [--output-dir DIR] [--dry-run]
Exit 0 on success.
"""

import argparse
import json
import re
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_HYPHEN_TIMESTAMP_RE = re.compile(
    r"^(\d{4})-(\d{2})-(\d{2})T(\d{6})$"
)
# Full ISO-8601 with colons in time part: YYYY-MM-DDTHH:MM:SS
_ISO_COLON_TIMESTAMP_RE = re.compile(
    r"^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$"
)
_COMPACT_TIMESTAMP_RE = re.compile(r"^\d{8}T\d{6}$")
_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

# Matches a timestamp in the filename stem (with or without date hyphens).
# Examples: 2026-04-07T164326, 20260413T142423
_FILENAME_TIMESTAMP_RE = re.compile(r"(\d{4}-?\d{2}-?\d{2}T\d{6})")


def _normalize_session_id(raw: str) -> str:
    """Strip hyphens (and colons) from timestamp strings to compact YYYYMMDDTHHMMSS.

    Handles:
      - YYYY-MM-DDTHHMMSS  (hyphens in date only)
      - YYYY-MM-DDTHH:MM:SS (full ISO-8601 with colons)
    If already compact (YYYYMMDDTHHMMSS), return as-is. If unrecognised, return as-is.
    """
    m = _HYPHEN_TIMESTAMP_RE.match(raw)
    if m:
        return f"{m.group(1)}{m.group(2)}{m.group(3)}T{m.group(4)}"
    m = _ISO_COLON_TIMESTAMP_RE.match(raw)
    if m:
        return f"{m.group(1)}{m.group(2)}{m.group(3)}T{m.group(4)}{m.group(5)}{m.group(6)}"
    return raw


def _date_from_session_id(session_id: str) -> str | None:
    """Derive YYYY-MM-DD from a compact session_id YYYYMMDDTHHMMSS."""
    if _COMPACT_TIMESTAMP_RE.match(session_id):
        d = session_id[:8]
        return f"{d[:4]}-{d[4:6]}-{d[6:8]}"
    return None


def _make_findings(raw_findings: dict | None, data: dict) -> dict:
    """Normalise the findings field to {critical, high, medium, low}.

    Handles four input schemas:
      A/B: {critical, high, medium, low[, total]}
      C:   {total, p0, p1, p2}  (review-skill format)
      D:   flat findings_critical/findings_high etc. on data root
    """
    # Schema D: flat scalar fields on root — takes precedence when findings is
    # absent or doesn't contain severity keys
    has_flat = any(
        k in data for k in ("findings_critical", "findings_high", "findings_medium", "findings_low")
    )

    if has_flat:
        return {
            "critical": data.get("findings_critical") or 0,
            "high": data.get("findings_high") or 0,
            "medium": data.get("findings_medium") or 0,
            "low": data.get("findings_low") or 0,
        }

    if not raw_findings:
        return {"critical": 0, "high": 0, "medium": 0, "low": 0}

    # Schema C: review-skill {total, p0, p1, p2}
    if "p0" in raw_findings or "p1" in raw_findings or "p2" in raw_findings:
        return {
            "critical": raw_findings.get("p0") or 0,
            "high": raw_findings.get("p1") or 0,
            "medium": raw_findings.get("p2") or 0,
            "low": 0,
        }

    # Schema A/B: {critical, high, medium, low[, total]} — strip 'total'
    return {
        "critical": raw_findings.get("critical") or 0,
        "high": raw_findings.get("high") or 0,
        "medium": raw_findings.get("medium") or 0,
        "low": raw_findings.get("low") or 0,
    }


def _make_recommendations(raw_recs, data: dict) -> dict:
    """Normalise recommendations to {total, p0, p1, p2, fix, pattern}.

    Sources:
      - raw_recs may be int, None, or dict
      - Root-level p0/p1/p2/fix_count/pattern_count are folded in if present
    """
    template = {"total": None, "p0": None, "p1": None, "p2": None, "fix": None, "pattern": None}

    if raw_recs is None:
        rec = dict(template)
    elif isinstance(raw_recs, int):
        rec = dict(template)
        rec["total"] = raw_recs
    elif isinstance(raw_recs, dict):
        rec = dict(template)
        rec["total"] = raw_recs.get("total")
        rec["p0"] = raw_recs.get("p0")
        rec["p1"] = raw_recs.get("p1")
        rec["p2"] = raw_recs.get("p2")
        # fix: prefer 'fix', fall back to 'fix_count'
        rec["fix"] = raw_recs.get("fix") if raw_recs.get("fix") is not None else raw_recs.get("fix_count")
        # pattern: prefer 'pattern', fall back to 'pattern_count'
        rec["pattern"] = raw_recs.get("pattern") if raw_recs.get("pattern") is not None else raw_recs.get("pattern_count")
    else:
        rec = dict(template)

    # Fold root-level p0/p1/p2 if recommendations dict doesn't have them
    for pkey in ("p0", "p1", "p2"):
        if rec[pkey] is None and pkey in data:
            val = data[pkey]
            if isinstance(val, int):
                rec[pkey] = val

    # Fold root-level fix_count/pattern_count
    if rec["fix"] is None and "fix_count" in data and isinstance(data["fix_count"], int):
        rec["fix"] = data["fix_count"]
    if rec["pattern"] is None and "pattern_count" in data and isinstance(data["pattern_count"], int):
        rec["pattern"] = data["pattern_count"]

    return rec


# ---------------------------------------------------------------------------
# Core normalizer
# ---------------------------------------------------------------------------

def normalize(data: dict, source_path: "Path | str | None" = None) -> dict:
    """Return a new dict with all 14 normalization rules applied.

    The original dict is never mutated.

    Args:
        data: The raw retro dict to normalize.
        source_path: Optional path to the source file. Used to derive session_id
            from the filename stem when the data contains no session_id or
            timestamp field (e.g. improve-cycle records).
    """
    d = dict(data)

    # --- Rule 1: schema_version ---
    d["schema_version"] = "5.0"

    # --- Rule 2: session -> session_id ---
    if "session" in d and "session_id" not in d:
        d["session_id"] = d.pop("session")
    elif "session" in d:
        d.pop("session")

    # --- Rule 3: gate_verdict -> verdict ---
    if "gate_verdict" in d and "verdict" not in d:
        d["verdict"] = d.pop("gate_verdict")
    elif "gate_verdict" in d:
        d.pop("gate_verdict")

    # --- Rule 15: verdict canonicalization (spaces -> underscores) ---
    if "verdict" in d and isinstance(d["verdict"], str):
        d["verdict"] = d["verdict"].replace(" ", "_")

    # --- Rule 4: wall_clock_minutes -> wall_clock_min ---
    if "wall_clock_minutes" in d and "wall_clock_min" not in d:
        d["wall_clock_min"] = d.pop("wall_clock_minutes")
    elif "wall_clock_minutes" in d:
        d.pop("wall_clock_minutes")

    # --- Rule 7 (continued): duration_min -> wall_clock_min ---
    if "duration_min" in d and "wall_clock_min" not in d:
        d["wall_clock_min"] = d.pop("duration_min")
    elif "duration_min" in d:
        d.pop("duration_min")

    # --- Rule 5: estimated_cost_usd -> total_cost_usd ---
    if "estimated_cost_usd" in d and "total_cost_usd" not in d:
        d["total_cost_usd"] = d.pop("estimated_cost_usd")
    elif "estimated_cost_usd" in d:
        d.pop("estimated_cost_usd")

    # --- Rule 6: fix_churn_files -> fix_churn ---
    if "fix_churn_files" in d and "fix_churn" not in d:
        d["fix_churn"] = d.pop("fix_churn_files")
    elif "fix_churn_files" in d:
        d.pop("fix_churn_files")

    # --- Rule 11: derive / clean session_id ---
    # First, try to get session_id from 'timestamp' if still absent
    if "session_id" not in d and "timestamp" in d:
        raw_ts = d["timestamp"]
        # timestamp field may be in hyphenated form YYYY-MM-DDTHHMMSS
        d["session_id"] = _normalize_session_id(raw_ts)
    elif "session_id" in d:
        d["session_id"] = _normalize_session_id(str(d["session_id"]))

    # Rule 11 (continued): if session_id still absent, derive from filename stem.
    # Handles improve-cycle records and early pre-session-id-era retros whose
    # filenames always embed the timestamp (e.g. 2026-04-07T164326-improve.json
    # or 20260413T211547-improve.json).
    if "session_id" not in d and source_path is not None:
        stem = Path(source_path).stem  # e.g. '2026-04-07T164326-improve'
        m = _FILENAME_TIMESTAMP_RE.search(stem)
        if m:
            d["session_id"] = _normalize_session_id(m.group(1))

    # --- Rule 12: derive 'date' from session_id ---
    session_id = d.get("session_id", "")
    raw_date = d.get("date")

    # If date is absent, or contains a time component (not pure YYYY-MM-DD), derive
    if not raw_date or not _DATE_RE.match(str(raw_date)):
        derived = _date_from_session_id(session_id)
        if derived:
            d["date"] = derived
        # If we can't derive, leave as-is (may be None / missing)

    # --- Rule 8: findings normalization ---
    raw_findings = d.get("findings")
    normalised_findings = _make_findings(
        raw_findings if isinstance(raw_findings, dict) else None,
        d,
    )
    d["findings"] = normalised_findings

    # Compute findings_total from normalised findings
    d["findings_total"] = sum(normalised_findings.values())

    # Remove flat findings_* fields from root (they've been folded)
    for fkey in ("findings_critical", "findings_high", "findings_medium", "findings_low"):
        d.pop(fkey, None)

    # --- Rule 9: recommendations normalization ---
    raw_recs = d.get("recommendations")
    d["recommendations"] = _make_recommendations(raw_recs, d)

    # Remove root-level p0/p1/p2/fix_count/pattern_count that have been folded
    for rkey in ("p0", "p1", "p2", "fix_count", "pattern_count"):
        d.pop(rkey, None)

    # --- Rule 10: root_causes default {} ---
    if not d.get("root_causes"):
        d["root_causes"] = {}

    # --- Rule 13: required-field defaults ---
    # Required per schema: schema_version, subject, session_id, date, run_type, depth,
    # findings, findings_total, recommendations, quality_iterations, agents_spawned,
    # files_changed, user_interventions, root_causes
    _req_int_defaults = {
        "quality_iterations": 0,
        "agents_spawned": 0,
        "files_changed": 0,
        "user_interventions": 0,
    }
    for field, default in _req_int_defaults.items():
        if d.get(field) is None:
            d[field] = default

    if d.get("subject") is None:
        d["subject"] = ""

    if d.get("run_type") is None:
        d["run_type"] = "single-agent"

    if d.get("depth") is None:
        d["depth"] = "standard"

    # --- Remove 'timestamp' if we've derived session_id from it ---
    # Keep timestamp in data only if it wasn't the sole source; generally remove to avoid confusion.
    # Actually: leave timestamp in place — additionalProperties: true allows extra fields.
    # But do remove it if it was an alias for session_id to avoid duplicate data.
    if "timestamp" in d and "session_id" in d:
        # session_id now carries the canonical value; drop the old alias
        d.pop("timestamp", None)

    return d


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _output_path(input_path: Path, output_dir: Path | None) -> Path:
    """Return the output path for a given input file."""
    stem = input_path.stem  # e.g. '2026-04-07T121115'
    name = f"{stem}.normalized.json"
    if output_dir is not None:
        return output_dir / name
    return input_path.parent / name


def _process_file(input_path: Path, output_dir: Path | None, dry_run: bool) -> bool:
    """Normalize one file. Returns True on success, False on error."""
    if not input_path.exists():
        print(f"normalize.py: error: file not found: {input_path}", file=sys.stderr)
        return False

    try:
        raw = input_path.read_text(encoding="utf-8", errors="replace")
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        print(f"normalize.py: error: JSON parse error in {input_path}: {exc}", file=sys.stderr)
        return False

    if not isinstance(data, dict):
        print(
            f"normalize.py: error: expected JSON object in {input_path}, got {type(data).__name__}",
            file=sys.stderr,
        )
        return False

    result = normalize(data, source_path=input_path)
    out_path = _output_path(input_path, output_dir)

    if dry_run:
        # Print a summary of what would change
        print(f"[dry-run] Input:  {input_path}")
        print(f"[dry-run] Output: {out_path} (not written)")
        changed_keys = []
        for key, val in result.items():
            if key not in data or data[key] != val:
                changed_keys.append(key)
        removed_keys = [k for k in data if k not in result]
        if changed_keys:
            print(f"  Added/changed keys: {', '.join(changed_keys)}")
        if removed_keys:
            print(f"  Removed keys: {', '.join(removed_keys)}")
        if not changed_keys and not removed_keys:
            print("  No changes.")
        return True

    # Ensure output directory exists
    out_path.parent.mkdir(parents=True, exist_ok=True)

    serialized = json.dumps(result, indent=2, ensure_ascii=False)
    out_path.write_text(serialized + "\n", encoding="utf-8")
    print(f"normalize.py: wrote {out_path}")
    return True


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="normalize.py",
        description=(
            "Normalize Gen1..Gen4 retro JSON files to v5.0 schema. "
            "Emits <input>.normalized.json alongside original. Does NOT modify originals."
        ),
    )
    parser.add_argument(
        "inputs",
        metavar="INPUT",
        nargs="+",
        help="One or more retro JSON files to normalize.",
    )
    parser.add_argument(
        "--output-dir",
        metavar="DIR",
        default=None,
        help="Write all output files to DIR instead of alongside each input.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be written without writing any files.",
    )
    args = parser.parse_args(argv)

    output_dir = Path(args.output_dir) if args.output_dir else None
    if output_dir is not None and not args.dry_run:
        output_dir.mkdir(parents=True, exist_ok=True)

    success = True
    for input_str in args.inputs:
        input_path = Path(input_str)
        ok = _process_file(input_path, output_dir, args.dry_run)
        if not ok:
            success = False

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
