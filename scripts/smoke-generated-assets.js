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

function listRuleSlugs() {
  return fs.readdirSync(path.join(REPO_ROOT, 'rules'), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(name => exists(path.join('rules', name, `${name}.md`)))
    .sort();
}

function listDirectoryNames(rootDir) {
  return fs.readdirSync(path.join(REPO_ROOT, rootDir), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
}

function listClaudeAdapterSlugs(rootDir, markerFile) {
  return listDirectoryNames(rootDir)
    .filter(name => exists(path.join(rootDir, name, markerFile.replace('{name}', name))))
}

function listFlatAdapterSlugs(rootDir, suffix) {
  return fs.readdirSync(path.join(REPO_ROOT, rootDir), { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith(suffix))
    .map(entry => entry.name.slice(0, -suffix.length))
    .sort();
}

function assertExactSlugSet(actual, expected, label) {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${label} drifted from canonical set.\nexpected: ${expected.join(', ') || '(none)'}\nactual: ${actual.join(', ') || '(none)'}`
  );
}

function runNodeScript(scriptPath, extraArgs = []) {
  execFileSync(process.execPath, [path.join(REPO_ROOT, scriptPath), ...extraArgs], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
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
  const rules = listRuleSlugs();

  for (const agent of agents) {
    assert(exists(path.join('claude-code', 'agents', agent, `${agent}.md`)), `missing Claude agent adapter for ${agent}`);
    assert(exists(path.join('github-copilot', 'agents', `${agent}.agent.md`)), `missing GitHub Copilot agent adapter for ${agent}`);
    assert(exists(path.join('openai-codex', 'agents', `${agent}.toml`)), `missing OpenAI Codex agent adapter for ${agent}`);
  }

  for (const workflow of workflows) {
    assert(exists(path.join('claude-code', 'commands', workflow, `${workflow}.md`)), `missing Claude command adapter for ${workflow}`);
    assert(exists(path.join('github-copilot', 'prompts', `${workflow}.prompt.md`)), `missing GitHub Copilot prompt adapter for ${workflow}`);
  }

  for (const rule of rules) {
    assert(exists(path.join('claude-code', 'rules', rule, `${rule}.md`)), `missing Claude rule adapter for ${rule}`);
    assert(exists(path.join('github-copilot', 'instructions', `${rule}.instructions.md`)), `missing GitHub Copilot instruction adapter for ${rule}`);
  }

  assertExactSlugSet(
    listDirectoryNames('claude-code/agents'),
    agents,
    'Claude agent adapter directories'
  );
  assertExactSlugSet(
    listClaudeAdapterSlugs('claude-code/agents', '{name}.md'),
    agents,
    'Claude agent adapters'
  );
  assertExactSlugSet(
    listFlatAdapterSlugs('github-copilot/agents', '.agent.md'),
    agents,
    'GitHub Copilot agent adapters'
  );
  assertExactSlugSet(
    listFlatAdapterSlugs('openai-codex/agents', '.toml'),
    agents,
    'OpenAI Codex agent adapters'
  );
  assertExactSlugSet(
    listDirectoryNames('claude-code/commands'),
    workflows,
    'Claude command adapter directories'
  );
  assertExactSlugSet(
    listClaudeAdapterSlugs('claude-code/commands', '{name}.md'),
    workflows,
    'Claude command adapters'
  );
  assertExactSlugSet(
    listFlatAdapterSlugs('github-copilot/prompts', '.prompt.md'),
    workflows,
    'GitHub Copilot prompt adapters'
  );
  assert(
    !exists(path.join('github-copilot', 'commands')),
    'github-copilot/commands should not exist'
  );
  assertExactSlugSet(
    listDirectoryNames('claude-code/rules'),
    rules,
    'Claude rule adapter directories'
  );
  assertExactSlugSet(
    listClaudeAdapterSlugs('claude-code/rules', '{name}.md'),
    rules,
    'Claude rule adapters'
  );
  assertExactSlugSet(
    listFlatAdapterSlugs('github-copilot/instructions', '.instructions.md'),
    rules,
    'GitHub Copilot rule adapters'
  );

  return { agents, workflows, rules };
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

function assertRuleAdaptersMatch(rules) {
  for (const rule of rules) {
    const canonical = readText(path.join('rules', rule, `${rule}.md`)).trim();
    const claudeRule = readText(path.join('claude-code', 'rules', rule, `${rule}.md`)).trim();

    assert(canonical === claudeRule, `Claude rule adapter does not match canonical rule body for ${rule}`);
  }
}

function assertRuleCatalogEntriesExist(rules) {
  const index = readJson('index.json');
  const artifactKeys = new Set(
    (index.artifacts || []).map(artifact => `${artifact.target_tool}|${artifact.artifact_path}`)
  );

  for (const rule of rules) {
    assert(
      artifactKeys.has(`claude-code|claude-code/rules/${rule}/${rule}.md`),
      `missing index.json entry for Claude rule ${rule}`
    );
    assert(
      artifactKeys.has(`github-copilot|github-copilot/instructions/${rule}.instructions.md`),
      `missing index.json entry for GitHub Copilot rule ${rule}`
    );
  }
}

function main() {
  runNodeScript('scripts/sync-canonical-adapters.js');
  runNodeScript('scripts/generate-index.js');
  runNodeScript('scripts/generate-index.js', ['--test']);

  const { agents, workflows, rules } = assertGeneratedFilesExist();
  assert(exists(path.relative(REPO_ROOT, INDEX_PATH)), 'missing generated index.json');
  assertCodexAgentBodiesMatch(agents);
  assertCatalogEntriesExist(agents, workflows);
  assertRuleAdaptersMatch(rules);
  assertRuleCatalogEntriesExist(rules);

  process.stdout.write(
    `Smoke test passed: ${agents.length} canonical agents, ${workflows.length} canonical workflows, ${rules.length} canonical rules, and index.json are all generated.\n`
  );
}

main();
