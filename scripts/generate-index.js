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
// 'commands-unsupported' is the openai-codex home for command stubs (tool has no
// user-defined slash-command mechanism; manifests record intent with status: unavailable).
const PRIMITIVE_DIRS = ['skills', 'agents', 'hooks', 'commands', 'commands-unsupported', 'rules', 'bundles'];

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

/**
 * Cross-reference validation.
 *
 * Verifies that every id referenced inside a manifest's components[] or
 * dependencies[] array resolves to an actual manifest entry in the collected
 * set.  The lookup key mirrors sortKey: `tool|type|id`.
 *
 * Bundle manifests carry components[{type, id, role}] — each entry must
 * resolve to a manifest whose (tool, type, id) triple exists.
 *
 * Agent manifests carry dependencies[{type, id, optional}] — same rule.
 *
 * Exits the process with code 1 and a human-readable error listing every
 * broken reference if any are found.
 *
 * @param {object[]} manifests - The collected manifest array (pre-sort).
 */
// NOTE: The lookup key is `${m.tool}|${comp.type}|${comp.id}`, which means
// validation is scoped to SAME-TOOL references only.  A component or
// dependency entry that references a primitive in a different tool (e.g., a
// claude-code bundle referencing an openai-codex skill) would silently pass
// because no such cross-tool composition exists today and no cross-tool entry
// would appear in the index under the source manifest's tool prefix.
// This is intentional — the toolkit does not support cross-tool composition.
// If that constraint is ever relaxed, the lookup key must be changed to
// `${comp.tool ?? m.tool}|${comp.type}|${comp.id}` and components/dependencies
// entries must carry an explicit tool field.
function validateCrossRefs(manifests) {
  // Build a lookup set keyed by "tool|type|id" for O(1) resolution.
  const index = new Map(manifests.map(m => [`${m.tool}|${m.type}|${m.id}`, m]));
  const errors = [];

  for (const m of manifests) {
    // Validate bundle components[].
    if (Array.isArray(m.components)) {
      for (const comp of m.components) {
        const key = `${m.tool}|${comp.type}|${comp.id}`;
        if (!index.has(key)) {
          errors.push(
            `[${m.tool}/${m.type}/${m.id}] components[].id '${comp.id}' (type: ${comp.type}) not found in index`
          );
        }
      }
    }

    // Validate agent dependencies[].
    if (Array.isArray(m.dependencies)) {
      for (const dep of m.dependencies) {
        const key = `${m.tool}|${dep.type}|${dep.id}`;
        if (!index.has(key)) {
          errors.push(
            `[${m.tool}/${m.type}/${m.id}] dependencies[].id '${dep.id}' (type: ${dep.type}) not found in index`
          );
        }
      }
    }
  }

  if (errors.length > 0) {
    process.stderr.write(`ERROR: cross-reference validation failed:\n${errors.join('\n')}\n`);
    process.exit(1);
  }
}

function main() {
  const manifests = collectManifests();

  validateCrossRefs(manifests);

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

// ---------------------------------------------------------------------------
// Inline test harness — run with: node scripts/generate-index.js --test
// ---------------------------------------------------------------------------

/**
 * Minimal assertion helper.  Throws on failure so a single bad assertion
 * does not silence subsequent tests.
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
}

function runTests() {
  let passed = 0;
  let failed = 0;

  // Helper: invoke validateCrossRefs() and capture whether it would exit.
  // We monkey-patch process.exit and process.stderr to intercept the call.
  function runValidation(manifests) {
    const result = { exited: false, exitCode: null, stderrOutput: '' };
    const origExit = process.exit;
    const origStderrWrite = process.stderr.write.bind(process.stderr);

    process.exit = (code) => {
      result.exited = true;
      result.exitCode = code;
      // Restore before throwing so teardown is clean.
      process.exit = origExit;
      process.stderr.write = origStderrWrite;
      // Throw to unwind — caught by the test runner below.
      throw Object.assign(new Error('process.exit called'), { isProcessExit: true });
    };

    process.stderr.write = (data) => {
      result.stderrOutput += data;
      return true;
    };

    try {
      validateCrossRefs(manifests);
    } catch (err) {
      if (!err.isProcessExit) {
        process.exit = origExit;
        process.stderr.write = origStderrWrite;
        throw err;
      }
    } finally {
      process.exit = origExit;
      process.stderr.write = origStderrWrite;
    }

    return result;
  }

  // -------------------------------------------------------------------------
  // Test 1 — PASS: valid cross-refs resolve correctly
  // -------------------------------------------------------------------------
  try {
    const manifests = [
      { tool: 'claude-code', type: 'skill', id: 'retro', components: [], dependencies: [] },
      { tool: 'claude-code', type: 'agent', id: 'frankenstein', components: [],
        dependencies: [{ type: 'skill', id: 'retro', optional: false }] },
      { tool: 'claude-code', type: 'bundle', id: 'my-bundle',
        components: [
          { type: 'skill', id: 'retro', role: 'core' },
          { type: 'agent', id: 'frankenstein', role: 'core' }
        ]
      }
    ];

    const result = runValidation(manifests);
    assert(!result.exited, 'valid cross-refs should not exit');
    process.stdout.write('  PASS test 1 — valid cross-refs: no exit\n');
    passed++;
  } catch (err) {
    process.stdout.write(`  FAIL test 1 — valid cross-refs: ${err.message}\n`);
    failed++;
  }

  // -------------------------------------------------------------------------
  // Test 2 — FAIL: broken dependency ref exits with code 1 and names the ref
  // -------------------------------------------------------------------------
  try {
    const manifests = [
      { tool: 'claude-code', type: 'skill', id: 'retro', components: [], dependencies: [] },
      { tool: 'claude-code', type: 'agent', id: 'frankenstein', components: [],
        dependencies: [
          { type: 'skill', id: 'retro', optional: false },
          { type: 'skill', id: 'nonexistent-zzz', optional: false }
        ]
      }
    ];

    const result = runValidation(manifests);
    assert(result.exited, 'broken dep ref should cause exit');
    assert(result.exitCode === 1, `exit code should be 1, got ${result.exitCode}`);
    assert(
      result.stderrOutput.includes('nonexistent-zzz'),
      `error message should name the broken id; got: ${result.stderrOutput}`
    );
    assert(
      result.stderrOutput.includes('frankenstein'),
      `error message should name the source manifest; got: ${result.stderrOutput}`
    );
    process.stdout.write('  PASS test 2 — broken dep ref: exits 1, names broken id and manifest\n');
    passed++;
  } catch (err) {
    process.stdout.write(`  FAIL test 2 — broken dep ref: ${err.message}\n`);
    failed++;
  }

  // -------------------------------------------------------------------------
  // Test 3 — FAIL: broken component ref in bundle exits with code 1
  // -------------------------------------------------------------------------
  try {
    const manifests = [
      { tool: 'claude-code', type: 'skill', id: 'retro', components: [], dependencies: [] },
      { tool: 'claude-code', type: 'bundle', id: 'broken-bundle',
        components: [
          { type: 'skill', id: 'retro', role: 'core' },
          { type: 'agent', id: 'ghost-agent', role: 'optional' }
        ]
      }
    ];

    const result = runValidation(manifests);
    assert(result.exited, 'broken component ref should cause exit');
    assert(result.exitCode === 1, `exit code should be 1, got ${result.exitCode}`);
    assert(
      result.stderrOutput.includes('ghost-agent'),
      `error message should name broken component id; got: ${result.stderrOutput}`
    );
    assert(
      result.stderrOutput.includes('broken-bundle'),
      `error message should name the source bundle; got: ${result.stderrOutput}`
    );
    process.stdout.write('  PASS test 3 — broken component ref: exits 1, names broken id and bundle\n');
    passed++;
  } catch (err) {
    process.stdout.write(`  FAIL test 3 — broken component ref: ${err.message}\n`);
    failed++;
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  process.stdout.write(`\nTests: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

if (process.argv.includes('--test')) {
  process.stdout.write('Running inline tests for validateCrossRefs()...\n\n');
  runTests();
} else {
  main();
}
