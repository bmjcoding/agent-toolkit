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

function isExecutable(relPath) {
  return (fs.statSync(path.join(REPO_ROOT, relPath)).mode & 0o111) !== 0;
}

function findArtifact(index, { targetTool, componentKind, componentId }) {
  return (index.artifacts || []).find(artifact =>
    artifact.target_tool === targetTool &&
    artifact.component_kind === componentKind &&
    artifact.component_id === componentId
  );
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

function listDirectoryBackedSlugs(rootDir, fileNameForSlug) {
  return fs.readdirSync(path.join(REPO_ROOT, rootDir), { withFileTypes: true })
    .filter(entry => entry.isDirectory() && exists(path.join(rootDir, entry.name, fileNameForSlug(entry.name))))
    .map(entry => entry.name)
    .sort();
}

function listFileBackedSlugs(rootDir, suffix) {
  return fs.readdirSync(path.join(REPO_ROOT, rootDir), { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith(suffix))
    .map(entry => entry.name.slice(0, -suffix.length))
    .sort();
}

function diff(expected, actual) {
  return expected.filter(item => !actual.includes(item));
}
function runNodeScript(scriptPath, extraArgs = []) {
  execFileSync(process.execPath, [path.join(REPO_ROOT, scriptPath), ...extraArgs], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
}

function globToRegExp(pattern) {
  let regexBody = '';

  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i];
    const next = pattern[i + 1];

    if (char === '*' && next === '*') {
      regexBody += '.*';
      i += 1;
      continue;
    }

    if (char === '*') {
      regexBody += '[^/]*';
      continue;
    }

    regexBody += /[.+^${}()|[\]\\]/.test(char) ? `\\${char}` : char;
  }

  return new RegExp(`^${regexBody}$`);
}

function parseExcludeGlobs(extraArgs) {
  const excludes = [];
  for (let i = 0; i < extraArgs.length; i += 1) {
    if (extraArgs[i] !== '--glob') continue;
    const value = extraArgs[i + 1];
    if (!value || !value.startsWith('!')) continue;
    excludes.push(globToRegExp(value.slice(1)));
    i += 1;
  }
  return excludes;
}

function isExcluded(relPath, excludePatterns) {
  return excludePatterns.some(pattern => pattern.test(relPath));
}

function walkFiles(relPath, excludePatterns, matches) {
  const absolutePath = path.join(REPO_ROOT, relPath);
  if (!fs.existsSync(absolutePath)) return;

  const stat = fs.statSync(absolutePath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(absolutePath, { withFileTypes: true })) {
      const childRelPath = path.posix.join(relPath, entry.name);
      if (isExcluded(childRelPath, excludePatterns)) continue;
      walkFiles(childRelPath, excludePatterns, matches);
    }
    return;
  }

  if (isExcluded(relPath, excludePatterns)) return;

  try {
    const content = fs.readFileSync(absolutePath, 'utf8');
    matches.push({ relPath, content });
  } catch {
    // Ignore unreadable/binary files in the fallback path; this helper only supports
    // lightweight text scans for smoke assertions.
  }
}

function fallbackMatches(pattern, paths, extraArgs = []) {
  const excludePatterns = parseExcludeGlobs(extraArgs);
  const files = [];
  for (const relPath of paths) {
    walkFiles(relPath, excludePatterns, files);
  }

  return files
    .filter(file => file.content.includes(pattern))
    .map(file => file.relPath);
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
    if (error.code === 'ENOENT') {
      return fallbackMatches(pattern, paths, extraArgs);
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
  const skills = listCanonicalSlugs('skills', 'SKILL.md');
  const workflows = listCanonicalSlugs('workflows', 'WORKFLOW.md');
  const rules = listRuleSlugs();
  const hooks = listDirectoryBackedSlugs('hooks', slug => `${slug}.sh`);
  const claudeAgents = listDirectoryBackedSlugs(path.join('claude-code', 'agents'), slug => `${slug}.md`);
  const copilotAgents = listFileBackedSlugs(path.join('github-copilot', 'agents'), '.agent.md');
  const codexAgents = listFileBackedSlugs(path.join('openai-codex', 'agents'), '.toml');
  const claudeCommands = listDirectoryBackedSlugs(path.join('claude-code', 'commands'), slug => `${slug}.md`);
  const copilotPrompts = listFileBackedSlugs(path.join('github-copilot', 'prompts'), '.prompt.md');
  const copilotHooks = listDirectoryBackedSlugs(path.join('github-copilot', 'hooks'), slug => `${slug}.json`);
  const codexHooks = listDirectoryBackedSlugs(path.join('openai-codex', 'hooks'), slug => `${slug}.sh`);

  assert(diff(claudeAgents, agents).length === 0, `orphan Claude agent adapters found: ${diff(claudeAgents, agents).join(', ')}`);
  assert(diff(copilotAgents, agents).length === 0, `orphan GitHub Copilot agent adapters found: ${diff(copilotAgents, agents).join(', ')}`);
  assert(diff(codexAgents, agents).length === 0, `orphan OpenAI Codex agent adapters found: ${diff(codexAgents, agents).join(', ')}`);
  assert(diff(claudeCommands, workflows).length === 0, `orphan Claude command adapters found: ${diff(claudeCommands, workflows).join(', ')}`);
  assert(diff(copilotPrompts, workflows).length === 0, `orphan GitHub Copilot prompt adapters found: ${diff(copilotPrompts, workflows).join(', ')}`);
  assert(diff(copilotHooks, hooks).length === 0, `orphan GitHub Copilot hook adapters found: ${diff(copilotHooks, hooks).join(', ')}`);
  assert(diff(codexHooks, hooks).length === 0, `orphan OpenAI Codex hook adapters found: ${diff(codexHooks, hooks).join(', ')}`);

  for (const agent of agents) {
    assert(exists(path.join('claude-code', 'agents', `${agent}.md`)), `missing Claude agent adapter for ${agent}`);
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

  for (const hook of hooks) {
    assert(exists(path.join('github-copilot', 'hooks', hook, `${hook}.json`)), `missing GitHub Copilot hook manifest for ${hook}`);
    assert(exists(path.join('github-copilot', 'hooks', hook, `${hook}.sh`)), `missing GitHub Copilot hook adapter for ${hook}`);
    assert(exists(path.join('openai-codex', 'hooks', hook, `${hook}.sh`)), `missing OpenAI Codex hook adapter for ${hook}`);
    assert(isExecutable(path.join('github-copilot', 'hooks', hook, `${hook}.sh`)), `expected GitHub Copilot hook adapter to be executable for ${hook}`);
    assert(isExecutable(path.join('openai-codex', 'hooks', hook, `${hook}.sh`)), `expected OpenAI Codex hook adapter to be executable for ${hook}`);
    assert(isExecutable(path.join('hooks', hook, `${hook}.sh`)), `expected canonical hook shell to be executable for ${hook}`);
  }

  assert(exists(path.join('openai-codex', 'hooks', 'hooks.json')), 'missing OpenAI Codex hooks registry');
  assert(!exists(path.join('github-copilot', 'commands')), 'github-copilot/commands should not exist');
  assert(isExecutable(path.join('github-copilot', 'scripts', 'install.sh')), 'expected GitHub Copilot installer to be executable');

  return { agents, skills, workflows, rules, hooks };
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

function assertCatalogEntriesExist(agents, skills, workflows, rules, hooks) {
  const index = readJson('index.json');
  const artifactKeys = new Set(
    (index.artifacts || []).map(artifact => `${artifact.target_tool}|${artifact.artifact_path}`)
  );

  assert(
    (index.artifacts || []).every(artifact => typeof artifact.lifecycle === 'string' && artifact.lifecycle.length > 0),
    'expected every catalog artifact to expose lifecycle'
  );

  for (const agent of agents) {
    assert(
      artifactKeys.has(`claude-code|claude-code/agents/${agent}.md`),
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

  for (const skill of skills) {
    assert(
      artifactKeys.has(`claude-code|skills/${skill}/SKILL.md`),
      `missing index.json entry for Claude skill ${skill}`
    );
    assert(
      artifactKeys.has(`github-copilot|skills/${skill}/SKILL.md`),
      `missing index.json entry for GitHub Copilot skill ${skill}`
    );
    assert(
      artifactKeys.has(`openai-codex|skills/${skill}/SKILL.md`),
      `missing index.json entry for OpenAI Codex skill ${skill}`
    );
  }

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

  for (const hook of hooks) {
    assert(
      artifactKeys.has(`claude-code|hooks/${hook}/${hook}.sh`),
      `missing index.json entry for Claude hook ${hook}`
    );
    assert(
      artifactKeys.has(`github-copilot|github-copilot/hooks/${hook}/${hook}.json`),
      `missing index.json entry for GitHub Copilot hook ${hook}`
    );
    assert(
      artifactKeys.has(`openai-codex|openai-codex/hooks/${hook}/${hook}.sh`),
      `missing index.json entry for OpenAI Codex hook ${hook}`
    );
  }
}

function assertCodexHookInstallContract(hooks) {
  const index = readJson('index.json');
  const codexRegistry = readJson(path.join('openai-codex', 'hooks', 'hooks.json'));

  for (const hook of hooks) {
    const registryEntry = (codexRegistry.hooks.PreToolUse || [])
      .concat(codexRegistry.hooks.PostToolUse || [])
      .concat(codexRegistry.hooks.UserPromptSubmit || [])
      .concat(codexRegistry.hooks.Stop || [])
      .flatMap(group => group.hooks || [])
      .find(entry => typeof entry.command === 'string' && entry.command.includes(`/openai-codex/hooks/${hook}/${hook}.sh`));

    assert(registryEntry, `missing Codex registry command for ${hook}`);
    assert(
      registryEntry.command === `\${AGENT_TOOLKIT_DIR:-$HOME/.codex}/openai-codex/hooks/${hook}/${hook}.sh`,
      `unexpected Codex registry command path for ${hook}: ${registryEntry.command}`
    );
    assert(
      typeof registryEntry.timeoutMs === 'number' && registryEntry.timeoutMs > 0,
      `expected Codex registry timeoutMs for ${hook}`
    );

    const artifact = (index.artifacts || []).find(item =>
      item.target_tool === 'openai-codex' &&
      item.component_kind === 'hook' &&
      item.component_id === hook
    );

    assert(artifact, `missing openai-codex hook artifact in catalog for ${hook}`);
    assert(
      artifact.install_path === `~/.codex/openai-codex/hooks/${hook}/${hook}.sh`,
      `unexpected Codex hook install path for ${hook}: ${artifact.install_path}`
    );

    const companions = artifact.metadata?.companion_artifacts || [];
    assert(
      companions.includes('openai-codex/hooks/hooks.json'),
      `expected hooks.json companion artifact for Codex hook ${hook}`
    );
    assert(
      companions.includes('hooks/_adapter_lib.sh'),
      `expected hooks/_adapter_lib.sh companion artifact for Codex hook ${hook}`
    );
    assert(
      companions.includes('scripts/orchestrator/dispatch-validator.py') &&
      companions.includes('scripts/orchestrator/validate-handoff.py') &&
      companions.includes('scripts/orchestrator/lint-printf-newlines.sh'),
      `expected orchestrator hook helper companion artifacts for Codex hook ${hook}`
    );
    assert(
      companions.includes(`hooks/${hook}/${hook}.sh`),
      `expected canonical root hook companion artifact for Codex hook ${hook}`
    );
    if (hook === 'integrity-warn') {
      assert(
        companions.includes('openai-codex/scripts/integrity-check.sh'),
        'expected Codex integrity-check companion artifact for integrity-warn'
      );
    }
  }
}

function assertInstallCommandContracts(hooks) {
  const index = readJson('index.json');

  for (const hook of hooks) {
    const claudeArtifact = findArtifact(index, {
      targetTool: 'claude-code',
      componentKind: 'hook',
      componentId: hook,
    });
    assert(claudeArtifact, `missing Claude hook artifact in catalog for ${hook}`);
    assert(
      claudeArtifact.install_command.includes(`chmod +x "$HOME/.claude/hooks/${hook}/${hook}.sh"`),
      `expected Claude hook install command to chmod ${hook}.sh`
    );
    assert(
      claudeArtifact.install_command.includes('curl -fsSL "https://raw.githubusercontent.com/bmjcoding/agent-toolkit/main/hooks/_adapter_lib.sh" -o "$HOME/.claude/hooks/_adapter_lib.sh"'),
      `expected Claude hook install command to download shared adapter library for ${hook}`
    );

    const copilotArtifact = findArtifact(index, {
      targetTool: 'github-copilot',
      componentKind: 'hook',
      componentId: hook,
    });
    assert(copilotArtifact, `missing GitHub Copilot hook artifact in catalog for ${hook}`);
    assert(
      copilotArtifact.install_command.includes(`curl -fsSL "https://raw.githubusercontent.com/bmjcoding/agent-toolkit/main/github-copilot/hooks/${hook}/${hook}.json" -o ".github/hooks/${hook}.json"`),
      `expected GitHub Copilot hook install command to download ${hook}.json`
    );
    assert(
      copilotArtifact.install_command.includes(`curl -fsSL "https://raw.githubusercontent.com/bmjcoding/agent-toolkit/main/github-copilot/hooks/${hook}/${hook}.sh" -o ".github/hooks/${hook}.sh"`),
      `expected GitHub Copilot hook install command to download ${hook}.sh`
    );
    assert(
      copilotArtifact.install_command.includes(`chmod +x ".github/hooks/${hook}.sh"`),
      `expected GitHub Copilot hook install command to chmod ${hook}.sh`
    );
    assert(
      copilotArtifact.install_command.includes(`curl -fsSL "https://raw.githubusercontent.com/bmjcoding/agent-toolkit/main/hooks/${hook}/${hook}.sh" -o "hooks/${hook}/${hook}.sh"`),
      `expected GitHub Copilot hook install command to download canonical root hook for ${hook}`
    );
    assert(
      !copilotArtifact.install_command.includes(`chmod +x ".github/hooks/${hook}.json"`),
      `expected GitHub Copilot hook install command to skip chmod for ${hook}.json`
    );
    assert(
      !copilotArtifact.install_command.includes('# register'),
      `expected GitHub Copilot hook install command to omit inline comments for ${hook}`
    );

    const codexArtifact = findArtifact(index, {
      targetTool: 'openai-codex',
      componentKind: 'hook',
      componentId: hook,
    });
    assert(codexArtifact, `missing OpenAI Codex hook artifact in catalog for ${hook}`);
    assert(
      codexArtifact.install_command.includes(`chmod +x "$HOME/.codex/openai-codex/hooks/${hook}/${hook}.sh"`),
      `expected Codex hook install command to chmod the primary hook shell for ${hook}`
    );
    assert(
      codexArtifact.install_command.includes('chmod +x "$HOME/.codex/hooks/_adapter_lib.sh"'),
      `expected Codex hook install command to chmod the shared adapter library for ${hook}`
    );
    assert(
      codexArtifact.install_command.includes(`chmod +x "$HOME/.codex/hooks/${hook}/${hook}.sh"`),
      `expected Codex hook install command to chmod the shared canonical hook shell for ${hook}`
    );
    assert(
      !codexArtifact.install_command.includes('chmod +x "$HOME/.codex/hooks.json"'),
      `expected Codex hook install command to skip chmod for hooks.json on ${hook}`
    );
  }

  const nonShellArtifact = findArtifact(index, {
    targetTool: 'github-copilot',
    componentKind: 'rule',
    componentId: 'logging',
  });
  assert(nonShellArtifact, 'missing GitHub Copilot logging rule artifact in catalog');
  assert(
    !nonShellArtifact.install_command.includes('chmod +x '),
    'expected non-shell artifact install command to skip chmod +x'
  );
}

function assertRetroStorageContract() {
  const scanRoots = ['agents', 'skills', 'workflows', 'docs', 'scripts', 'claude-code', 'github-copilot', 'openai-codex'];
  const excludes = [
    '--glob', '!**/CHANGELOG.md',
    '--glob', '!scripts/smoke-generated-assets.js',
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

  const canonicalMatches = rgMatches('~/agent-retros', scanRoots);
  assert(canonicalMatches.length > 0, 'expected active/generated assets to reference ~/agent-retros');

  const overrideMatches = rgMatches('AGENT_RETRO_DIR', ['skills', 'docs', 'scripts']);
  assert(overrideMatches.length > 0, 'expected AGENT_RETRO_DIR contract to appear in source docs/scripts');
}

function main() {
  runNodeScript('scripts/sync-canonical-adapters.js');
  runNodeScript('scripts/generate-index.js');
  runNodeScript('scripts/generate-index.js', ['--test']);
  runNodeScript('scripts/generate-index.js', ['--check']);
  runNodeScript('scripts/validate-reference-integrity.js');

  const { agents, skills, workflows, rules, hooks } = assertGeneratedFilesExist();
  assert(exists(path.relative(REPO_ROOT, INDEX_PATH)), 'missing generated index.json');
  assertCodexAgentBodiesMatch(agents);
  assertCatalogEntriesExist(agents, skills, workflows, rules, hooks);
  assertCodexHookInstallContract(hooks);
  assertInstallCommandContracts(hooks);
  assertRetroStorageContract();

  process.stdout.write(
    `Smoke test passed: ${agents.length} canonical agents, ${workflows.length} canonical workflows, ${rules.length} canonical rules, ${hooks.length} canonical hooks, and index.json are all generated.\n`
  );
}

main();
