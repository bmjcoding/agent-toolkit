#!/usr/bin/env python3
"""Lint a skill `SKILL.md` or agent `AGENT.md` definition against quality standards.

Runs deterministic checks that can gate a PR merge. Covers both structural
validity (frontmatter, naming, limits) and quality heuristics (description
specificity, instruction actionability, progressive disclosure).

Usage:
    python3 scripts/lint-definition.py FILE [OPTIONS]
    python3 scripts/lint-definition.py DIRECTORY [OPTIONS]

Arguments:
    FILE          Single .md file to lint
    DIRECTORY     Directory to recursively lint (finds SKILL.md and AGENT.md)

Options:
    --type TYPE   Force type: "skill" or "agent" (default: auto-detect)
    --format FMT  Output format: "json" or "summary" (default: summary)
    --base REF    Git ref to diff against in CI (reserved for future checks)
    --strict      Treat warnings as errors (exit 1 on any warning)
    --help        Show this help message

Exit codes:
    0  All checks passed (or only warnings in non-strict mode)
    1  One or more errors found
    2  Usage error

Checks:
  Structural (errors):
    S01  File exists and is non-empty
    S02  YAML frontmatter has opening and closing --- delimiters
    S03  Required field 'name' is present and kebab-case
    S04  Description is present
    S05  Description is under 1024 characters
    S06  No XML angle brackets in frontmatter
    S07  Skill body is under 500 lines
    S08  Referenced files (references/, scripts/) exist on disk
    S09  No unsupported frontmatter fields (skills only)
    S10  Name matches directory name

  Quality (warnings, errors in --strict):
    Q01  Description under 250 chars (truncation threshold in skill listing)
    Q02  Description includes trigger context ("Use when...", "Use for...")
    Q03  Description is not vague (flags generic words without specifics)
    Q04  Instructions contain actionable steps (numbered lists, bash blocks, or imperative verbs)
    Q05  SKILL.md over 300 lines without references/ directory
    Q06  No output format or template defined
    Q07  No gotchas or error handling section
    Q08  Agent definition missing tools or disallowedTools
    Q09  Agent definition missing maxTurns
    Q10  Instructions explain things the agent already knows
    Q11  Multiple conflicting imperatives (ALWAYS X ... NEVER X)
    Q12  No $ARGUMENTS in user-invocable skill
    Q15  Eval file (evals/evals.json) has structural issues: wrong keys, non-sequential IDs, missing fields
"""

import json
import os
import re
import sys
from pathlib import Path


SUPPORTED_SKILL_FIELDS = {
    "name", "description", "argument-hint", "compatibility",
    "disable-model-invocation", "license", "metadata", "user-invocable",
    "context", "agent", "hooks", "paths", "shell", "model", "effort",
    "allowed-tools",  # commands support this
}

SUPPORTED_AGENT_FIELDS = {
    "name", "description", "model", "tools", "disallowedTools",
    "permissionMode", "maxTurns", "effort", "background", "skills",
    "initialPrompt",
}

VAGUE_DESCRIPTION_PATTERNS = [
    r"^helps? with\b",
    r"^does? \w+ ?(stuff|things|work)",
    r"^a? ?tool (for|to)\b",
    r"^manage",
    r"^process",
    r"^handle",
    r"^this (skill|agent) helps\b",
    r"^a (skill|tool|agent) (for|that)\b",
    r"^use this to\b",
]

AGENT_KNOWLEDGE_PHRASES = [
    "markdown is a",
    "json is a",
    "http is a",
    "api stands for",
    "git is a version",
    "a database is",
    "python is a",
    "javascript is a",
    "typescript is a",
]


def parse_args(argv):
    args = {"target": None, "type": None, "format": "summary", "strict": False, "base": None}
    i = 1
    while i < len(argv):
        if argv[i] == "--help":
            print(__doc__.strip())
            sys.exit(0)
        elif argv[i] == "--type" and i + 1 < len(argv):
            args["type"] = argv[i + 1]
            i += 2
        elif argv[i] == "--format" and i + 1 < len(argv):
            args["format"] = argv[i + 1]
            i += 2
        elif argv[i] == "--strict":
            args["strict"] = True
            i += 1
        elif argv[i] == "--base" and i + 1 < len(argv):
            args["base"] = argv[i + 1]
            i += 2
        elif not argv[i].startswith("-") and args["target"] is None:
            args["target"] = argv[i]
            i += 1
        else:
            print(f"Unknown option: {argv[i]}", file=sys.stderr)
            sys.exit(2)
    if not args["target"]:
        print("Error: FILE or DIRECTORY required.", file=sys.stderr)
        sys.exit(2)
    return args


def detect_type(filepath):
    if "SKILL.md" in filepath or "/skills/" in filepath:
        return "skill"
    if "/agents/" in filepath:
        return "agent"
    return "unknown"


def parse_frontmatter(content):
    if not content.startswith("---"):
        return None, content, "No opening --- delimiter"
    end = content.find("---", 3)
    if end == -1:
        return None, content, "No closing --- delimiter"

    yaml_text = content[3:end].strip()
    body = content[end + 3:].strip()
    frontmatter = {}
    current_key = None
    current_value_lines = []

    for line in yaml_text.split("\n"):
        if current_key and (line.startswith("  ") or line.startswith("\t")):
            current_value_lines.append(line.strip())
            continue
        if current_key:
            frontmatter[current_key] = " ".join(current_value_lines).strip()
            current_key = None
            current_value_lines = []
        match = re.match(r"^([\w-]+)\s*:\s*(.*)", line)
        if match:
            current_key = match.group(1)
            value = match.group(2).strip()
            if value in (">", "|"):
                current_value_lines = []
            else:
                current_value_lines = [value] if value else []
    if current_key:
        frontmatter[current_key] = " ".join(current_value_lines).strip()

    return frontmatter, body, None


def lint_file(filepath, file_type=None, base=None):
    findings = []

    def error(code, msg):
        findings.append({"level": "error", "code": code, "message": msg})

    def warn(code, msg):
        findings.append({"level": "warning", "code": code, "message": msg})

    # S01: File exists and non-empty
    if not os.path.isfile(filepath):
        error("S01", f"File not found: {filepath}")
        return findings
    if os.path.getsize(filepath) == 0:
        error("S01", "File is empty")
        return findings

    with open(filepath) as f:
        content = f.read()

    if not file_type:
        file_type = detect_type(filepath)

    # S02: Frontmatter delimiters
    fm, body, fm_error = parse_frontmatter(content)
    if fm_error:
        error("S02", fm_error)
        return findings

    # S03: Name field
    name = fm.get("name", "")
    if not name:
        error("S03", "Missing required field: name")
    elif not re.match(r"^[a-z0-9][a-z0-9-]*$", name):
        error("S03", f"Name '{name}' must be kebab-case (lowercase letters, numbers, hyphens)")

    # S10: Name matches directory name (skills only — agents already use per-directory layout)
    if file_type == "skill":
        dir_name = os.path.basename(os.path.dirname(filepath))
        if name and dir_name and name != dir_name and dir_name not in (".", ""):
            warn("S10", f"Name '{name}' doesn't match directory name '{dir_name}'")

    # S04: Description present
    desc = fm.get("description", "")
    if not desc:
        error("S04", "Missing required field: description")

    # S05: Description length
    if len(desc) > 1024:
        error("S05", f"Description is {len(desc)} chars (max 1024)")

    # S06: No XML in frontmatter
    raw_fm = content[3:content.find("---", 3)]
    if re.search(r"<[^>]+>", raw_fm):
        error("S06", "Frontmatter contains XML angle brackets — forbidden")

    # S07: Body line count (skills)
    body_lines = body.split("\n")
    body_line_count = len(body_lines)
    if file_type == "skill" and body_line_count > 500:
        error("S07", f"Skill body is {body_line_count} lines (max 500)")

    # S08: Referenced files exist
    skill_dir = os.path.dirname(filepath)
    for match in re.finditer(r"`((?:references|scripts|assets)/[^`]+)`", content):
        ref = match.group(1)
        if not os.path.exists(os.path.join(skill_dir, ref)):
            error("S08", f"Referenced file missing: {ref}")

    # S09: Unsupported frontmatter fields (skills)
    if file_type == "skill":
        for key in fm:
            if key not in SUPPORTED_SKILL_FIELDS:
                warn("S09", f"Unsupported skill frontmatter field: '{key}'")

    # === Quality checks ===

    # Q01: Description truncation
    if desc and len(desc) > 250:
        warn("Q01", f"Description is {len(desc)} chars — will be truncated in skill listing (250 char threshold)")

    # Q02: Trigger context (skills only — agents are dispatched, not triggered by description)
    if file_type == "skill" and desc and not re.search(r"(?i)(use when|use for|use after|use if|use this|trigger|invoke)", desc):
        warn("Q02", "Description lacks trigger context — add 'Use when...' to help the agent know when to load this")

    # Q03: Vague description
    if desc:
        desc_lower = desc.lower().strip()
        for pattern in VAGUE_DESCRIPTION_PATTERNS:
            if re.match(pattern, desc_lower):
                warn("Q03", f"Description appears vague — '{desc[:60]}...' lacks specificity about what the skill does or when to use it")
                break

    # Q04: Actionable instructions
    has_numbered_steps = bool(re.search(r"^\d+\.", body, re.MULTILINE))
    has_bash_blocks = "```bash" in body or "```" in body
    has_imperatives = bool(re.search(r"(?m)^(?:Run|Read|Write|Check|Verify|Parse|Extract|Produce|Skip|Flag|Present|Apply)", body))
    if not (has_numbered_steps or has_bash_blocks or has_imperatives):
        warn("Q04", "Instructions lack actionable steps — no numbered lists, code blocks, or imperative verbs found")

    # Q05: Large SKILL.md without references/
    if file_type == "skill" and body_line_count > 300:
        refs_dir = os.path.join(skill_dir, "references")
        if not os.path.isdir(refs_dir):
            warn("Q05", f"Skill body is {body_line_count} lines with no references/ directory — consider progressive disclosure")

    # Q06: No output template
    if file_type == "skill":
        has_template = bool(re.search(r"(?i)(template|output format|output:|```\n\|)", body))
        if not has_template:
            warn("Q06", "No output format or template defined — output quality may be inconsistent")

    # Q07: No error handling
    has_error_section = bool(re.search(r"(?i)(gotcha|troubleshoot|error|common mistake|pitfall|caveat|watch out)", body))
    if not has_error_section:
        warn("Q07", "No gotchas, troubleshooting, or error handling section")

    # Q08: Agent missing tools
    if file_type == "agent":
        if "tools" not in fm and "disallowedTools" not in fm:
            warn("Q08", "Agent definition missing 'tools' or 'disallowedTools' — tool access is uncontrolled")

    # Q09: Agent missing maxTurns
    if file_type == "agent":
        if "maxTurns" not in fm:
            warn("Q09", "Agent definition missing 'maxTurns' — agent could run indefinitely")

    # Q10: Explaining common knowledge
    body_lower = body.lower()
    for phrase in AGENT_KNOWLEDGE_PHRASES:
        if phrase in body_lower:
            warn("Q10", f"Instructions explain common knowledge ('{phrase}...') — the agent already knows this")
            break

    # Q11: Conflicting imperatives
    always_patterns = re.findall(r"(?i)\b(?:always|must always|MUST)\b.*?\b(\w+)\b", body)
    never_patterns = re.findall(r"(?i)\b(?:never|must never|NEVER|do not)\b.*?\b(\w+)\b", body)
    if always_patterns and never_patterns:
        always_words = set(w.lower() for w in always_patterns)
        never_words = set(w.lower() for w in never_patterns)
        conflicts = always_words & never_words
        # Filter common false positives — English stopwords and common tool names
        conflicts -= {"the", "a", "an", "it", "this", "that", "to", "do", "be", "use", "run", "if", "in", "on", "for", "with", "from"}
        conflicts -= {"git", "npm", "pip", "docker", "make", "bash", "python", "node", "yarn", "cargo"}
        conflicts -= {"include", "specify", "commit", "add", "create", "write", "read", "check", "set", "call", "pass", "push", "pull", "modify", "change", "update", "delete", "remove"}
        if conflicts:
            warn("Q11", f"Potentially conflicting imperatives found — both ALWAYS and NEVER reference: {', '.join(sorted(conflicts)[:3])}")

    # Q12: Missing $ARGUMENTS
    # Note: this check uses a full-content string match for "$ARGUMENTS". If $ARGUMENTS appears
    # anywhere in the file — including in code examples, comments, or the body — the check will
    # not fire. A skill author including $ARGUMENTS as a placeholder in a code block will
    # suppress this warning without intending to. This is the correct behavior for real skills,
    # but reviewers should be aware that Q12 is silenced by any occurrence of the string.
    if file_type == "skill":
        is_user_invocable = fm.get("user-invocable", "true").lower() != "false"
        disable_model = fm.get("disable-model-invocation", "false").lower() == "true"
        if is_user_invocable and "$ARGUMENTS" not in content and disable_model:
            warn("Q12", "User-invocable skill with disable-model-invocation but no $ARGUMENTS — user input may be ignored")

    # Q15: Eval file validation (skills only)
    if file_type == "skill":
        skill_dir = os.path.dirname(filepath)
        eval_path = os.path.join(skill_dir, "evals", "evals.json")
        if os.path.isfile(eval_path):
            try:
                with open(eval_path) as ef:
                    eval_data = json.load(ef)
                # Check top-level keys
                if "skill_name" not in eval_data:
                    warn("Q15", f"Eval file missing 'skill_name' key (found: {list(eval_data.keys())[:3]})")
                if "evals" not in eval_data:
                    warn("Q15", f"Eval file missing 'evals' key (found: {list(eval_data.keys())[:3]})")
                elif isinstance(eval_data["evals"], list):
                    evals = eval_data["evals"]
                    # Check sequential IDs
                    ids = [e.get("id") for e in evals if "id" in e]
                    expected = list(range(1, len(ids) + 1))
                    if ids != expected:
                        warn("Q15", f"Eval IDs not sequential: {ids} (expected {expected})")
                    # Check required fields per eval
                    for e in evals:
                        eid = e.get("id", "?")
                        for field in ("name", "prompt", "assertions"):
                            if field not in e:
                                warn("Q15", f"Eval id={eid} missing required field '{field}'")
                        if "assertions" in e and not e["assertions"]:
                            warn("Q15", f"Eval id={eid} has empty assertions array")
            except json.JSONDecodeError as je:
                warn("Q15", f"Eval file is invalid JSON: {je}")

    return findings


def find_files(target):
    """Find all lintable files in a directory."""
    files = []
    for root, dirs, fnames in os.walk(target):
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for fname in fnames:
            if fname == "SKILL.md":
                files.append(os.path.join(root, fname))
            elif fname == "AGENT.md":
                files.append(os.path.join(root, fname))
    return sorted(files)


def format_summary(results):
    """Format results as human-readable summary."""
    lines = []
    total_errors = 0
    total_warnings = 0

    for filepath, findings in results.items():
        errors = [f for f in findings if f["level"] == "error"]
        warnings = [f for f in findings if f["level"] == "warning"]
        total_errors += len(errors)
        total_warnings += len(warnings)

        status = "PASS" if not errors else "FAIL"
        if not errors and warnings:
            status = "WARN"

        lines.append(f"\n{'='*60}")
        lines.append(f"  {status}  {filepath}")
        lines.append(f"{'='*60}")

        for f in errors:
            lines.append(f"  ERROR  [{f['code']}] {f['message']}")
        for f in warnings:
            lines.append(f"  WARN   [{f['code']}] {f['message']}")
        if not errors and not warnings:
            lines.append("  All checks passed.")

    lines.append(f"\n{'─'*60}")
    lines.append(f"  Files: {len(results)}  Errors: {total_errors}  Warnings: {total_warnings}")
    verdict = "PASS" if total_errors == 0 and total_warnings == 0 else (
        "WARN" if total_errors == 0 else "FAIL"
    )
    lines.append(f"  Verdict: {verdict}")
    lines.append(f"{'─'*60}")

    return "\n".join(lines)


def main():
    args = parse_args(sys.argv)
    target = args["target"]

    if os.path.isdir(target):
        files = find_files(target)
        if not files:
            print(f"No SKILL.md or AGENT.md files found in {target}", file=sys.stderr)
            sys.exit(2)
    else:
        files = [target]

    results = {}
    for filepath in files:
        results[filepath] = lint_file(filepath, args["type"], base=args.get("base"))

    if args["format"] == "json":
        print(json.dumps(results, indent=2))
    else:
        print(format_summary(results))

    # Exit code
    has_errors = any(
        f["level"] == "error" for findings in results.values() for f in findings
    )
    has_warnings = any(
        f["level"] == "warning" for findings in results.values() for f in findings
    )

    if has_errors:
        sys.exit(1)
    if has_warnings and args["strict"]:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
