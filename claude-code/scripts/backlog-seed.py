#!/usr/bin/env python3
"""Seed .orchestrator/backlog.md with new findings from staging files.

Reads new agent-actionable and human-decision rows from temp staging files,
deduplicates by finding_id against existing backlog rows, renumbers, and
atomic-writes the updated backlog.

Usage:
    python3 claude-code/scripts/backlog-seed.py

Expects these temp files to exist (written by the Phase 4 bash loop):
    /tmp/backlog_new_agent_rows.txt
    /tmp/backlog_new_human_rows.txt
"""

import os
from datetime import datetime

BACKLOG = '.orchestrator/backlog.md'
TMP_PATH = BACKLOG + '.tmp'
COL_SEP = '|---|--------|----------|-------------|------|------|-----------------|--------|------------|-------|------------|-------|----------|------------|'
AGENT_HDR = '## Agent Actionable'
AGENT_COL_HDR = '| # | status | severity | environment | file | item | reason | source | finding_id | phase | added_at | session_id |'
HUMAN_HDR = '## Needs Human Decision'
HUMAN_COL_HDR = '| # | status | severity | environment | file | item | reason | source | finding_id | phase | added_at | session_id |'


def read_staging(path):
    try:
        return [line for line in open(path).read().splitlines() if line.strip()]
    except Exception:
        return []


def extract_fid(row):
    # finding_id is column index 8 in the 12-col schema (0-based after stripping row# col)
    cols = [c.strip() for c in row.strip('|').split('|')]
    return cols[8].strip() if len(cols) > 8 else ''


# ---- Load existing backlog ----
existing_agent_rows, existing_human_rows, existing_ids, preamble_lines = [], [], set(), []
if os.path.exists(BACKLOG):
    section = None
    for line in open(BACKLOG).read().splitlines():
        stripped = line.strip()
        if stripped == AGENT_HDR:
            section = 'agent'
            continue
        if stripped == HUMAN_HDR:
            section = 'human'
            continue
        if section is None:
            preamble_lines.append(line)
            continue
        if stripped in (AGENT_COL_HDR.strip(), HUMAN_COL_HDR.strip(), COL_SEP.strip()):
            continue
        if section in ('agent', 'human') and line.startswith('| '):
            fid = extract_fid(line)
            if fid:
                existing_ids.add(fid)
            (existing_agent_rows if section == 'agent' else existing_human_rows).append(line)
else:
    preamble_lines = ['# Backlog', '']


# ---- Dedup new rows ----
def dedup_append(staging_rows, bucket):
    for row in staging_rows:
        fid = extract_fid(row)
        if fid and fid in existing_ids:
            continue   # skip: finding_id already present in existing file
        bucket.append(row)
        if fid:
            existing_ids.add(fid)


new_agent = read_staging('/tmp/backlog_new_agent_rows.txt')
new_human = read_staging('/tmp/backlog_new_human_rows.txt')
dedup_append(new_agent, existing_agent_rows)
dedup_append(new_human, existing_human_rows)


# ---- Re-number rows ----
def renumber(rows):
    out = []
    for i, row in enumerate(rows, 1):
        if row.startswith('| '):
            inner = row[2:]
            rest = inner[inner.index('|'):]
            out.append(f'| {i} {rest}')
        else:
            out.append(row)
    return out


# ---- Rebuild preamble (update Last updated timestamp) ----
ts = datetime.now().strftime('%Y-%m-%dT%H:%M')
new_preamble, updated = [], False
for line in preamble_lines:
    if line.startswith('Last updated:'):
        new_preamble.append(f'Last updated: {ts}')
        updated = True
    else:
        new_preamble.append(line)
if not updated:
    ins = 2 if len(new_preamble) >= 2 else len(new_preamble)
    new_preamble.insert(ins, f'Last updated: {ts}')
    new_preamble.insert(ins + 1, '')


# ---- Assemble and atomic-write ----
out = new_preamble + ['']
out += [AGENT_HDR, AGENT_COL_HDR, COL_SEP] + renumber(existing_agent_rows)
out += ['', HUMAN_HDR, HUMAN_COL_HDR, COL_SEP] + renumber(existing_human_rows)
with open(TMP_PATH, 'w') as tf:
    tf.write('\n'.join(out) + '\n')
os.replace(TMP_PATH, BACKLOG)
print(f'backlog seed: {len(new_agent)} agent + {len(new_human)} human rows added')
