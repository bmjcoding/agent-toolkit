#!/usr/bin/env node
/**
 * generate-index.js
 *
 * Walks all content files under agent-toolkit and writes index.json at the repo
 * root as a deterministic JSON array sorted by: tool → category → slug.
 *
 * Entry shape: { slug: string, category: string, path: string }
 *
 *   slug     — component name/id (from frontmatter `name` field, or directory name)
 *   category — singular primitive type: agent | skill | command | hook | rule | bundle
 *   path     — canonical resolution key: relative path to the primary content file from
 *              repo root. This is the authoritative locator for the entry — consumers that
 *              need to read the actual file MUST use this field rather than reconstructing
 *              paths from slug/category. Non-trivial because each primitive type has its
 *              own filename convention (hooks have no .md; skills use SKILL.md; rules use
 *              <name>.md; bundles use bundle.yaml; github-copilot agents use <name>.agent.md).
 *
 * Content sources per primitive type (claude-code):
 *   agents   → claude-code/agents/<name>/<name>.md          (frontmatter name field)
 *   skills   → skills/<name>/SKILL.md                       (frontmatter name field; root-level, tool-agnostic)
 *   commands → claude-code/commands/<name>/<name>.md        (frontmatter name field)
 *   rules    → claude-code/rules/<name>/<name>.md           (frontmatter paths field → slug from dir)
 *   hooks    → no .md — stub from directory name
 *   bundles  → claude-code/bundles/<name>/bundle.yaml       (id field parsed with minimal YAML)
 *
 * github-copilot:
 *   agents   → github-copilot/agents/<name>.agent.md        (flat, not in subdirs)
 *   other    → stub from directory name (no content .md for commands/hooks/rules)
 *   skills   → github-copilot/skills/<name>/SKILL.md
 *   bundles  → bundle.yaml (same as claude-code, handle missing gracefully)
 *
 * openai-codex:
 *   all      → stubs from directory name
 *
 * Usage (run from repo root or any directory):
 *   node scripts/generate-index.js
 *   node scripts/generate-index.js --test
 *
 * Idempotent — safe to re-run as more content files are added.
 * Uses only Node.js built-ins (fs, path) — no npm dependencies.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// Resolve repo root relative to this script's location (scripts/ is one level below root).
const REPO_ROOT   = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(REPO_ROOT, 'index.json');

// Known tool directories — explicit allowlist avoids accidentally pulling in
// top-level dirs (docs/, scripts/) that could contain stray files.
const TOOL_DIRS = ['claude-code', 'github-copilot', 'openai-codex'];

// Known primitive-type directories per tool.
// 'commands-unsupported' is the openai-codex category for command stubs.
const PRIMITIVE_DIRS = [
  'skills',
  'agents',
  'hooks',
  'commands',
  'commands-unsupported',
  'rules',
  'bundles',
];

// Maps plural directory name → singular category label used in index entries.
const CATEGORY_MAP = {
  'agents':              'agent',
  'skills':              'skill',
  'commands':            'command',
  'commands-unsupported': 'command',
  'hooks':               'hook',
  'rules':               'rule',
  'bundles':             'bundle',
};

// ---------------------------------------------------------------------------
// YAML frontmatter parser — pure built-in string operations, no npm imports.
// ---------------------------------------------------------------------------

/**
 * Extract the raw YAML frontmatter string from a Markdown document.
 *
 * Returns the text between the first `---` line and the next `---` line.
 * Returns null if the document has no frontmatter block.
 *
 * @param {string} content - Raw file text
 * @returns {string|null}
 */
function extractFrontmatterBlock(content) {
  const lines = content.split('\n');
  if (lines.length < 2 || lines[0].trimEnd() !== '---') return null;

  const closing = lines.slice(1).findIndex(l => l.trimEnd() === '---');
  if (closing === -1) return null;

  // lines[1 .. closing] (exclusive end)
  return lines.slice(1, closing + 1).join('\n');
}

/**
 * Parse a YAML frontmatter block into a flat key→value object.
 *
 * Handles:
 *   - Simple scalar:       `name: planner`
 *   - Quoted scalar:       `name: "planner"`
 *   - Multiline (>/-):     collapses the block into a single trimmed string
 *   - Inline lists:        paths: ["**\/\*.py", "*.ts"]  (used by rules)
 *   - Block lists:         YAML `- item` list (used by github-copilot tools)
 *   - Comment lines:       `# version: 1.0.0`  → ignored
 *   - Nested scalar maps:  `metadata:\n  version: 1.0.0`  → stored as nested object
 *     (shallow only — sufficient for our index needs)
 *   - Missing block (null input): returns {}
 *
 * @param {string|null} block - Raw YAML text (without `---` delimiters)
 * @returns {Object}
 */
function parseFrontmatter(block) {
  if (!block) return {};

  const result  = {};
  const lines   = block.split('\n');
  let   i       = 0;

  while (i < lines.length) {
    const raw = lines[i];

    // Skip comment-only lines (e.g., `# version: 1.0.0`) and blank lines.
    const trimmed = raw.trimEnd();
    if (!trimmed || /^\s*#/.test(trimmed)) {
      i++;
      continue;
    }

    // Check for a top-level key (no leading whitespace).
    const keyMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)/);
    if (!keyMatch) {
      i++;
      continue;
    }

    const key    = keyMatch[1];
    const rest   = keyMatch[2].trim();
    i++;

    // ------------------------------------------------------------------
    // Multiline block scalar: `>` (folded) or `|` (literal)
    // ------------------------------------------------------------------
    if (rest === '>' || rest === '|') {
      const blockLines = [];
      while (i < lines.length && (lines[i].startsWith('  ') || lines[i] === '')) {
        blockLines.push(lines[i].trim());
        i++;
      }
      // Collapse multiline to single trimmed string.
      result[key] = blockLines.filter(Boolean).join(' ').trim();
      continue;
    }

    // ------------------------------------------------------------------
    // Inline JSON-style list: `paths: ["**/*.py", "*.ts"]`
    // ------------------------------------------------------------------
    if (rest.startsWith('[')) {
      // Accumulate across continuation lines until the bracket closes.
      let accumulated = rest;
      while (!accumulated.includes(']') && i < lines.length) {
        accumulated += ' ' + lines[i].trim();
        i++;
      }
      try {
        // Strip trailing YAML comment before parsing.
        const jsonStr = accumulated.replace(/#[^"]*$/, '').trim();
        result[key] = JSON.parse(jsonStr);
      } catch {
        // Fallback: store raw string.
        result[key] = accumulated;
      }
      continue;
    }

    // ------------------------------------------------------------------
    // Block list: lines following the key are `  - item`
    // ------------------------------------------------------------------
    if (rest === '') {
      const listItems = [];
      const nestedObj = {};
      let   isList    = false;
      let   isNested  = false;

      while (i < lines.length) {
        const nextLine = lines[i];
        const nextTrimmed = nextLine.trimEnd();

        // Block list item
        if (/^\s+-\s/.test(nextLine)) {
          isList = true;
          listItems.push(nextTrimmed.replace(/^\s+-\s*/, '').trim());
          i++;
          continue;
        }

        // Nested scalar (indented key: value)
        const nestedMatch = nextLine.match(/^(\s+)([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)/);
        if (nestedMatch && nestedMatch[1].length > 0) {
          isNested = true;
          nestedObj[nestedMatch[2]] = nestedMatch[3].trim().replace(/^["']|["']$/g, '');
          i++;
          continue;
        }

        break; // Next top-level key — stop collecting.
      }

      if (isList) {
        result[key] = listItems;
      } else if (isNested) {
        result[key] = nestedObj;
      }
      // If neither, key had no value and no children — skip it.
      continue;
    }

    // ------------------------------------------------------------------
    // Simple scalar (possibly quoted).
    // ------------------------------------------------------------------
    result[key] = rest.replace(/^["']|["']$/g, '');
  }

  return result;
}

/**
 * Read a file and return its text content, or null on any error.
 *
 * @param {string} filePath
 * @returns {string|null}
 */
function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Derive the slug from a frontmatter object and a fallback directory/file name.
 * Uses the `name` field when present; otherwise the `id` field; otherwise
 * falls back to the supplied directory name.
 *
 * @param {Object} fm     - Parsed frontmatter
 * @param {string} dirName - Directory name to use as fallback
 * @returns {string}
 */
function slugFrom(fm, dirName) {
  if (fm.name && typeof fm.name === 'string') return fm.name.trim();
  if (fm.id   && typeof fm.id   === 'string') return fm.id.trim();
  return dirName;
}

// ---------------------------------------------------------------------------
// Index collection
// ---------------------------------------------------------------------------

/**
 * Build a single index entry.
 *
 * @param {string} slug
 * @param {string} category
 * @param {string} relPath - Path relative to REPO_ROOT
 * @returns {{slug: string, category: string, path: string}}
 */
function makeEntry(slug, category, relPath) {
  return { slug, category, path: relPath };
}

/**
 * Walk all tool/primitive directories and produce the flat index entries.
 *
 * @returns {{slug: string, category: string, path: string}[]}
 */
function collectEntries() {
  const entries = [];

  for (const tool of TOOL_DIRS) {
    const toolDir = path.join(REPO_ROOT, tool);
    if (!fs.existsSync(toolDir)) continue;

    for (const primitive of PRIMITIVE_DIRS) {
      const primitiveDir = path.join(toolDir, primitive);
      if (!fs.existsSync(primitiveDir)) continue;

      const category = CATEGORY_MAP[primitive];

      // ----------------------------------------------------------------
      // github-copilot agents: content lives in flat <name>.agent.md files
      // in the agents/ directory (not in per-name subdirs).
      // ----------------------------------------------------------------
      if (tool === 'github-copilot' && primitive === 'agents') {
        let dirEntries;
        try {
          dirEntries = fs.readdirSync(primitiveDir, { withFileTypes: true });
        } catch {
          continue;
        }

        for (const dirent of dirEntries) {
          if (!dirent.isFile() || !dirent.name.endsWith('.agent.md')) continue;

          const filePath = path.join(primitiveDir, dirent.name);
          const content  = readFileSafe(filePath);
          const fm       = parseFrontmatter(extractFrontmatterBlock(content || ''));
          // Derive slug from frontmatter name or strip the .agent.md suffix.
          const fallback = dirent.name.replace(/\.agent\.md$/, '');
          const slug     = slugFrom(fm, fallback);
          const relPath  = path.relative(REPO_ROOT, filePath);

          entries.push(makeEntry(slug, category, relPath));
        }
        continue; // Done with github-copilot/agents.
      }

      // ----------------------------------------------------------------
      // All other tools/primitives: per-name subdirectory layout.
      // ----------------------------------------------------------------
      let subdirs;
      try {
        subdirs = fs.readdirSync(primitiveDir, { withFileTypes: true });
      } catch {
        continue;
      }

      for (const dirent of subdirs) {
        if (!dirent.isDirectory()) continue;

        const name    = dirent.name;
        const nameDir = path.join(primitiveDir, name);

        // --------------------------------------------------------------
        // Hooks: no content .md file — produce a stub from directory name.
        // All three tools follow this pattern for hooks.
        // --------------------------------------------------------------
        if (primitive === 'hooks') {
          const relPath = path.relative(REPO_ROOT, nameDir);
          entries.push(makeEntry(name, category, relPath));
          continue;
        }

        // --------------------------------------------------------------
        // openai-codex: all primitives → stub from directory name.
        // Content lives in flat .toml files one level above; we record
        // the subdir path as a stable reference point.
        // --------------------------------------------------------------
        if (tool === 'openai-codex') {
          const relPath = path.relative(REPO_ROOT, nameDir);
          entries.push(makeEntry(name, category, relPath));
          continue;
        }

        // --------------------------------------------------------------
        // Bundles: read bundle.yaml for slug/path.
        // Handle missing bundle.yaml gracefully (produce no entry).
        // --------------------------------------------------------------
        if (primitive === 'bundles') {
          const bundleYaml = path.join(nameDir, 'bundle.yaml');
          if (!fs.existsSync(bundleYaml)) {
            // Missing bundle.yaml — skip this bundle silently.
            continue;
          }
          const content = readFileSafe(bundleYaml);
          if (!content) continue;

          // Minimal YAML scalar extraction for bundle.yaml (not frontmatter-delimited).
          // Only need the `id` field; fallback to directory name.
          const idMatch = content.match(/^id:\s*["']?([^\s"'\n]+)["']?/m);
          const slug    = idMatch ? idMatch[1].trim() : name;
          const relPath = path.relative(REPO_ROOT, bundleYaml);

          entries.push(makeEntry(slug, category, relPath));
          continue;
        }

        // --------------------------------------------------------------
        // github-copilot non-agent primitives:
        //   - skills:   SKILL.md inside the subdir (same as claude-code)
        //   - commands: no content .md in subdir — stub from dir name
        //   - rules:    no content .md in subdir — stub from dir name
        // --------------------------------------------------------------
        if (tool === 'github-copilot') {
          if (primitive === 'skills') {
            const skillMd  = path.join(nameDir, 'SKILL.md');
            const content  = readFileSafe(skillMd);
            const fm       = content
              ? parseFrontmatter(extractFrontmatterBlock(content))
              : {};
            const slug    = slugFrom(fm, name);
            const relPath = content
              ? path.relative(REPO_ROOT, skillMd)
              : path.relative(REPO_ROOT, nameDir);
            entries.push(makeEntry(slug, category, relPath));
          } else {
            // commands, commands-unsupported, rules — stub from dir name.
            const relPath = path.relative(REPO_ROOT, nameDir);
            entries.push(makeEntry(name, category, relPath));
          }
          continue;
        }

        // --------------------------------------------------------------
        // claude-code: read the primary .md file for each primitive.
        //
        //   agents   → <name>/<name>.md
        //   skills   → <name>/SKILL.md
        //   commands → <name>/<name>.md
        //   rules    → <name>/<name>.md  (slug from dir name; rules use `paths` not `name`)
        // --------------------------------------------------------------
        let contentFile;
        if (primitive === 'skills') {
          contentFile = path.join(nameDir, 'SKILL.md');
        } else {
          // agents, commands, rules all follow <name>.md convention.
          contentFile = path.join(nameDir, `${name}.md`);
        }

        const content = readFileSafe(contentFile);
        if (!content) {
          // No content file — emit a stub using the directory name.
          const relPath = path.relative(REPO_ROOT, nameDir);
          entries.push(makeEntry(name, category, relPath));
          continue;
        }

        const fmBlock = extractFrontmatterBlock(content);
        if (!fmBlock) {
          // Expected-frontmatter category has a content file but no parseable frontmatter
          // block. Warn loudly so frontmatter typos surface in CI logs. The stub entry is
          // still emitted (silent degradation is intentional); only the warning is new.
          process.stderr.write(
            `[generate-index] WARNING: no frontmatter block found in ${contentFile} — emitting directory-name stub for "${name}"\n`
          );
        }
        const fm      = parseFrontmatter(fmBlock);
        // Rules use `paths` frontmatter (not `name`); derive slug from directory name.
        const slug    = primitive === 'rules' ? name : slugFrom(fm, name);
        const relPath = path.relative(REPO_ROOT, contentFile);

        entries.push(makeEntry(slug, category, relPath));
      }
    }
  }

  // -------------------------------------------------------------------------
  // Root-level skills/ directory (universal, not under any tool dir).
  // These skills are tool-agnostic; path prefix will be 'skills'.
  // -------------------------------------------------------------------------
  const rootSkillsDir = path.join(REPO_ROOT, 'skills');
  if (fs.existsSync(rootSkillsDir)) {
    let skillSubdirs;
    try {
      skillSubdirs = fs.readdirSync(rootSkillsDir, { withFileTypes: true });
    } catch {
      skillSubdirs = [];
    }

    for (const dirent of skillSubdirs) {
      if (!dirent.isDirectory()) continue;

      const name      = dirent.name;
      const nameDir   = path.join(rootSkillsDir, name);
      const skillMd   = path.join(nameDir, 'SKILL.md');
      const content   = readFileSafe(skillMd);

      if (!content) {
        const relPath = path.relative(REPO_ROOT, nameDir);
        entries.push(makeEntry(name, 'skill', relPath));
        continue;
      }

      const fmBlock = extractFrontmatterBlock(content);
      if (!fmBlock) {
        process.stderr.write(
          `[generate-index] WARNING: no frontmatter block found in ${skillMd} — emitting directory-name stub for "${name}"\n`
        );
      }
      const fm      = parseFrontmatter(fmBlock);
      const slug    = slugFrom(fm, name);
      const relPath = path.relative(REPO_ROOT, skillMd);

      entries.push(makeEntry(slug, 'skill', relPath));
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Sort
// ---------------------------------------------------------------------------

/**
 * Deterministic sort key: tool (derived from path prefix) → category → slug.
 *
 * @param {string} entryPath - Relative path from the entry
 * @param {string} category
 * @param {string} slug
 * @returns {string}
 */
function sortKey(entryPath, category, slug) {
  // Derive tool from the leading path segment.
  const tool = entryPath.split(path.sep)[0] || '';
  return `${tool}|${category}|${slug}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const entries = collectEntries();

  entries.sort((a, b) => {
    const ka = sortKey(a.path, a.category, a.slug);
    const kb = sortKey(b.path, b.category, b.slug);
    if (ka < kb) return -1;
    if (ka > kb) return  1;
    return 0;
  });

  const output = JSON.stringify(entries, null, 2) + '\n';
  fs.writeFileSync(OUTPUT_FILE, output, 'utf8');

  process.stdout.write(
    `Generated ${OUTPUT_FILE} — ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}\n`
  );
}

// ---------------------------------------------------------------------------
// Inline test harness — run with: node scripts/generate-index.js --test
// ---------------------------------------------------------------------------

/**
 * Minimal assertion helper. Throws on failure so a single bad assertion
 * does not silence subsequent tests.
 */
function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

function runTests() {
  let passed = 0;
  let failed = 0;

  // -------------------------------------------------------------------------
  // Test 1 — Frontmatter extraction from a synthetic .md string
  // -------------------------------------------------------------------------
  try {
    const syntheticMd = [
      '---',
      'name: planner',
      'description: >',
      '  Autonomous planning agent that reads codebases and decomposes tasks.',
      '# version: 1.5.0',
      'permissionMode: auto',
      'maxTurns: 50',
      '---',
      '',
      '# Body text here',
    ].join('\n');

    const block = extractFrontmatterBlock(syntheticMd);
    assert(block !== null, 'extractFrontmatterBlock should return non-null for valid frontmatter');

    const fm = parseFrontmatter(block);
    assert(fm.name === 'planner', `name should be 'planner', got '${fm.name}'`);
    assert(
      typeof fm.description === 'string' && fm.description.length > 0,
      'description should be a non-empty string'
    );
    // Comment line should NOT produce a `version` key.
    assert(
      !Object.prototype.hasOwnProperty.call(fm, 'version'),
      'comment line `# version:` must not produce a version key'
    );
    assert(fm.permissionMode === 'auto', `permissionMode should be 'auto', got '${fm.permissionMode}'`);
    assert(fm.maxTurns === '50', `maxTurns should be '50', got '${fm.maxTurns}'`);

    // Test missing frontmatter block returns empty object.
    const noFm = parseFrontmatter(null);
    assert(
      typeof noFm === 'object' && Object.keys(noFm).length === 0,
      'parseFrontmatter(null) should return empty object'
    );

    // Test paths inline list parsing (rule frontmatter).
    const ruleFm = parseFrontmatter(
      extractFrontmatterBlock(
        '---\npaths: ["**/Dockerfile*", "**/docker-compose*.yml"]\n---\n'
      )
    );
    assert(Array.isArray(ruleFm.paths), 'paths should be an array');
    assert(ruleFm.paths.length === 2, `paths should have 2 entries, got ${ruleFm.paths.length}`);

    process.stdout.write('  PASS test 1 — frontmatter extraction and parsing\n');
    passed++;
  } catch (err) {
    process.stdout.write(`  FAIL test 1 — frontmatter extraction: ${err.message}\n`);
    failed++;
  }

  // -------------------------------------------------------------------------
  // Test 2 — Slug derivation from directory name when no .md exists
  // -------------------------------------------------------------------------
  try {
    // Empty frontmatter → slugFrom should fall back to dirName.
    const fm1 = {};
    const slug1 = slugFrom(fm1, 'pre-push-secrets');
    assert(slug1 === 'pre-push-secrets', `slug from empty fm should be dir name, got '${slug1}'`);

    // Frontmatter with `name` → use name.
    const fm2 = { name: 'retro' };
    const slug2 = slugFrom(fm2, 'retro-dir');
    assert(slug2 === 'retro', `slug should use fm.name 'retro', got '${slug2}'`);

    // Frontmatter with `id` but no `name` → use id.
    const fm3 = { id: 'backend-development' };
    const slug3 = slugFrom(fm3, 'backend-development-dir');
    assert(slug3 === 'backend-development', `slug should use fm.id, got '${slug3}'`);

    // Frontmatter with both `name` and `id` → name wins.
    const fm4 = { name: 'my-name', id: 'my-id' };
    const slug4 = slugFrom(fm4, 'fallback');
    assert(slug4 === 'my-name', `slug should prefer name over id, got '${slug4}'`);

    process.stdout.write('  PASS test 2 — slug derivation from directory name and frontmatter\n');
    passed++;
  } catch (err) {
    process.stdout.write(`  FAIL test 2 — slug derivation: ${err.message}\n`);
    failed++;
  }

  // -------------------------------------------------------------------------
  // Test 3 — Sort order determinism across two synthetic entries
  // -------------------------------------------------------------------------
  try {
    const syntheticEntries = [
      { slug: 'retro',   category: 'skill', path: 'skills/retro/SKILL.md' },
      { slug: 'planner', category: 'agent', path: 'claude-code/agents/planner/planner.md' },
      { slug: 'lint',    category: 'command', path: 'claude-code/commands/lint/lint.md' },
      // Same tool and category as retro — should sort after planner alphabetically
      // but before retro because 'backend' < 'retro'.
      { slug: 'backend', category: 'skill', path: 'skills/backend/SKILL.md' },
    ];

    syntheticEntries.sort((a, b) => {
      const ka = sortKey(a.path, a.category, a.slug);
      const kb = sortKey(b.path, b.category, b.slug);
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });

    // All entries are claude-code, so sort is category then slug.
    // category order: agent < command < skill
    assert(syntheticEntries[0].slug === 'planner', `first should be planner (agent), got '${syntheticEntries[0].slug}'`);
    assert(syntheticEntries[1].slug === 'lint',    `second should be lint (command), got '${syntheticEntries[1].slug}'`);
    assert(syntheticEntries[2].slug === 'backend', `third should be backend (skill), got '${syntheticEntries[2].slug}'`);
    assert(syntheticEntries[3].slug === 'retro',   `fourth should be retro (skill), got '${syntheticEntries[3].slug}'`);

    // Verify idempotence: sorting an already-sorted array produces the same order.
    const copy = [...syntheticEntries];
    copy.sort((a, b) => {
      const ka = sortKey(a.path, a.category, a.slug);
      const kb = sortKey(b.path, b.category, b.slug);
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });
    for (let i = 0; i < syntheticEntries.length; i++) {
      assert(
        copy[i].slug === syntheticEntries[i].slug,
        `sort idempotence failed at index ${i}: expected '${syntheticEntries[i].slug}', got '${copy[i].slug}'`
      );
    }

    process.stdout.write('  PASS test 3 — sort order determinism and idempotence\n');
    passed++;
  } catch (err) {
    process.stdout.write(`  FAIL test 3 — sort order: ${err.message}\n`);
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
  process.stdout.write('Running inline tests for generate-index.js...\n\n');
  runTests();
} else {
  main();
}
