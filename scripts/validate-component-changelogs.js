#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {
    base: null,
    head: 'HEAD',
    filesFromStdin: false,
    requireReleaseVersion: false,
  };

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
    if (argv[i] === '--require-release-version') {
      args.requireReleaseVersion = true;
      continue;
    }

    throw new Error(`Unknown argument: ${argv[i]}`);
  }

  if (!args.filesFromStdin && !args.base) {
    throw new Error('Missing required argument: --base <git-ref>');
  }
  if (args.requireReleaseVersion && !args.base && !args.filesFromStdin) {
    throw new Error('Missing required argument for --require-release-version: --base <git-ref>');
  }

  return args;
}

function relExists(relPath) {
  return fs.existsSync(path.join(REPO_ROOT, relPath));
}

function normalizePath(relPath) {
  return relPath.replaceAll(path.sep, '/');
}

let skillChangelogByIdCache = null;

function extractFrontmatterName(markdown) {
  if (!markdown.startsWith('---')) return null;
  const end = markdown.indexOf('---', 3);
  if (end === -1) return null;
  const match = markdown.slice(3, end).match(/^name:\s*["']?([^"'\n]+)["']?\s*$/m);
  return match ? match[1].trim() : null;
}

function currentSkillChangelogsById() {
  if (skillChangelogByIdCache) return skillChangelogByIdCache;

  const skillsDir = path.join(REPO_ROOT, 'skills');
  const byId = new Map();

  function visit(absDir) {
    const skillPath = path.join(absDir, 'SKILL.md');
    if (fs.existsSync(skillPath)) {
      const markdown = fs.readFileSync(skillPath, 'utf8');
      const relDir = normalizePath(path.relative(REPO_ROOT, absDir));
      const fallbackId = path.posix.basename(relDir);
      byId.set(extractFrontmatterName(markdown) || fallbackId, `${relDir}/CHANGELOG.md`);
      return;
    }

    for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        visit(path.join(absDir, entry.name));
      }
    }
  }

  if (fs.existsSync(skillsDir)) visit(skillsDir);
  skillChangelogByIdCache = byId;
  return byId;
}

function nearestExistingSkillChangelog(relPath) {
  let dir = path.posix.dirname(relPath);
  while (dir && dir !== '.' && dir !== 'skills') {
    const changelog = `${dir}/CHANGELOG.md`;
    if (relExists(changelog)) return changelog;
    const parent = path.posix.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function skillChangelog(relPath) {
  if (!relPath.startsWith('skills/')) return null;

  const nearest = nearestExistingSkillChangelog(relPath);
  if (nearest) return nearest;

  const parts = relPath.split('/');
  if (parts.length === 2) {
    return 'CHANGELOG.md';
  }

  const legacySkillId = parts[1];
  const movedSkillChangelog = currentSkillChangelogsById().get(legacySkillId);
  if (movedSkillChangelog) return movedSkillChangelog;

  const legacySkillRoot = `skills/${legacySkillId}`;
  if (!relExists(`${legacySkillRoot}/SKILL.md`) && !relExists(`${legacySkillRoot}/CHANGELOG.md`)) {
    return 'CHANGELOG.md';
  }

  const basename = path.posix.basename(relPath);
  if (basename === 'SKILL.md' || basename === 'CHANGELOG.md') {
    return `${path.posix.dirname(relPath)}/CHANGELOG.md`;
  }

  const knownSkillSubdirs = new Set(['assets', 'checks', 'evals', 'references', 'scripts', 'templates']);
  const subdirIndex = parts.findIndex((part, index) => index >= 2 && knownSkillSubdirs.has(part));
  if (subdirIndex > 2) {
    return `${parts.slice(0, subdirIndex).join('/')}/CHANGELOG.md`;
  }

  if (parts.length >= 3) {
    return `skills/${parts[1]}/${parts[2]}/CHANGELOG.md`;
  }

  return `skills/${legacySkillId}/CHANGELOG.md`;
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
    [/^(?:README\.md|CONTRIBUTING\.md|AGENTS\.md|CLAUDE\.md|package(?:-lock)?\.json)$/, () => 'CHANGELOG.md'],
    [/^(?:agents|skills|rules|workflows|hooks|bundles|claude-code|github-copilot|openai-codex)\/README\.md$/, () => 'CHANGELOG.md'],
    [/^(?:\.claude|\.github|docs|scripts)\//, () => 'CHANGELOG.md'],
    [/^agents\/([^/]+)\//, match => `agents/${match[1]}/CHANGELOG.md`],
    [/^skills\//, () => skillChangelog(relPath)],
    [/^workflows\/([^/]+)\//, match => `workflows/${match[1]}/CHANGELOG.md`],
    [/^rules\/([^/]+)\//, match => `rules/${match[1]}/CHANGELOG.md`],
    [/^claude-code\/agents\/([^/]+)\//, match => `agents/${match[1]}/CHANGELOG.md`],
    [/^claude-code\/commands\/([^/]+)\/[^/]+\.md$/, match => `workflows/${match[1]}/CHANGELOG.md`],
    [/^claude-code\/rules\/([^/]+)\//, match => `rules/${match[1]}/CHANGELOG.md`],
    [/^github-copilot\/agents\/([^/]+)\.agent\.md$/, match => `agents/${match[1]}/CHANGELOG.md`],
    [/^github-copilot\/instructions\/([^/]+)\.instructions\.md$/, match => `rules/${match[1]}/CHANGELOG.md`],
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

function gitReadFile(ref, relPath) {
  try {
    return execFileSync(
      'git',
      ['show', `${ref}:${relPath}`],
      { cwd: REPO_ROOT, encoding: 'utf8' },
    );
  } catch {
    return null;
  }
}

function readWorkingTreeFile(relPath) {
  try {
    return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
  } catch {
    return null;
  }
}

function gitDiffForPath(baseRef, headRef, relPath) {
  try {
    return execFileSync(
      'git',
      ['diff', '--unified=0', `${baseRef}..${headRef}`, '--', relPath],
      { cwd: REPO_ROOT, encoding: 'utf8' },
    );
  } catch (error) {
    if (error.status === 1 && typeof error.stdout === 'string') {
      return error.stdout;
    }
    throw error;
  }
}

function gitWorkingTreeDiffForPath(relPath) {
  try {
    return execFileSync(
      'git',
      ['diff', '--unified=0', 'HEAD', '--', relPath],
      { cwd: REPO_ROOT, encoding: 'utf8' },
    );
  } catch (error) {
    if (error.status === 1 && typeof error.stdout === 'string') {
      return error.stdout;
    }
    throw error;
  }
}

function isUntracked(relPath) {
  const output = execFileSync(
    'git',
    ['ls-files', '--others', '--exclude-standard', '--', relPath],
    { cwd: REPO_ROOT, encoding: 'utf8' },
  ).trim();
  return output.split('\n').filter(Boolean).includes(relPath);
}

function hasUnreleasedMarker(markdown) {
  return /^(?:## \[Unreleased\]|\[Unreleased\]:)/m.test(markdown);
}

function hasTagBackedVersionFooter(markdown) {
  return /^\[(?:Unreleased|[0-9]+\.[0-9]+\.[0-9]+)\]:\s+https?:\/\/.+(?:\/compare\/|\/tree\/|\/releases\/tag\/)/m.test(markdown);
}

function hasVersionHeader(markdown) {
  return /^## \[[0-9]+\.[0-9]+\.[0-9]+\] - [0-9]{4}-[0-9]{2}-[0-9]{2}( \[YANKED\])?$/m.test(markdown);
}

function addedVersionHeaderFromDiff(diff) {
  return diff
    .split('\n')
    .some(line => /^\+## \[[0-9]+\.[0-9]+\.[0-9]+\] - [0-9]{4}-[0-9]{2}-[0-9]{2}( \[YANKED\])?$/.test(line));
}

function changelogContent({ head, filesFromStdin, relPath }) {
  if (filesFromStdin) {
    return readWorkingTreeFile(relPath);
  }

  return gitReadFile(head, relPath);
}

function hasAddedVersionHeader({ base, head, filesFromStdin, relPath }) {
  if (filesFromStdin) {
    if (isUntracked(relPath)) {
      const content = readWorkingTreeFile(relPath);
      return content !== null && hasVersionHeader(content);
    }
    return addedVersionHeaderFromDiff(gitWorkingTreeDiffForPath(relPath));
  }

  const diff = gitDiffForPath(base, head, relPath);
  return addedVersionHeaderFromDiff(diff);
}

function main() {
  const { base, head, filesFromStdin, requireReleaseVersion } = parseArgs(process.argv);
  const files = filesFromStdin ? changedFilesFromStdin() : changedFiles(base, head);
  const changedSet = new Set(files);
  const changedChangelogs = files
    .filter(relPath => path.posix.basename(relPath) === 'CHANGELOG.md')
    .sort();
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

  if (requiredChangelogs.size === 0 && (!requireReleaseVersion || changedChangelogs.length === 0)) {
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
    const releaseFailures = [];
    if (requireReleaseVersion) {
      const changelogsToCheck = [...new Set([...requiredChangelogs.keys(), ...changedChangelogs])].sort();

      for (const changelog of changelogsToCheck) {
        const headContent = changelogContent({ head, filesFromStdin, relPath: changelog });
        if (headContent === null && requiredChangelogs.has(changelog)) {
          releaseFailures.push({
            changelog,
            reason: `could not read ${changelog}`,
          });
          continue;
        }
        if (headContent === null) continue;

        if (hasUnreleasedMarker(headContent)) {
          releaseFailures.push({
            changelog,
            reason: 'remove ## [Unreleased] sections and [Unreleased] footer links; add a versioned ## [X.Y.Z] - YYYY-MM-DD section for this contribution',
          });
        }

        if (hasTagBackedVersionFooter(headContent)) {
          releaseFailures.push({
            changelog,
            reason: 'remove tag-backed version footer links; changelog versions must remain portable to Bitbucket Data Center',
          });
        }

        if (requiredChangelogs.has(changelog) && !hasAddedVersionHeader({ base, head, filesFromStdin, relPath: changelog })) {
          releaseFailures.push({
            changelog,
            reason: 'no new versioned header was added in this PR diff; add a ## [X.Y.Z] - YYYY-MM-DD section for the promoted change set',
          });
        }
      }

      if (releaseFailures.length === 0) {
        console.log(`Component changelog validation passed for ${requiredChangelogs.size} component(s), including PR release-version enforcement.`);
        return;
      }

      console.error('PR changelog version enforcement failed for the following component changelogs:');
      for (const failure of releaseFailures) {
        console.error(`- ${failure.changelog}: ${failure.reason}`);
      }
      process.exit(1);
    }

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
