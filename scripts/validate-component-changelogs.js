#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = { base: null, head: 'HEAD', filesFromStdin: false };

  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--base' && i + 1 < argv.length) {
      args.base = argv[i + 1];
      i += 1;
      continue;
    }
    if (argv[i] === '--head' && i + 1 < argv.length) {
      args.head = argv[i + 1];
      i += 1;
      continue;
    }
    if (argv[i] === '--files-from-stdin') {
      args.filesFromStdin = true;
      continue;
    }

    throw new Error(`Unknown argument: ${argv[i]}`);
  }

  if (!args.filesFromStdin && !args.base) {
    throw new Error('Missing required argument: --base <git-ref>');
  }

  return args;
}

function relExists(relPath) {
  return fs.existsSync(path.join(REPO_ROOT, relPath));
}

function normalizePath(relPath) {
  return relPath.replaceAll(path.sep, '/');
}

function nearestAncestorChangelog(relPath) {
  let dir = path.posix.dirname(relPath);

  while (dir && dir !== '.') {
    const candidate = `${dir}/CHANGELOG.md`;
    if (relExists(candidate)) {
      return candidate;
    }
    const parent = path.posix.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return null;
}

function mappedChangelog(relPath) {
  const explicitMappings = [
    [/^agents\/([^/]+)\//, match => `agents/${match[1]}/CHANGELOG.md`],
    [/^skills\/([^/]+)\//, match => `skills/${match[1]}/CHANGELOG.md`],
    [/^workflows\/([^/]+)\//, match => `workflows/${match[1]}/CHANGELOG.md`],
    [/^rules\/([^/]+)\//, match => `rules/${match[1]}/CHANGELOG.md`],
    [/^claude-code\/agents\/([^/]+)\//, match => `agents/${match[1]}/CHANGELOG.md`],
    [/^github-copilot\/agents\/([^/]+)\.agent\.md$/, match => `agents/${match[1]}/CHANGELOG.md`],
    [/^openai-codex\/agents\/([^/]+)\.toml$/, match => `agents/${match[1]}/CHANGELOG.md`],
    [/^github-copilot\/commands\/([^/]+)\//, match => `workflows/${match[1]}/CHANGELOG.md`],
    [/^github-copilot\/prompts\/([^/]+)\.prompt\.md$/, match => `workflows/${match[1]}/CHANGELOG.md`],
  ];

  for (const [pattern, resolver] of explicitMappings) {
    const match = relPath.match(pattern);
    if (match) {
      return resolver(match);
    }
  }

  return nearestAncestorChangelog(relPath);
}

function changedFiles(baseRef, headRef) {
  const output = execFileSync(
    'git',
    ['diff', '--name-only', '--diff-filter=ACMRD', `${baseRef}..${headRef}`],
    { cwd: REPO_ROOT, encoding: 'utf8' },
  ).trim();

  return output ? output.split('\n').map(normalizePath) : [];
}

function changedFilesFromStdin() {
  const input = fs.readFileSync(0, 'utf8').trim();
  return input ? input.split('\n').map(normalizePath) : [];
}

function main() {
  const { base, head, filesFromStdin } = parseArgs(process.argv);
  const files = filesFromStdin ? changedFilesFromStdin() : changedFiles(base, head);
  const changedSet = new Set(files);
  const requiredChangelogs = new Map();

  for (const relPath of files) {
    if (path.posix.basename(relPath) === 'CHANGELOG.md') continue;

    const changelog = mappedChangelog(relPath);
    if (!changelog) continue;

    if (!requiredChangelogs.has(changelog)) {
      requiredChangelogs.set(changelog, []);
    }
    requiredChangelogs.get(changelog).push(relPath);
  }

  if (requiredChangelogs.size === 0) {
    if (filesFromStdin) {
      console.log('No monitored component files found in the provided file list.');
    } else {
      console.log(`No monitored component files changed between ${base} and ${head}.`);
    }
    return;
  }

  const missing = [...requiredChangelogs.entries()]
    .filter(([changelog]) => !changedSet.has(changelog))
    .sort(([left], [right]) => left.localeCompare(right));

  if (missing.length === 0) {
    console.log(`Component changelog validation passed for ${requiredChangelogs.size} component(s).`);
    return;
  }

  console.error('Component files changed without updating their associated CHANGELOG.md:');
  for (const [changelog, paths] of missing) {
    console.error(`- ${changelog}`);
    for (const relPath of paths.sort()) {
      console.error(`  - ${relPath}`);
    }
  }
  process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(2);
}
