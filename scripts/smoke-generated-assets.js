#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const INDEX_PATH = path.join(REPO_ROOT, 'index.json');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function exists(relPath) {
  return fs.existsSync(path.join(REPO_ROOT, relPath));
}

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8'));
}

function readText(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
}

function listCanonicalSlugs(rootDir, markerFile) {
  return fs.readdirSync(path.join(REPO_ROOT, rootDir), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(name => exists(path.join(rootDir, name, markerFile)))
    .sort();
}

function runNodeScript(scriptPath, extraArgs = []) {
  execFileSync(process.execPath, [path.join(REPO_ROOT, scriptPath), ...extraArgs], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
}

function rgMatches(pattern, paths, extraArgs = []) {
  try {
    const output = execFileSync('rg', ['-l', pattern, ...extraArgs, ...paths], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    }).trim();
    return output ? output.split('\n').filter(Boolean) : [];
  } catch (error) {
    if (error.status === 1) {
      return [];
    }
    throw error;
  }
}

function canonicalBody(markdown) {
  let body = markdown;
  if (body.startsWith('---\n')) {
    const end = body.indexOf('\n---\n', 4);
    if (end !== -1) body = body.slice(end + 5);
  }

  return body
    .trimStart()
    .replace(/^<!-- Canonical shared (agent|workflow) body\. Tool-native wrappers live in the listed adapter files\. -->\n\n?/, '')
    .trim();
}

function parseTomlMultilineBasicString(text, key) {
  const marker = `${key} = """`;
  const start = text.indexOf(marker);
  if (start === -1) return null;

  let i = start + marker.length;
  if (text[i] === '\n') i += 1;

  let value = '';
  while (i < text.length) {
    if (text.startsWith('"""', i)) {
      return value;
    }

    if (text[i] === '\\') {
      const next = text[i + 1];
      const nextTwo = text.slice(i + 1, i + 3);
      if (next === '\\') {
        value += '\\';
        i += 2;
        continue;
      }
      if (nextTwo === '""') {
        value += '"""';
        i += 4;
        continue;
      }
    }

    value += text[i];
    i += 1;
  }

  return null;
}

function assertGeneratedFilesExist() {
  const agents = listCanonicalSlugs('agents', 'AGENT.md');
  const workflows = listCanonicalSlugs('workflows', 'WORKFLOW.md');

  for (const agent of agents) {
    assert(exists(path.join('claude-code', 'agents', agent, `${agent}.md`)), `missing Claude agent adapter for ${agent}`);
    assert(exists(path.join('github-copilot', 'agents', `${agent}.agent.md`)), `missing GitHub Copilot agent adapter for ${agent}`);
    assert(exists(path.join('openai-codex', 'agents', `${agent}.toml`)), `missing OpenAI Codex agent adapter for ${agent}`);
  }

  for (const workflow of workflows) {
    assert(exists(path.join('claude-code', 'commands', workflow, `${workflow}.md`)), `missing Claude command adapter for ${workflow}`);
    assert(exists(path.join('github-copilot', 'prompts', `${workflow}.prompt.md`)), `missing GitHub Copilot prompt adapter for ${workflow}`);
    assert(exists(path.join('github-copilot', 'commands', workflow, 'manifest.json')), `missing GitHub Copilot command manifest for ${workflow}`);
  }

  return { agents, workflows };
}

function assertCodexAgentBodiesMatch(agents) {
  for (const agent of agents) {
    const canonical = canonicalBody(readText(path.join('agents', agent, 'AGENT.md')));
    const codexToml = readText(path.join('openai-codex', 'agents', `${agent}.toml`));
    const developerInstructions = parseTomlMultilineBasicString(codexToml, 'developer_instructions');

    assert(developerInstructions !== null, `missing multiline developer_instructions for ${agent}`);
    assert(
      canonical === developerInstructions.trim(),
      `OpenAI Codex developer_instructions do not match canonical agent body for ${agent}`
    );
  }
}

function assertCatalogEntriesExist(agents, workflows) {
  const index = readJson('index.json');
  const artifactKeys = new Set(
    (index.artifacts || []).map(artifact => `${artifact.target_tool}|${artifact.artifact_path}`)
  );

  for (const agent of agents) {
    assert(
      artifactKeys.has(`claude-code|claude-code/agents/${agent}/${agent}.md`),
      `missing index.json entry for Claude agent ${agent}`
    );
    assert(
      artifactKeys.has(`github-copilot|github-copilot/agents/${agent}.agent.md`),
      `missing index.json entry for GitHub Copilot agent ${agent}`
    );
    assert(
      artifactKeys.has(`openai-codex|openai-codex/agents/${agent}.toml`),
      `missing index.json entry for OpenAI Codex agent ${agent}`
    );
  }

  for (const workflow of workflows) {
    assert(
      artifactKeys.has(`claude-code|claude-code/commands/${workflow}/${workflow}.md`),
      `missing index.json entry for Claude command ${workflow}`
    );
    assert(
      artifactKeys.has(`github-copilot|github-copilot/prompts/${workflow}.prompt.md`),
      `missing index.json entry for GitHub Copilot prompt ${workflow}`
    );
  }
}

function assertRetroStorageContract() {
  const scanRoots = ['agents', 'skills', 'workflows', 'docs', 'scripts', 'claude-code', 'github-copilot', 'openai-codex'];
  const excludes = [
    '--glob', '!claude-code/retros/**',
    '--glob', '!**/CHANGELOG.md',
    '--glob', '!scripts/smoke-generated-assets.js',
    '--glob', '!scripts/migrate-retros.sh',
  ];

  const legacyPathMatches = rgMatches('~/.claude/retros', scanRoots, excludes);
  assert(
    legacyPathMatches.length === 0,
    `legacy retro path references remain outside historical artifacts: ${legacyPathMatches.join(', ')}`
  );

  const legacyStateMatches = rgMatches('STATE_ROOT/retros', scanRoots, excludes);
  assert(
    legacyStateMatches.length === 0,
    `STATE_ROOT/retros references remain in active/generated assets: ${legacyStateMatches.join(', ')}`
  );

  const canonicalMatches = rgMatches('~/agent-retros', scanRoots, ['--glob', '!claude-code/retros/**']);
  assert(canonicalMatches.length > 0, 'expected active/generated assets to reference ~/agent-retros');

  const overrideMatches = rgMatches('AGENT_RETRO_DIR', ['skills', 'docs', 'scripts']);
  assert(overrideMatches.length > 0, 'expected AGENT_RETRO_DIR contract to appear in source docs/scripts');
}

function main() {
  runNodeScript('scripts/sync-canonical-adapters.js');
  runNodeScript('scripts/generate-index.js');
  runNodeScript('scripts/generate-index.js', ['--test']);

  const { agents, workflows } = assertGeneratedFilesExist();
  assert(exists(path.relative(REPO_ROOT, INDEX_PATH)), 'missing generated index.json');
  assertCodexAgentBodiesMatch(agents);
  assertCatalogEntriesExist(agents, workflows);
  assertRetroStorageContract();

  process.stdout.write(
    `Smoke test passed: ${agents.length} canonical agents, ${workflows.length} canonical workflows, and index.json are all generated.\n`
  );
}

main();
