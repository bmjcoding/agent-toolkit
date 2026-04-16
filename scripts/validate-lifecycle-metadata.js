#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const VALID_LIFECYCLES = new Set(['stable', 'beta', 'experimental']);

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function relativePath(filePath) {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join('/');
}

function extractFrontmatter(filePath) {
  const content = readText(filePath);
  if (!content.startsWith('---\n')) return '';

  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return '';
  return content.slice(4, end);
}

function parseLifecycle(frontmatter) {
  const match = frontmatter.match(/^lifecycle:\s*(.+)$/m);
  if (!match) return null;

  const raw = match[1].trim();
  if (!raw) return null;
  return raw.replace(/^['"]|['"]$/g, '').trim().toLowerCase();
}

function validateLifecycleValue(lifecycle, label, errors) {
  if (!lifecycle) {
    errors.push(`${label}: missing lifecycle (expected one of stable, beta, experimental)`);
    return;
  }

  if (!VALID_LIFECYCLES.has(lifecycle)) {
    errors.push(`${label}: invalid lifecycle "${lifecycle}" (expected one of stable, beta, experimental)`);
  }
}

function validateMarkdownDefinitions(dirName, markerPathForEntry, errors) {
  const dirPath = path.join(REPO_ROOT, dirName);
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true }).filter(item => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const filePath = path.join(dirPath, markerPathForEntry(entry.name));
    if (!fs.existsSync(filePath)) continue;
    const frontmatter = extractFrontmatter(filePath);
    validateLifecycleValue(parseLifecycle(frontmatter), relativePath(filePath), errors);
  }
}

function validateCanonicalHooks(errors) {
  const hooksDir = path.join(REPO_ROOT, 'hooks');
  for (const entry of fs.readdirSync(hooksDir, { withFileTypes: true }).filter(item => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const filePath = path.join(hooksDir, entry.name, `${entry.name}.sh`);
    if (!fs.existsSync(filePath)) continue;

    const content = readText(filePath);
    const match = content.match(/^#\s*lifecycle:\s*(.+)$/m);
    const lifecycle = match ? match[1].trim().replace(/^['"]|['"]$/g, '').trim().toLowerCase() : null;
    validateLifecycleValue(lifecycle, relativePath(filePath), errors);
  }
}

function validateBundleStatuses(errors) {
  const bundlesDir = path.join(REPO_ROOT, 'bundles');
  if (!fs.existsSync(bundlesDir)) return;

  for (const entry of fs.readdirSync(bundlesDir, { withFileTypes: true }).filter(item => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const filePath = path.join(bundlesDir, entry.name, 'bundle.yaml');
    if (!fs.existsSync(filePath)) continue;

    const content = readText(filePath);
    const match = content.match(/^status:\s*(.+)$/m);
    const lifecycle = match ? match[1].trim().replace(/^['"]|['"]$/g, '').trim().toLowerCase() : null;
    validateLifecycleValue(lifecycle, relativePath(filePath), errors);
  }
}

function main() {
  const errors = [];

  validateMarkdownDefinitions('agents', name => `${name}/AGENT.md`, errors);
  validateMarkdownDefinitions('skills', name => `${name}/SKILL.md`, errors);
  validateMarkdownDefinitions('workflows', name => `${name}/WORKFLOW.md`, errors);
  validateMarkdownDefinitions('rules', name => `${name}/${name}.md`, errors);
  validateBundleStatuses(errors);
  validateCanonicalHooks(errors);

  if (errors.length > 0) {
    for (const error of errors) {
      process.stderr.write(`${error}\n`);
    }
    process.exit(1);
  }

  process.stdout.write('Lifecycle metadata is valid for canonical components, canonical bundles, and canonical hooks.\n');
}

main();
