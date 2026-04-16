#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const VALID_LIFECYCLES = new Set(['stable', 'beta', 'experimental']);
const HOOK_METADATA_PATH = path.join(REPO_ROOT, 'tools', 'catalog-metadata.json');

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

function readHookMetadata() {
  return JSON.parse(readText(HOOK_METADATA_PATH));
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

function validateHookMetadata(tool, expectedHookIds, metadata, errors) {
  const toolMetadata = metadata.hooks?.[tool];
  if (!toolMetadata || typeof toolMetadata !== 'object') {
    errors.push(`${relativePath(HOOK_METADATA_PATH)}: missing hooks.${tool} metadata block`);
    return;
  }

  for (const hookId of expectedHookIds) {
    const lifecycle = toolMetadata[hookId]?.lifecycle || null;
    validateLifecycleValue(lifecycle, `${relativePath(HOOK_METADATA_PATH)} (${tool}/${hookId})`, errors);
  }

  for (const hookId of Object.keys(toolMetadata).sort()) {
    if (!expectedHookIds.includes(hookId)) {
      errors.push(`${relativePath(HOOK_METADATA_PATH)} (${tool}/${hookId}): metadata exists for an unknown hook`);
    }
  }
}

function main() {
  const errors = [];

  validateMarkdownDefinitions('agents', name => `${name}/AGENT.md`, errors);
  validateMarkdownDefinitions('skills', name => `${name}/SKILL.md`, errors);
  validateMarkdownDefinitions('workflows', name => `${name}/WORKFLOW.md`, errors);
  validateMarkdownDefinitions('rules', name => `${name}/${name}.md`, errors);

  const hookMetadata = readHookMetadata();
  validateHookMetadata('claude-code', listClaudeHookIds(), hookMetadata, errors);
  validateHookMetadata('github-copilot', listCopilotHookIds(), hookMetadata, errors);
  validateHookMetadata('openai-codex', listCodexHookIds(), hookMetadata, errors);

  if (errors.length > 0) {
    for (const error of errors) {
      process.stderr.write(`${error}\n`);
    }
    process.exit(1);
  }

  process.stdout.write('Lifecycle metadata is valid for canonical components and hooks.\n');
}

main();
