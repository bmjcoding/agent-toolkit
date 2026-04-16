#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const MARKDOWN_SCAN_ROOTS = [
  'AGENTS.md',
  'README.md',
  'CONTRIBUTING.md',
  'agents',
  'docs',
  'claude-code',
  'github-copilot',
  'hooks',
  'openai-codex',
  'rules',
  'skills',
  'workflows',
];
const TEXT_SCAN_ROOTS = [
  ...MARKDOWN_SCAN_ROOTS,
  'scripts',
];
const TEXT_FILE_EXTENSIONS = new Set([
  '.js',
  '.json',
  '.md',
  '.py',
  '.sh',
  '.toml',
  '.yaml',
  '.yml',
]);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function relativePath(filePath) {
  return toPosix(path.relative(REPO_ROOT, filePath));
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function walkFiles(scanRoots, predicate) {
  const files = [];

  function visit(absolutePath) {
    if (!fs.existsSync(absolutePath)) return;

    const stat = fs.statSync(absolutePath);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(absolutePath, { withFileTypes: true })) {
        visit(path.join(absolutePath, entry.name));
      }
      return;
    }

    if (predicate(absolutePath)) {
      files.push(absolutePath);
    }
  }

  for (const scanRoot of scanRoots) {
    visit(path.join(REPO_ROOT, scanRoot));
  }

  return files.sort();
}

function isMarkdownFile(filePath) {
  return path.extname(filePath) === '.md' && path.basename(filePath) !== 'CHANGELOG.md';
}

function isTextFile(filePath) {
  return TEXT_FILE_EXTENSIONS.has(path.extname(filePath)) && path.basename(filePath) !== 'CHANGELOG.md';
}

function stripCodeAndComments(markdown) {
  return markdown
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '')
    .replace(/`[^`\n]+`/g, '');
}

function extractInlineTargets(markdown) {
  const content = stripCodeAndComments(markdown);
  const targets = [];
  const linkPattern = /!?\[[^\]]*]\(([^)]+)\)/g;
  let match;

  while ((match = linkPattern.exec(content)) !== null) {
    const rawTarget = match[1].trim();
    if (!rawTarget) continue;

    let target = rawTarget;
    if (rawTarget.startsWith('<')) {
      const closingIndex = rawTarget.indexOf('>');
      if (closingIndex !== -1) {
        target = rawTarget.slice(1, closingIndex);
      }
    } else {
      target = rawTarget.split(/\s+/)[0];
    }

    targets.push(target);
  }

  return targets;
}

function isExternalTarget(target) {
  return /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//');
}

function splitTarget(target) {
  const hashIndex = target.indexOf('#');
  if (hashIndex === -1) {
    return { filePart: target, anchor: '' };
  }

  return {
    filePart: target.slice(0, hashIndex),
    anchor: target.slice(hashIndex + 1),
  };
}

function normalizeHeadingText(heading) {
  return heading
    .replace(/<[^>]*>/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`+/g, '')
    .trim();
}

function githubSlugify(heading) {
  const normalized = normalizeHeadingText(heading)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  return normalized;
}

function collectMarkdownAnchors(markdown) {
  const anchors = new Set();
  const seenCounts = new Map();
  let inFence = false;

  for (const line of markdown.split('\n')) {
    if (/^(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
    if (!match) continue;

    const baseSlug = githubSlugify(match[1]);
    if (!baseSlug) continue;

    const duplicateIndex = seenCounts.get(baseSlug) || 0;
    seenCounts.set(baseSlug, duplicateIndex + 1);

    anchors.add(duplicateIndex === 0 ? baseSlug : `${baseSlug}-${duplicateIndex}`);
  }

  return anchors;
}

function assertNoAbsoluteRepoPathLeaks() {
  const leaks = [];
  const repoPathLiteral = toPosix(REPO_ROOT);
  const textFiles = walkFiles(TEXT_SCAN_ROOTS, isTextFile);

  for (const filePath of textFiles) {
    const content = readText(filePath);
    if (content.includes(repoPathLiteral)) {
      leaks.push(relativePath(filePath));
    }
  }

  assert(
    leaks.length === 0,
    `machine-specific absolute repo path leaked into checked-in files: ${leaks.join(', ')}`
  );
}

function assertMarkdownLinksResolve() {
  const markdownFiles = walkFiles(MARKDOWN_SCAN_ROOTS, isMarkdownFile);
  const failures = [];
  const anchorCache = new Map();

  for (const filePath of markdownFiles) {
    const content = readText(filePath);
    const targets = extractInlineTargets(content);

    for (const target of targets) {
      if (isExternalTarget(target)) continue;

      const { filePart, anchor } = splitTarget(target);
      const resolvedPath = filePart
        ? path.resolve(path.dirname(filePath), filePart)
        : filePath;

      if (!fs.existsSync(resolvedPath)) {
        failures.push(`${relativePath(filePath)} -> ${target} (missing target)`);
        continue;
      }

      if (!anchor) continue;
      if (fs.statSync(resolvedPath).isDirectory()) {
        failures.push(`${relativePath(filePath)} -> ${target} (directory targets cannot resolve anchors)`);
        continue;
      }

      if (path.extname(resolvedPath) !== '.md') continue;

      if (!anchorCache.has(resolvedPath)) {
        anchorCache.set(resolvedPath, collectMarkdownAnchors(readText(resolvedPath)));
      }

      if (!anchorCache.get(resolvedPath).has(anchor)) {
        failures.push(`${relativePath(filePath)} -> ${target} (missing anchor)`);
      }
    }
  }

  assert(failures.length === 0, `broken markdown links found:\n- ${failures.join('\n- ')}`);
}

function main() {
  assertNoAbsoluteRepoPathLeaks();
  assertMarkdownLinksResolve();
  process.stdout.write('Reference integrity passed: no machine-specific path leaks and Markdown links resolve.\n');
}

main();
