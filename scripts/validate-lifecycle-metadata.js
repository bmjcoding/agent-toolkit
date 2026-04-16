#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const VALID_LIFECYCLES = new Set(['stable', 'beta', 'experimental']);
const DEFAULT_HOOK_LIFECYCLE_BY_TOOL = Object.freeze({
  'claude-code': 'stable',
  'github-copilot': 'stable',
  'openai-codex': 'experimental',
});

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

function listClaudeHookIds() {
  return fs.readdirSync(path.join(REPO_ROOT, 'claude-code', 'hooks'), { withFileTypes: true })
    .filter(entry => entry.isDirectory() && fs.existsSync(path.join(REPO_ROOT, 'claude-code', 'hooks', entry.name, 'CHANGELOG.md')))
    .map(entry => entry.name)
    .sort();
}

function listCopilotHookIds() {
  return fs.readdirSync(path.join(REPO_ROOT, 'github-copilot', 'hooks'), { withFileTypes: true })
    .filter(entry => entry.isDirectory() && fs.existsSync(path.join(REPO_ROOT, 'github-copilot', 'hooks', entry.name, `${entry.name}.json`)))
    .map(entry => entry.name)
    .sort();
}

function listCodexHookIds() {
  return fs.readdirSync(path.join(REPO_ROOT, 'openai-codex', 'hooks'), { withFileTypes: true })
    .filter(entry => entry.isDirectory() && fs.existsSync(path.join(REPO_ROOT, 'openai-codex', 'hooks', entry.name, `${entry.name}.sh`)))
    .map(entry => entry.name)
    .sort();
}

function validateHookLifecycleDefaults(tool, hookIds, errors) {
  const lifecycle = DEFAULT_HOOK_LIFECYCLE_BY_TOOL[tool] || null;
  validateLifecycleValue(lifecycle, `derived hook lifecycle (${tool})`, errors);

  if (hookIds.length === 0) {
    errors.push(`${tool}: no hooks found to validate`);
  }
}

function main() {
  const errors = [];

  validateMarkdownDefinitions('agents', name => `${name}/AGENT.md`, errors);
  validateMarkdownDefinitions('skills', name => `${name}/SKILL.md`, errors);
  validateMarkdownDefinitions('workflows', name => `${name}/WORKFLOW.md`, errors);
  validateMarkdownDefinitions('rules', name => `${name}/${name}.md`, errors);

  validateHookLifecycleDefaults('claude-code', listClaudeHookIds(), errors);
  validateHookLifecycleDefaults('github-copilot', listCopilotHookIds(), errors);
  validateHookLifecycleDefaults('openai-codex', listCodexHookIds(), errors);

  if (errors.length > 0) {
    for (const error of errors) {
      process.stderr.write(`${error}\n`);
    }
    process.exit(1);
  }

  process.stdout.write('Lifecycle metadata is valid for canonical components and derived hook targets.\n');
}

main();
