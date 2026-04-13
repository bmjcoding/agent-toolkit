#!/usr/bin/env node
/**
 * generate-index.js
 *
 * Walks all <tool>/<primitive-type>/<name>/manifest.json files under the
 * agent-toolkit root and writes agent-toolkit/index.json as a deterministic
 * JSON array sorted by: tool → type → id.
 *
 * Usage (run from repo root or any directory):
 *   node scripts/generate-index.js
 *
 * Idempotent — safe to re-run as more manifests are added.
 * Uses only Node.js built-ins (fs, path).
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Resolve repo root relative to this script's location (scripts/ is one level below root).
const REPO_ROOT = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(REPO_ROOT, 'index.json');

// Known tool directories — explicit allowlist avoids accidentally pulling in
// top-level dirs (docs/, scripts/) that could contain a stray manifest.json.
const TOOL_DIRS = ['claude-code', 'github-copilot', 'openai-codex'];

// Known primitive-type directories per tool — used to narrow the glob walk.
const PRIMITIVE_DIRS = ['skills', 'agents', 'hooks', 'commands', 'rules', 'bundles'];

/**
 * Recursively collect all manifest.json paths under a given directory.
 * Only descends one level of named-item subdirectories beneath the primitive dir.
 *
 * Expected layout: <tool>/<primitive>/<name>/manifest.json
 */
function collectManifests() {
  const manifests = [];

  for (const tool of TOOL_DIRS) {
    const toolDir = path.join(REPO_ROOT, tool);
    if (!fs.existsSync(toolDir)) continue;

    for (const primitive of PRIMITIVE_DIRS) {
      const primitiveDir = path.join(toolDir, primitive);
      if (!fs.existsSync(primitiveDir)) continue;

      let entries;
      try {
        entries = fs.readdirSync(primitiveDir, { withFileTypes: true });
      } catch {
        continue;
      }

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const manifestPath = path.join(primitiveDir, entry.name, 'manifest.json');
        if (!fs.existsSync(manifestPath)) continue;

        let data;
        try {
          const raw = fs.readFileSync(manifestPath, 'utf8');
          data = JSON.parse(raw);
        } catch (err) {
          process.stderr.write(
            `WARNING: skipping ${manifestPath} — parse error: ${err.message}\n`
          );
          continue;
        }

        manifests.push(data);
      }
    }
  }

  return manifests;
}

/**
 * Deterministic sort key: tool → type → id.
 * Uses stable string comparison so output order is reproducible across runs.
 */
function sortKey(manifest) {
  const tool = String(manifest.tool ?? '');
  const type = String(manifest.type ?? '');
  const id   = String(manifest.id   ?? '');
  return `${tool}|${type}|${id}`;
}

function main() {
  const manifests = collectManifests();

  manifests.sort((a, b) => {
    const ka = sortKey(a);
    const kb = sortKey(b);
    if (ka < kb) return -1;
    if (ka > kb) return  1;
    return 0;
  });

  const output = JSON.stringify(manifests, null, 2) + '\n';
  fs.writeFileSync(OUTPUT_FILE, output, 'utf8');

  process.stdout.write(
    `Generated ${OUTPUT_FILE} — ${manifests.length} manifest(s)\n`
  );
}

main();
