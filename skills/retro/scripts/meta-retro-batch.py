#!/usr/bin/env python3
"""Generate a meta-retro markdown from the orchestrator retro JSON corpus.

Reads retro JSON files from the resolved STATE_ROOT retro corpus
(`STATE_ROOT/retros/orchestrator/*.json`) or --retro-dir
and produces a timestamped meta-retro markdown file every N pipelines (default 10).

Both primary retros (YYYYMMDDTHHMMSS.json) and improve-cycle retros
(*-improve.json) are loaded from the corpus. Primary retros drive the
pipeline count and most analysis categories. Improve-cycle retros are
cross-referenced for P2 recommendation application tracking.

Usage:
    python3 scripts/meta-retro-batch.py [OPTIONS]

Options:
    --retro-dir DIR   Directory containing retro JSON files
                      (default: resolved STATE_ROOT/retros/orchestrator)
    --out-dir DIR     Directory for meta-retro output files
                      (default: resolved STATE_ROOT/retros/meta)
    --interval N      Produce meta-retro every N primary pipelines (default: 10)
    --dry-run         Print output to stdout instead of writing a file
    --force           Generate meta-retro regardless of interval check
    --help            Show this help message and exit

Exit codes:
    0  Success (including no-action when interval not reached)
    1  Unrecoverable error
"""

import argparse
import json
import re
import sys
import warnings
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path


def resolve_state_root() -> Path:
    candidates = [
        Path(".agents"),
        Path(".claude"),
        Path(".codex"),
        Path.home() / ".agents",
        Path.home() / ".claude",
        Path.home() / ".codex",
    ]
    for candidate in candidates:
        if candidate.is_dir():
            return candidate
    return Path(".agents")


# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    # --retro-dir and --out-dir accept arbitrary paths; the script runs as the user's own
    # process and trusts filesystem permissions to constrain access. Do not use on untrusted
    # input without adding a validator.
    parser = argparse.ArgumentParser(
        prog="meta-retro-batch.py",
        description="Generate a meta-retro markdown from the orchestrator retro JSON corpus.",
        add_help=True,
    )
    parser.add_argument(
        "--retro-dir",
        default=None,
        help="Directory containing retro JSON files (default: resolved STATE_ROOT/retros/orchestrator)",
    )
    parser.add_argument(
        "--out-dir",
        default=None,
        help="Directory for meta-retro output files (default: resolved STATE_ROOT/retros/meta)",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=10,
        metavar="N",
        help="Produce meta-retro every N primary pipelines (default: 10)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print output to stdout instead of writing a file",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Generate meta-retro regardless of interval check",
    )
    return parser


# ---------------------------------------------------------------------------
# JSON loading helpers
# ---------------------------------------------------------------------------

def load_json_file(path: Path) -> dict | None:
    """Load a JSON file; return None on any error and emit a warning."""
    try:
        with path.open(encoding="utf-8") as fh:
            return json.load(fh)
    except json.JSONDecodeError as exc:
        warnings.warn(f"Malformed JSON in {path}: {exc} — skipping", stacklevel=2)
        return None
    except OSError as exc:
        warnings.warn(f"Cannot read {path}: {exc} — skipping", stacklevel=2)
        return None


def load_corpus(retro_dir: Path, *, dir_missing_is_error: bool = True) -> tuple[list[dict], list[dict]]:
    """Load all retro JSON files from retro_dir.

    Returns:
        (primary_retros, improve_retros)
        primary_retros: sorted list of primary retro records (YYYYMMDDTHHMMSS.json)
        improve_retros: sorted list of improve-cycle records (*-improve.json)

    Args:
        dir_missing_is_error: when True (default), a missing retro_dir exits with code 1.
            Set to False when using the default path so a fresh install (no retros yet)
            is treated as an empty corpus and exits 0 rather than erroring.
    """
    if not retro_dir.is_dir():
        if dir_missing_is_error:
            print(f"ERROR: retro-dir not found: {retro_dir}", file=sys.stderr)
            sys.exit(1)
        # Default path does not exist yet — no retros produced; treat as empty corpus.
        return [], []

    primary: list[dict] = []
    improve: list[dict] = []

    for path in sorted(retro_dir.glob("*.json")):
        data = load_json_file(path)
        if data is None:
            continue
        # Tag with source filename for downstream reference
        data["_source_file"] = path.name

        if path.stem.endswith("-improve") or data.get("type") == "improve":
            improve.append(data)
        else:
            primary.append(data)

    return primary, improve


# ---------------------------------------------------------------------------
# Last-meta tracking
# ---------------------------------------------------------------------------

_META_FILENAME_RE = re.compile(
    r"^(\d{4}-\d{2}-\d{2}T\d{6})-meta-retro-N(\d+)\.md$"
)


def find_last_meta(out_dir: Path) -> tuple[str | None, int]:
    """Return (filename, count) for the most recent meta-retro file.

    The count is extracted from the Ncount suffix in the filename.
    Returns (None, 0) if no prior meta-retro exists.
    """
    if not out_dir.is_dir():
        return None, 0

    candidates: list[tuple[str, int]] = []
    for path in out_dir.glob("*-meta-retro-N*.md"):
        m = _META_FILENAME_RE.match(path.name)
        if m:
            candidates.append((path.name, int(m.group(2))))

    if not candidates:
        return None, 0

    # Sort by filename (timestamp prefix ensures correct order)
    candidates.sort(key=lambda x: x[0])
    return candidates[-1]


# ---------------------------------------------------------------------------
# Analysis helpers
# ---------------------------------------------------------------------------

# Pattern to pull "#N (Px) — description" or "rec-id" strings from text
_REC_ID_RE = re.compile(r"#(\d+)\s*\(P[012]\)", re.IGNORECASE)


def _findings_dict(retro: dict) -> dict:
    """Normalise the findings field to a dict with critical/high/medium/low keys."""
    f = retro.get("findings")
    if isinstance(f, dict):
        return {k: int(v) for k, v in f.items() if k in ("critical", "high", "medium", "low")}
    # Some older retros store individual top-level keys
    result = {}
    for sev in ("critical", "high", "medium", "low"):
        key = f"findings_{sev}"
        if key in retro:
            result[sev] = int(retro[key])
        elif f"findings_{sev}_count" in retro:
            result[sev] = int(retro[f"findings_{sev}_count"])
    if result:
        return result
    return {}


def _rec_ids_from_retro(retro: dict) -> list[str]:
    """Extract recommendation IDs from a primary retro (best-effort)."""
    ids: list[str] = []
    recs = retro.get("recommendations")
    if isinstance(recs, list):
        for item in recs:
            if isinstance(item, dict):
                rid = item.get("id") or item.get("finding_id")
                if rid:
                    ids.append(str(rid))
            elif isinstance(item, str):
                ids.append(item)
    # Fall back to p0/p1/p2 counts — no structured IDs available in this format
    return ids


def _applied_rec_ids_from_improve(improve: dict) -> set[str]:
    """Extract recommendation IDs that were applied in an improve record."""
    applied: set[str] = set()
    for field in ("recommendations_applied", "recommendations_pre_applied"):
        items = improve.get(field, [])
        if not isinstance(items, list):
            continue
        for item in items:
            if isinstance(item, str):
                m = _REC_ID_RE.search(item)
                if m:
                    applied.add(m.group(1))
    # Also scan the changes list
    for change in improve.get("changes", []):
        if isinstance(change, dict):
            rec = change.get("recommendation", "")
            m = _REC_ID_RE.search(str(rec))
            if m:
                applied.add(m.group(1))
    return applied


def _p2_ids_from_retro(retro: dict) -> list[str]:
    """Extract P2 recommendation identifiers from a primary retro."""
    p2_items: list[str] = []
    # Newer format: retro.p2 is an int count; no structured P2 list available
    # Try looking for explicit p2_items or recommendations list with priority filter
    recs = retro.get("recommendations")
    if isinstance(recs, list):
        for item in recs:
            if isinstance(item, dict) and str(item.get("priority", "")).upper() == "P2":
                rid = item.get("id") or item.get("finding_id") or item.get("text", "")[:60]
                p2_items.append(str(rid))
    # Alternatively check skipped_reason keys in improve records (not applicable here)
    return p2_items


def _source_ts(retro: dict) -> str:
    """Return a display timestamp for a retro record."""
    return retro.get("date") or retro.get("timestamp") or retro.get("_source_file", "unknown")


# ---------------------------------------------------------------------------
# Analysis categories
# ---------------------------------------------------------------------------

def analyse_recurring_unresolved(
    primary_retros: list[dict],
    improve_retros: list[dict],
) -> str:
    """Section 1: Recurring unresolved findings.

    Groups recommendation/finding IDs across retros and surfaces any that
    appear in 3+ retros without a resolution marker in a paired improve run.
    """
    lines: list[str] = ["## 1. Recurring Unresolved Findings\n"]

    # Build set of IDs that were applied/resolved
    resolved_ids: set[str] = set()
    for imp in improve_retros:
        resolved_ids |= _applied_rec_ids_from_improve(imp)

    # Count appearances per ID across primary retros
    id_appearances: Counter = Counter()
    id_sources: defaultdict[str, list[str]] = defaultdict(list)
    for retro in primary_retros:
        ids = _rec_ids_from_retro(retro)
        seen_in_this = set()
        for rid in ids:
            if rid not in seen_in_this:
                id_appearances[rid] += 1
                id_sources[rid].append(_source_ts(retro))
                seen_in_this.add(rid)

    recurring = {
        rid: count
        for rid, count in id_appearances.items()
        if count >= 3 and rid not in resolved_ids
    }

    if not recurring:
        lines.append("No finding IDs appeared in 3+ primary retros without a resolution marker.\n")
        lines.append(
            "> **Note**: The current retro JSON schema stores `recommendations` as an integer "
            "count rather than a structured list in most retros, so this analysis is limited to "
            "retros that embed structured recommendation objects. Upgrade to structured IDs for "
            "richer tracking.\n"
        )
    else:
        lines.append(
            f"**{len(recurring)} finding ID(s) appeared in 3+ retros without resolution:**\n"
        )
        for rid, count in sorted(recurring.items(), key=lambda x: -x[1]):
            sources = ", ".join(id_sources[rid][:5])
            lines.append(f"- `#{rid}` — appeared {count} times (e.g. {sources})")
        lines.append("")

    return "\n".join(lines)


def analyse_category_skew(primary_retros: list[dict]) -> str:
    """Section 2: Category skew.

    Counts findings by severity per analyst run. Flags runs where
    high+critical counts are zero for 5+ consecutive retros.
    """
    lines: list[str] = ["## 2. Category Skew (Severity Distribution)\n"]

    rows: list[tuple[str, int, int, int, int]] = []
    for retro in primary_retros:
        f = _findings_dict(retro)
        if not f:
            continue
        ts = _source_ts(retro)
        rows.append((ts, f.get("critical", 0), f.get("high", 0), f.get("medium", 0), f.get("low", 0)))

    if not rows:
        lines.append("No structured findings data available in this corpus window.\n")
        return "\n".join(lines)

    # Build severity table
    lines.append("| Retro | Critical | High | Medium | Low | High+Critical |")
    lines.append("|-------|----------|------|--------|-----|---------------|")
    for ts, crit, high, med, low in rows:
        hc = crit + high
        lines.append(f"| {ts} | {crit} | {high} | {med} | {low} | {hc} |")
    lines.append("")

    # Flag consecutive zero high+critical runs
    zero_hc_streak = 0
    max_streak = 0
    streak_start: str | None = None
    for ts, crit, high, _, _ in rows:
        if crit + high == 0:
            zero_hc_streak += 1
            if streak_start is None:
                streak_start = ts
            if zero_hc_streak > max_streak:
                max_streak = zero_hc_streak
        else:
            zero_hc_streak = 0
            streak_start = None

    if max_streak >= 5:
        lines.append(
            f"> **FLAG**: {max_streak} consecutive retros had zero high/critical findings. "
            f"This may indicate analyst underreporting or a genuinely quiet period. "
            f"Streak started at: {streak_start}\n"
        )
    elif zero_hc_streak >= 3:
        lines.append(
            f"> **INFO**: The last {zero_hc_streak} retros have zero high/critical findings "
            f"(streak ongoing — not yet at the 5-run flag threshold).\n"
        )
    else:
        lines.append("No zero high/critical streaks >= 5 detected.\n")

    return "\n".join(lines)


def analyse_p2_noise(
    primary_retros: list[dict],
    improve_retros: list[dict],
) -> str:
    """Section 3: Low-signal P2 noise.

    Counts P2 recommendations that appear but are never applied, using
    cross-referencing with improve-cycle outcomes.
    """
    lines: list[str] = ["## 3. Low-Signal P2 Noise\n"]

    # Collect P2 recommendation text mentions from primary retros
    p2_mentions: Counter = Counter()
    for retro in primary_retros:
        p2_count = retro.get("p2", 0)
        if isinstance(p2_count, int) and p2_count > 0:
            ts = _source_ts(retro)
            p2_mentions[ts] = p2_count
        else:
            # Try structured list
            for item in _p2_ids_from_retro(retro):
                p2_mentions[item] += 1

    # Count P2 skips in improve records
    p2_skipped_total = 0
    p2_skip_examples: list[str] = []
    for imp in improve_retros:
        skipped_p2 = imp.get("recommendations_skipped_p2", [])
        if isinstance(skipped_p2, list):
            p2_skipped_total += len(skipped_p2)
            p2_skip_examples.extend(str(x)[:80] for x in skipped_p2[:3])
        scope = imp.get("scope_restriction", "")
        if isinstance(scope, str) and "P2" in scope and "skip" in scope.lower():
            p2_skipped_total += imp.get("skipped", 0) or 0

    total_p2_produced = sum(p2_mentions.values())

    if total_p2_produced == 0 and p2_skipped_total == 0:
        lines.append("No P2 recommendations found in this corpus window.\n")
        return "\n".join(lines)

    lines.append(f"**Total P2 recommendations recorded across primary retros**: {total_p2_produced}")
    lines.append(f"**P2 recommendations explicitly skipped in improve runs**: {p2_skipped_total}\n")

    if total_p2_produced > 0:
        skip_rate = (p2_skipped_total / total_p2_produced * 100) if total_p2_produced else 0
        lines.append(f"**Estimated P2 skip rate**: {skip_rate:.0f}%\n")
        if skip_rate >= 60:
            lines.append(
                "> **FLAG**: More than 60% of P2 recommendations are never applied. "
                "Consider whether these represent genuine improvement opportunities or "
                "systematic low-signal noise that should be filtered at the analyst stage.\n"
            )

    if p2_skip_examples:
        lines.append("**Example skipped P2 recommendations**:")
        for ex in p2_skip_examples[:5]:
            lines.append(f"- {ex}")
        lines.append("")

    # Retro-by-retro P2 breakdown
    if p2_mentions:
        lines.append("**P2 counts per retro**:")
        for ts, count in sorted(p2_mentions.items()):
            lines.append(f"- {ts}: {count}")
        lines.append("")

    return "\n".join(lines)


def analyse_frankenstein_trajectory(primary_retros: list[dict]) -> str:
    """Section 4: frankenstein.md size trajectory.

    Extracts frankenstein_line_count from each retro's metrics block
    (added in v4.1.0 / PR #17). Reports trend: growing, stable, or shrinking.
    """
    lines: list[str] = ["## 4. frankenstein.md Size Trajectory\n"]

    data_points: list[tuple[str, int]] = []
    pre_schema_count = 0
    missing_metrics_count = 0

    for retro in primary_retros:
        ts = _source_ts(retro)
        metrics = retro.get("metrics")
        if metrics is None:
            # Check top-level frankenstein_line_count (some retros store at root)
            flc = retro.get("frankenstein_line_count")
            if flc is not None:
                data_points.append((ts, int(flc)))
            else:
                pre_schema_count += 1
                missing_metrics_count += 1
        elif isinstance(metrics, dict):
            flc = metrics.get("frankenstein_line_count")
            if flc is not None:
                data_points.append((ts, int(flc)))
            else:
                missing_metrics_count += 1
        else:
            missing_metrics_count += 1

    if not data_points:
        note = (
            "No `frankenstein_line_count` data found in this corpus window. "
            f"{pre_schema_count} retro(s) appear to use pre-v4.1.0 schema (no `metrics` block). "
            "This field was added in v4.1.0 (PR #17). Analysis will populate once retros "
            "with the new schema accumulate.\n"
        )
        lines.append(note)
        return "\n".join(lines)

    if pre_schema_count > 0:
        lines.append(
            f"> **Note**: {pre_schema_count} retro(s) are pre-v4.1.0 schema (no `metrics` block) "
            f"and are excluded from this trajectory. {missing_metrics_count - pre_schema_count} "
            f"additional retro(s) had a `metrics` block but lacked `frankenstein_line_count`.\n"
        )

    # Build table
    lines.append("| Retro | frankenstein line count | Delta |")
    lines.append("|-------|------------------------|-------|")
    prev_count: int | None = None
    for ts, count in data_points:
        delta_str = "—"
        if prev_count is not None:
            delta = count - prev_count
            delta_str = f"+{delta}" if delta > 0 else str(delta)
        lines.append(f"| {ts} | {count} | {delta_str} |")
        prev_count = count
    lines.append("")

    # Trend detection
    if len(data_points) >= 2:
        counts = [c for _, c in data_points]
        first, last = counts[0], counts[-1]
        net_delta = last - first
        # Monotonic growth check
        is_monotone_grow = all(counts[i] <= counts[i + 1] for i in range(len(counts) - 1))
        is_monotone_shrink = all(counts[i] >= counts[i + 1] for i in range(len(counts) - 1))

        if is_monotone_grow and net_delta > 0:
            lines.append(
                f"> **FLAG (P1)**: `frankenstein.md` has grown monotonically across all "
                f"{len(data_points)} data points (+{net_delta} lines net). "
                f"Current: {last} lines. This may indicate prompt bloat.\n"
            )
        elif net_delta > 50:
            lines.append(
                f"> **INFO**: Net growth of +{net_delta} lines ({first} → {last}) across "
                f"{len(data_points)} retros. Not monotonic but overall trend is growing.\n"
            )
        elif is_monotone_shrink and net_delta < 0:
            lines.append(
                f"> **INFO**: `frankenstein.md` has been steadily trimmed "
                f"({net_delta} lines net, {first} → {last}).\n"
            )
        elif net_delta < 0:
            lines.append(
                f"> **INFO**: Net reduction of {net_delta} lines ({first} → {last}) — trending stable or shrinking.\n"
            )
        else:
            lines.append(f"> **INFO**: Stable size over this window (~{last} lines).\n")
    elif len(data_points) == 1:
        lines.append(f"> Only one data point available ({data_points[0][1]} lines). Cannot compute trend yet.\n")

    return "\n".join(lines)


def analyse_cross_session_persistence(primary_retros: list[dict]) -> str:
    """Section 5: Cross-session recommendation persistence.

    Recommendations (as text fragments) that appear in 3+ retros are either
    very important or systematically ignored.
    """
    lines: list[str] = ["## 5. Cross-Session Recommendation Persistence\n"]

    # Collect text-level recommendation mentions that can be compared across retros
    # We extract description-like strings from wherever they are available.
    rec_text_counts: Counter = Counter()
    rec_text_sources: defaultdict[str, list[str]] = defaultdict(list)

    for retro in primary_retros:
        ts = _source_ts(retro)
        recs = retro.get("recommendations")
        if isinstance(recs, list):
            for item in recs:
                if isinstance(item, dict):
                    text = (
                        item.get("text")
                        or item.get("description")
                        or item.get("summary")
                        or item.get("title")
                        or ""
                    )
                    text = str(text).strip()[:120]
                    if text:
                        rec_text_counts[text] += 1
                        rec_text_sources[text].append(ts)
                elif isinstance(item, str):
                    text = item.strip()[:120]
                    if text:
                        rec_text_counts[text] += 1
                        rec_text_sources[text].append(ts)

        # Also check root_causes dict as a proxy for repeated themes
        root_causes = retro.get("root_causes")
        if isinstance(root_causes, dict):
            for cause, count in root_causes.items():
                key = f"[root_cause] {cause}"
                rec_text_counts[key] += (count if isinstance(count, int) else 1)
                if ts not in rec_text_sources[key]:
                    rec_text_sources[key].append(ts)

    # Filter to 3+ appearances
    persistent = {
        text: count
        for text, count in rec_text_counts.items()
        if count >= 3
    }

    if not persistent:
        # Structured rec IDs not available in most corpus retros; report root cause themes instead
        root_cause_totals: Counter = Counter()
        for retro in primary_retros:
            rc = retro.get("root_causes")
            if isinstance(rc, dict):
                for cause, count in rc.items():
                    root_cause_totals[cause] += (count if isinstance(count, int) else 1)

        high_frequency = {
            cause: count for cause, count in root_cause_totals.items() if count >= 3
        }

        if high_frequency:
            lines.append(
                "No verbatim recommendation text persisted across 3+ retros (structured rec lists "
                "not present in most corpus entries). However, the following **root cause categories** "
                "accumulated 3+ occurrences:\n"
            )
            for cause, count in sorted(high_frequency.items(), key=lambda x: -x[1]):
                lines.append(f"- `{cause}`: {count} total occurrences across retros")
            lines.append(
                "\n> Root causes appearing repeatedly may indicate systemic issues that retro "
                "recommendations are not resolving. Consider targeted audit.\n"
            )
        else:
            lines.append(
                "No recurring recommendation text or root cause patterns (3+ appearances) found "
                "in this corpus window.\n"
            )
            lines.append(
                "> **Note**: The current retro JSON schema stores recommendations as an integer "
                "count in most retros. Structured recommendation objects (with text/description "
                "fields) are needed for richer cross-session persistence analysis.\n"
            )
    else:
        lines.append(f"**{len(persistent)} recommendation(s) appeared in 3+ retros:**\n")
        for text, count in sorted(persistent.items(), key=lambda x: -x[1]):
            sources = ", ".join(rec_text_sources[text][:4])
            lines.append(f"- ({count}x) `{text[:100]}` — seen in: {sources}")
        lines.append("")
        lines.append(
            "> Recommendations persisting across 3+ sessions are either critically important "
            "(and should be actioned immediately) or are being systematically ignored "
            "(and should be reviewed for signal quality).\n"
        )

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Output assembly
# ---------------------------------------------------------------------------

def build_meta_retro(
    primary_retros: list[dict],
    improve_retros: list[dict],
    retro_count: int,
    last_meta_count: int,
    interval: int,
    now: datetime,
) -> str:
    """Assemble the full meta-retro markdown document."""
    window_retros = primary_retros[last_meta_count:]
    window_improve = [
        imp for imp in improve_retros
        if imp.get("retro_timestamp") and any(
            retro.get("_source_file", "").startswith(
                # No normalization needed: retro_timestamp is already a bare ISO string
                str(imp.get("retro_timestamp", ""))
            )
            for retro in window_retros
        )
    ]
    # If timestamp cross-ref yields nothing, include all improve retros in window by position
    if not window_improve:
        window_improve = improve_retros[max(0, len(improve_retros) - len(window_retros)):]

    ts_str = now.strftime("%Y-%m-%dT%H%M%S")
    date_str = now.strftime("%Y-%m-%d %H:%M UTC")
    since_count = retro_count - last_meta_count

    header = f"""# Meta-Retro — {date_str}

**Coverage**: primary retros {last_meta_count + 1}–{retro_count} ({since_count} pipeline(s) since last meta-retro)
**Total corpus size**: {len(primary_retros)} primary retros, {len(improve_retros)} improve-cycle retros
**Interval**: every {interval} pipelines
**Generated by**: meta-retro-batch.py

---

"""

    sections = [
        header,
        analyse_recurring_unresolved(window_retros, window_improve),
        "\n",
        analyse_category_skew(window_retros),
        "\n",
        analyse_p2_noise(window_retros, window_improve),
        "\n",
        analyse_frankenstein_trajectory(window_retros),
        "\n",
        analyse_cross_session_persistence(window_retros),
        "\n",
        "---\n\n*End of meta-retro.*\n",
    ]

    return "".join(sections)


# ---------------------------------------------------------------------------
# Filename helpers
# ---------------------------------------------------------------------------

def meta_retro_filename(now: datetime, count: int) -> str:
    ts = now.strftime("%Y-%m-%dT%H%M%S")
    return f"{ts}-meta-retro-N{count}.md"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    using_default_retro_dir = args.retro_dir is None
    retro_dir = Path(
        args.retro_dir
        if args.retro_dir
        else resolve_state_root() / "retros" / "orchestrator"
    )
    out_dir = Path(
        args.out_dir
        if args.out_dir
        else resolve_state_root() / "retros" / "meta"
    )
    interval: int = args.interval
    dry_run: bool = args.dry_run
    force: bool = args.force

    # Load corpus; missing default dir is a no-op (fresh install), not an error
    primary_retros, improve_retros = load_corpus(
        retro_dir, dir_missing_is_error=not using_default_retro_dir
    )
    total_count = len(primary_retros)

    if total_count == 0:
        print("no action — retro corpus is empty", file=sys.stderr)
        sys.exit(0)

    # Find last meta-retro baseline
    _, last_meta_count = find_last_meta(out_dir)

    since_last = total_count - last_meta_count

    if not force and since_last < interval:
        print(
            f"no action — {since_last} pipeline(s) since last meta-retro "
            f"({interval} required to trigger)",
            file=sys.stderr,
        )
        sys.exit(0)

    # Generate meta-retro
    now = datetime.now(tz=timezone.utc)
    content = build_meta_retro(
        primary_retros=primary_retros,
        improve_retros=improve_retros,
        retro_count=total_count,
        last_meta_count=last_meta_count,
        interval=interval,
        now=now,
    )

    if dry_run:
        print(content)
        sys.exit(0)

    # Write output
    out_dir.mkdir(parents=True, exist_ok=True)
    filename = meta_retro_filename(now, total_count)
    out_path = out_dir / filename

    try:
        out_path.write_text(content, encoding="utf-8")
    except OSError as exc:
        print(f"ERROR: Failed to write {out_path}: {exc}", file=sys.stderr)
        sys.exit(1)

    print(f"Wrote meta-retro: {out_path}", file=sys.stderr)
    sys.exit(0)


if __name__ == "__main__":
    main()
