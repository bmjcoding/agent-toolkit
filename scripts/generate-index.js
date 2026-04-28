#!/usr/bin/env node
'use strict';

const nodeCrypto = require('crypto');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(REPO_ROOT, 'index.json');
const RAW_BASE_URL = 'https://raw.githubusercontent.com/bmjcoding/agent-toolkit/main/';
const VALID_LIFECYCLES = new Set(['stable', 'beta', 'experimental']);
const HOOK_RUNTIME_HELPERS = [
  'hooks/_adapter_lib.sh',
  'scripts/orchestrator/dispatch-validator.py',
  'scripts/orchestrator/validate-handoff.py',
  'scripts/orchestrator/lint-printf-newlines.sh',
];

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function relativePath(filePath) {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join('/');
}

function downloadUrlFor(relPath) {
  return `${RAW_BASE_URL}${relPath}`;
}

function sha256For(relPath) {
  const absolutePath = path.join(REPO_ROOT, relPath);
  const buffer = fs.readFileSync(absolutePath);
  return nodeCrypto.createHash('sha256').update(buffer).digest('hex');
}

function extractFrontmatterBlock(content) {
  const lines = content.split('\n');
  if (lines.length < 2 || lines[0].trimEnd() !== '---') return null;

  const closingIndex = lines.slice(1).findIndex(line => line.trimEnd() === '---');
  if (closingIndex === -1) return null;

  return lines.slice(1, closingIndex + 1).join('\n');
}

function normalizeQuotedValue(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function normalizeLifecycle(value) {
  if (value === null || value === undefined || value === '') return null;
  const normalized = String(value).trim().toLowerCase();
  return VALID_LIFECYCLES.has(normalized) ? normalized : null;
}

function describePath(filePath) {
  return path.isAbsolute(filePath) ? relativePath(filePath) : filePath;
}

function requireLifecycle(value, { componentKind, componentId, sourcePath }) {
  const lifecycle = normalizeLifecycle(value);
  if (!lifecycle) {
    throw new Error(
      `missing or invalid lifecycle for ${componentKind} ${componentId} in ${describePath(sourcePath)}`
    );
  }
  return lifecycle;
}

function parseFrontmatter(block) {
  if (!block) return {};

  const result = {};
  const lines = block.split('\n');
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trimEnd();
    if (!trimmed || /^\s*#/.test(trimmed)) {
      i += 1;
      continue;
    }

    const keyMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!keyMatch) {
      i += 1;
      continue;
    }

    const key = keyMatch[1];
    const rest = keyMatch[2].trim();
    i += 1;

    if (rest === '>' || rest === '|') {
      const blockLines = [];
      while (i < lines.length && (lines[i].startsWith('  ') || lines[i] === '')) {
        blockLines.push(lines[i].trim());
        i += 1;
      }
      result[key] = blockLines.filter(Boolean).join(' ').trim();
      continue;
    }

    if (rest.startsWith('[')) {
      let accumulated = rest;
      while (!accumulated.includes(']') && i < lines.length) {
        accumulated += ` ${lines[i].trim()}`;
        i += 1;
      }

      try {
        result[key] = JSON.parse(accumulated);
      } catch {
        result[key] = accumulated;
      }
      continue;
    }

    if (rest === '') {
      const listItems = [];
      const nestedObject = {};
      let isList = false;
      let isNested = false;

      while (i < lines.length) {
        const nextLine = lines[i];
        const nextTrimmed = nextLine.trimEnd();

        if (/^\s+-\s/.test(nextLine)) {
          isList = true;
          listItems.push(nextTrimmed.replace(/^\s+-\s*/, '').trim());
          i += 1;
          continue;
        }

        const nestedMatch = nextLine.match(/^(\s+)([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
        if (nestedMatch && nestedMatch[1].length > 0) {
          isNested = true;
          nestedObject[nestedMatch[2]] = normalizeQuotedValue(nestedMatch[3]);
          i += 1;
          continue;
        }

        break;
      }

      if (isList) {
        result[key] = listItems;
      } else if (isNested) {
        result[key] = nestedObject;
      }
      continue;
    }

    result[key] = normalizeQuotedValue(rest);
  }

  return result;
}

function readCanonicalHookMetadata(hookId) {
  const scriptPath = path.join(REPO_ROOT, 'hooks', hookId, `${hookId}.sh`);
  const content = readFileSafe(scriptPath);
  if (!content) {
    throw new Error(`missing canonical hook script for ${hookId}`);
  }

  const lifecycleMatch = content.match(/^#\s*lifecycle:\s*(.+)$/m);
  const lifecycle = lifecycleMatch ? lifecycleMatch[1].trim() : null;

  return {
    lifecycle: requireLifecycle(lifecycle, {
      componentKind: 'hook',
      componentId: hookId,
      sourcePath: scriptPath,
    }),
    lifecycleNotes: null,
  };
}

function readHookRuntimeMetadata(_targetTool, hookId) {
  return readCanonicalHookMetadata(hookId);
}

function splitTopLevelCommaList(value) {
  const parts = [];
  let current = '';
  let depth = 0;

  for (const char of value) {
    if (char === '(') depth += 1;
    if (char === ')' && depth > 0) depth -= 1;

    if (char === ',' && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseYamlList(frontmatter, fieldName) {
  const match = frontmatter.match(new RegExp(`^${fieldName}:\\s*\\n((?:\\s+-\\s+.+\\n?)*)`, 'm'));
  if (!match || !match[1].trim()) return [];

  return match[1]
    .split('\n')
    .map(line => line.match(/^\s+-\s+(.+)$/))
    .filter(Boolean)
    .map(item => normalizeQuotedValue(item[1]));
}

function readLatestReleasedVersion(changelogPath) {
  const changelog = readFileSafe(changelogPath);
  if (!changelog) return null;

  const match = changelog.match(/^## \[(?!Unreleased\])([^\]]+)\]/m);
  return match ? match[1] : null;
}

function parseClaudeAgentFallback(agentId) {
  const claudePath = path.join(REPO_ROOT, 'claude-code', 'agents', `${agentId}.md`);
  const legacyClaudePath = path.join(REPO_ROOT, 'claude-code', 'agents', agentId, `${agentId}.md`);
  const content = readFileSafe(claudePath) || readFileSafe(legacyClaudePath);
  if (!content) {
    return {
      modelTier: null,
      capabilities: [],
      subagents: [],
      skills: [],
      metadataSource: 'missing',
    };
  }

  const frontmatter = extractFrontmatterBlock(content) || '';
  const model = normalizeQuotedValue((frontmatter.match(/^model:\s*(.+)$/m) || [null, 'inherit'])[1]);
  const toolsRaw = (frontmatter.match(/^tools:\s*(.+)$/m) || [null, ''])[1];
  const tools = splitTopLevelCommaList(toolsRaw);
  const subagents = [];
  const capabilities = [];

  if (tools.some(tool => tool === 'Read')) capabilities.push('read');
  if (tools.some(tool => tool === 'Write')) capabilities.push('write');
  if (tools.some(tool => tool === 'Edit')) capabilities.push('edit');
  if (tools.some(tool => tool === 'Glob' || tool === 'Grep')) capabilities.push('search');
  if (tools.some(tool => tool === 'Bash')) capabilities.push('execute');
  if (tools.some(tool => tool === 'WebSearch' || tool === 'WebFetch')) capabilities.push('web');
  if (tools.some(tool => tool === 'TodoWrite')) capabilities.push('todo');

  const agentTool = tools.find(tool => /^Agent\(/.test(tool));
  if (agentTool) {
    capabilities.push('delegate');
    subagents.push(
      ...agentTool
        .replace(/^Agent\(/, '')
        .replace(/\)$/, '')
        .split(',')
        .map(name => name.trim())
        .filter(Boolean)
    );
  }

  const modelTier = model === 'sonnet'
    ? 'balanced'
    : model === 'haiku'
      ? 'fast'
      : 'frontier';

  return {
    modelTier,
    capabilities,
    subagents,
    skills: parseYamlList(frontmatter, 'skills'),
    metadataSource: 'claude-adapter-fallback',
  };
}

function readCanonicalAgents() {
  const agentsDir = path.join(REPO_ROOT, 'agents');
  const results = [];

  for (const entry of fs.readdirSync(agentsDir, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const id = entry.name;
    const sourcePath = path.join(agentsDir, id, 'AGENT.md');
    const content = readFileSafe(sourcePath);
    if (!content) continue;

    const frontmatter = parseFrontmatter(extractFrontmatterBlock(content));
    const fallback = parseClaudeAgentFallback(id);
    const modelTier = frontmatter['model-tier'] || fallback.modelTier;
    const capabilities = Array.isArray(frontmatter.capabilities) && frontmatter.capabilities.length > 0
      ? frontmatter.capabilities
      : fallback.capabilities;
    const subagents = Array.isArray(frontmatter.subagents) && frontmatter.subagents.length > 0
      ? frontmatter.subagents
      : fallback.subagents;
    const skills = Array.isArray(frontmatter.skills) && frontmatter.skills.length > 0
      ? frontmatter.skills
      : fallback.skills;
    const metadataSource = frontmatter['model-tier'] || (Array.isArray(frontmatter.capabilities) && frontmatter.capabilities.length > 0)
      ? 'canonical'
      : fallback.metadataSource;

    results.push({
      id,
      description: frontmatter.description || '',
      lifecycle: requireLifecycle(frontmatter.lifecycle, {
        componentKind: 'agent',
        componentId: id,
        sourcePath,
      }),
      version: readLatestReleasedVersion(path.join(agentsDir, id, 'CHANGELOG.md')),
      sourcePath: relativePath(sourcePath),
      adapters: Array.isArray(frontmatter.adapters) ? frontmatter.adapters : [],
      metadata: {
        model_tier: modelTier,
        capabilities,
        subagents,
        skills,
        metadata_source: metadataSource,
      },
    });
  }

  return results;
}

function readWorkflowArgumentHint(workflowId) {
  const claudePath = path.join(REPO_ROOT, 'claude-code', 'commands', workflowId, `${workflowId}.md`);
  const copilotPath = path.join(REPO_ROOT, 'github-copilot', 'prompts', `${workflowId}.prompt.md`);
  const candidates = [claudePath, copilotPath];

  for (const candidate of candidates) {
    const content = readFileSafe(candidate);
    if (!content) continue;
    const frontmatter = extractFrontmatterBlock(content) || '';
    const match = frontmatter.match(/^argument-hint:\s*(.+)$/m);
    if (match) return normalizeQuotedValue(match[1]);
  }

  return null;
}

function readCanonicalWorkflows() {
  const workflowsDir = path.join(REPO_ROOT, 'workflows');
  const results = [];

  for (const entry of fs.readdirSync(workflowsDir, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const id = entry.name;
    const sourcePath = path.join(workflowsDir, id, 'WORKFLOW.md');
    const content = readFileSafe(sourcePath);
    if (!content) continue;

    const frontmatter = parseFrontmatter(extractFrontmatterBlock(content));
    const canonicalArgumentHint = frontmatter['argument-hint'] || null;
    const argumentHint = canonicalArgumentHint || readWorkflowArgumentHint(id);

    results.push({
      id,
      description: frontmatter.description || '',
      lifecycle: requireLifecycle(frontmatter.lifecycle, {
        componentKind: 'command',
        componentId: id,
        sourcePath,
      }),
      version: readLatestReleasedVersion(path.join(workflowsDir, id, 'CHANGELOG.md')),
      sourcePath: relativePath(sourcePath),
      adapters: Array.isArray(frontmatter.adapters) ? frontmatter.adapters : [],
      metadata: {
        argument_hint: argumentHint,
        metadata_source: canonicalArgumentHint ? 'canonical' : 'adapter-fallback',
      },
    });
  }

  return results;
}

function readSharedSkills() {
  const skillsDir = path.join(REPO_ROOT, 'skills');
  const results = [];
  const seen = new Set();

  function visit(dirPath) {
    const skillPath = path.join(dirPath, 'SKILL.md');
    if (exists(skillPath)) {
      const content = readFileSafe(skillPath);
      if (!content) return;

      const relPath = relativePath(skillPath);
      const relDir = path.posix.dirname(relPath);
      const pathParts = relDir.split('/').slice(1);
      const category = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : 'uncategorized';
      const fallbackId = pathParts[pathParts.length - 1];
      const frontmatter = parseFrontmatter(extractFrontmatterBlock(content));
      const id = frontmatter.name || fallbackId;

      if (seen.has(id)) {
        throw new Error(`duplicate shared skill id '${id}' while scanning skills/`);
      }
      seen.add(id);

      results.push({
        id,
        description: frontmatter.description || '',
        lifecycle: requireLifecycle(frontmatter.lifecycle, {
          componentKind: 'skill',
          componentId: id,
          sourcePath: skillPath,
        }),
        version: readLatestReleasedVersion(path.join(REPO_ROOT, relDir, 'CHANGELOG.md')),
        sourcePath: relPath,
        metadata: {
          category,
          dependencies: Array.isArray(frontmatter.dependencies)
            ? frontmatter.dependencies
            : [],
        },
      });
      return;
    }

    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith('.')) continue;
      visit(path.join(dirPath, entry.name));
    }
  }

  visit(skillsDir);
  return results.sort((a, b) => a.id.localeCompare(b.id));
}

function readRootRules() {
  const rulesDir = path.join(REPO_ROOT, 'rules');
  const results = [];

  for (const entry of fs.readdirSync(rulesDir, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const id = entry.name;
    const rulePath = path.join(rulesDir, id, `${id}.md`);
    const content = readFileSafe(rulePath);
    if (!content) continue;

    const frontmatter = parseFrontmatter(extractFrontmatterBlock(content));
    results.push({
      id,
      lifecycle: requireLifecycle(frontmatter.lifecycle, {
        componentKind: 'rule',
        componentId: id,
        sourcePath: rulePath,
      }),
      version: readLatestReleasedVersion(path.join(rulesDir, id, 'CHANGELOG.md')),
      sourcePath: relativePath(rulePath),
      metadata: {
        apply_to: frontmatter.applyTo || null,
        paths: Array.isArray(frontmatter.paths) ? frontmatter.paths : [],
      },
    });
  }

  return results;
}

function parseBundleManifest(bundlePath) {
  const content = readFileSafe(bundlePath);
  if (!content) return null;

  const lines = content.split('\n');
  const bundle = {
    id: null,
    name: null,
    description: null,
    status: null,
    tags: [],
    aliases: [],
    components: [],
  };

  let mode = null;
  let currentComponent = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (/^id:\s*/.test(line) && mode === null) {
      bundle.id = normalizeQuotedValue(line.replace(/^id:\s*/, ''));
      continue;
    }
    if (/^name:\s*/.test(line)) {
      bundle.name = normalizeQuotedValue(line.replace(/^name:\s*/, ''));
      continue;
    }
    if (/^description:\s*/.test(line)) {
      bundle.description = normalizeQuotedValue(line.replace(/^description:\s*/, ''));
      continue;
    }
    if (/^status:\s*/.test(line)) {
      bundle.status = normalizeQuotedValue(line.replace(/^status:\s*/, ''));
      continue;
    }
    if (/^tags:\s*$/.test(line)) {
      mode = 'tags';
      currentComponent = null;
      continue;
    }
    if (/^aliases:\s*$/.test(line)) {
      mode = 'aliases';
      currentComponent = null;
      continue;
    }
    if (/^components:\s*$/.test(line)) {
      mode = 'components';
      currentComponent = null;
      continue;
    }

    if (mode === 'tags') {
      const tagMatch = line.match(/^\s*-\s+(.+)$/);
      if (tagMatch) {
        bundle.tags.push(normalizeQuotedValue(tagMatch[1]));
        continue;
      }
      mode = null;
    }

    if (mode === 'aliases') {
      const aliasMatch = line.match(/^\s*-\s+(.+)$/);
      if (aliasMatch) {
        bundle.aliases.push(normalizeQuotedValue(aliasMatch[1]));
        continue;
      }
      mode = null;
    }

    if (mode === 'components') {
      const componentStart = line.match(/^\s*-\s+type:\s*(.+)$/);
      if (componentStart) {
        currentComponent = { type: normalizeQuotedValue(componentStart[1]), id: null, role: null };
        bundle.components.push(currentComponent);
        continue;
      }

      const fieldMatch = line.match(/^\s+(id|role):\s*(.+)$/);
      if (fieldMatch && currentComponent) {
        currentComponent[fieldMatch[1]] = normalizeQuotedValue(fieldMatch[2]);
        continue;
      }
    }
  }

  return bundle;
}

function pickMoreSevereLifecycle(current, next) {
  const weight = { stable: 0, beta: 1, experimental: 2 };
  return weight[next] > weight[current] ? next : current;
}

function buildBundleComponentLifecycleMap({ canonicalAgents, canonicalWorkflows, sharedSkills, sharedRules }) {
  const lifecycleByComponent = new Map();

  for (const agent of canonicalAgents) {
    lifecycleByComponent.set(`agent|${agent.id}`, agent.lifecycle);
  }
  for (const workflow of canonicalWorkflows) {
    lifecycleByComponent.set(`command|${workflow.id}`, workflow.lifecycle);
  }
  for (const skill of sharedSkills) {
    lifecycleByComponent.set(`skill|${skill.id}`, skill.lifecycle);
  }
  for (const rule of sharedRules) {
    lifecycleByComponent.set(`rule|${rule.id}`, rule.lifecycle);
  }

  const canonicalHooksDir = path.join(REPO_ROOT, 'hooks');
  for (const entry of fs.readdirSync(canonicalHooksDir, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const id = entry.name;
    const artifactPath = path.join(REPO_ROOT, 'hooks', id, `${id}.sh`);
    if (!exists(artifactPath)) continue;
    lifecycleByComponent.set(`hook|${id}`, readHookRuntimeMetadata('claude-code', id).lifecycle);
  }

  return lifecycleByComponent;
}

function aggregateBundleLifecycle(components, componentLifecycles, bundlePath, bundleId) {
  let lifecycle = 'stable';

  for (const component of components) {
    if (!component.type || !component.id) continue;

    const componentLifecycle = componentLifecycles.get(`${component.type}|${component.id}`);
    if (!componentLifecycle) {
      throw new Error(`missing lifecycle for bundle member ${component.type}/${component.id} referenced by ${relativePath(bundlePath)} (${bundleId})`);
    }

    lifecycle = pickMoreSevereLifecycle(lifecycle, componentLifecycle);
    if (lifecycle === 'experimental') return lifecycle;
  }

  return lifecycle;
}

function readBundles(componentLifecycles) {
  const bundlesDir = path.join(REPO_ROOT, 'bundles');
  if (!exists(bundlesDir)) return [];

  const results = [];
  for (const entry of fs.readdirSync(bundlesDir, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const id = entry.name;
    const bundlePath = path.join(bundlesDir, id, 'bundle.yaml');
    if (!exists(bundlePath)) continue;

    const parsed = parseBundleManifest(bundlePath);
    if (!parsed) continue;

    results.push({
      tool: 'claude-code',
      id: parsed.id || id,
      lifecycle: aggregateBundleLifecycle(parsed.components, componentLifecycles, bundlePath, parsed.id || id),
      version: readLatestReleasedVersion(path.join(bundlesDir, id, 'CHANGELOG.md')),
      artifactPath: relativePath(bundlePath),
      sourcePath: relativePath(bundlePath),
      metadata: {
        name: parsed.name,
        description: parsed.description,
        tags: parsed.tags,
        aliases: parsed.aliases,
        components: parsed.components,
      },
    });
  }

  return results;
}

function buildBundleMembershipMap(bundles) {
  const membership = new Map();

  for (const bundle of bundles) {
    for (const component of bundle.metadata.components) {
      if (!component.type || !component.id) continue;

      const key = `${bundle.tool}|${component.type}|${component.id}`;
      const existing = membership.get(key) || [];
      existing.push({
        bundle_id: bundle.id,
        role: component.role || 'core',
      });
      membership.set(key, existing);
    }
  }

  return membership;
}

function installPathForArtifact(targetTool, componentKind, componentId) {
  if (targetTool === 'claude-code') {
    if (componentKind === 'agent') return `~/.claude/agents/${componentId}.md`;
    if (componentKind === 'command') return `~/.claude/commands/${componentId}/${componentId}.md`;
    if (componentKind === 'bundle') return `~/.claude/bundles/${componentId}/bundle.yaml`;
    if (componentKind === 'hook') return `~/.claude/hooks/${componentId}/${componentId}.sh`;
    if (componentKind === 'rule') return `~/.claude/rules/${componentId}/${componentId}.md`;
  }

  if (targetTool === 'github-copilot') {
    if (componentKind === 'agent') return `.github/agents/${componentId}.agent.md`;
    if (componentKind === 'command') return `.github/prompts/${componentId}.prompt.md`;
    if (componentKind === 'bundle') return `.github/bundles/${componentId}/bundle.yaml`;
    if (componentKind === 'hook') return `.github/hooks/${componentId}.json`;
    if (componentKind === 'rule') return `.github/instructions/${componentId}.instructions.md`;
  }

  if (targetTool === 'openai-codex') {
    if (componentKind === 'agent') return `~/.codex/agents/${componentId}.toml`;
  }

  return null;
}

function installPathForSkill(targetTool, skill) {
  const skillTreePath = skill.sourcePath;
  if (targetTool === 'claude-code') return `~/.claude/${skillTreePath}`;
  if (targetTool === 'github-copilot') return skillTreePath;
  if (targetTool === 'openai-codex') return skillTreePath.replace(/^skills\//, '.agents/skills/');
  return null;
}

function shellPathForInstall(downloadPath) {
  return downloadPath.startsWith('~/') ? `$HOME/${downloadPath.slice(2)}` : downloadPath;
}

function buildDownloadCommands(download, createdDirectories) {
  const directory = path.posix.dirname(download.path);
  const shellDirectory = shellPathForInstall(directory);
  const shellPath = shellPathForInstall(download.path);
  const commands = [];

  if (!createdDirectories.has(directory)) {
    commands.push(`mkdir -p "${shellDirectory}"`);
    createdDirectories.add(directory);
  }

  commands.push(`curl -fsSL "${download.url}" -o "${shellPath}"`);

  if (download.path.endsWith('.sh')) {
    commands.push(`chmod +x "${shellPath}"`);
  }

  return commands;
}

function buildInstallCommand({ artifactPath, installPath, companionArtifacts = [] }) {
  if (!installPath) return null;

  const downloads = [
    {
      url: downloadUrlFor(artifactPath),
      path: installPath,
    },
    ...companionArtifacts,
  ];

  const createdDirectories = new Set();
  const commands = [];
  for (const download of downloads) {
    commands.push(...buildDownloadCommands(download, createdDirectories));
  }

  return commands.join(' && ');
}

function companionDownloads(paths, installRoot) {
  return paths.map(relPath => ({
    url: downloadUrlFor(relPath),
    path: `${installRoot}/${relPath}`,
  }));
}

function membershipFor(bundleMembership, targetTool, componentKind, componentId) {
  return bundleMembership.get(`${targetTool}|${componentKind}|${componentId}`) || [];
}

function createArtifactRecord({
  componentId,
  componentKind,
  componentVersion,
  targetTool,
  artifactPath,
  sourcePath,
  installPath,
  installCommand,
  bundleMembership,
  metadata,
  lifecycle,
  lifecycleNotes = null,
}) {
  const artifact = {
    component_id: componentId,
    component_kind: componentKind,
    component_version: componentVersion,
    lifecycle: requireLifecycle(lifecycle, {
      componentKind,
      componentId,
      sourcePath,
    }),
    target_tool: targetTool,
    artifact_path: artifactPath,
    source_path: sourcePath,
    install_path: installPath,
    install_command: installCommand,
    download_url: downloadUrlFor(artifactPath),
    checksum_sha256: sha256For(artifactPath),
    bundle_membership: bundleMembership,
    metadata,
  };

  if (lifecycleNotes) artifact.lifecycle_notes = lifecycleNotes;
  return artifact;
}

function buildCatalog() {
  const catalog = {
    schema: 'agent-toolkit.distribution-catalog/v1',
    repository: 'bmjcoding/agent-toolkit',
    artifacts: [],
  };

  const canonicalAgents = readCanonicalAgents();
  const canonicalWorkflows = readCanonicalWorkflows();
  const sharedSkills = readSharedSkills();
  const sharedRules = readRootRules();
  const bundleComponentLifecycles = buildBundleComponentLifecycleMap({
    canonicalAgents,
    canonicalWorkflows,
    sharedSkills,
    sharedRules,
  });
  const bundles = readBundles(bundleComponentLifecycles);
  const bundleMembership = buildBundleMembershipMap(bundles);

  for (const agent of canonicalAgents) {
    for (const adapterPath of agent.adapters) {
      const targetTool = adapterPath.split('/')[0];
      if (!exists(path.join(REPO_ROOT, adapterPath))) continue;

      const installPath = installPathForArtifact(targetTool, 'agent', agent.id);
      catalog.artifacts.push(createArtifactRecord({
        componentId: agent.id,
        componentKind: 'agent',
        componentVersion: agent.version,
        lifecycle: agent.lifecycle,
        targetTool,
        artifactPath: adapterPath,
        sourcePath: agent.sourcePath,
        installPath,
        installCommand: buildInstallCommand({
          targetTool,
          componentKind: 'agent',
          componentId: agent.id,
          artifactPath: adapterPath,
          installPath,
        }),
        bundleMembership: membershipFor(bundleMembership, targetTool, 'agent', agent.id),
        metadata: agent.metadata,
      }));
    }
  }

  for (const workflow of canonicalWorkflows) {
    for (const adapterPath of workflow.adapters) {
      const targetTool = adapterPath.split('/')[0];
      if (!exists(path.join(REPO_ROOT, adapterPath))) continue;

      const installPath = installPathForArtifact(targetTool, 'command', workflow.id);
      catalog.artifacts.push(createArtifactRecord({
        componentId: workflow.id,
        componentKind: 'command',
        componentVersion: workflow.version,
        lifecycle: workflow.lifecycle,
        targetTool,
        artifactPath: adapterPath,
        sourcePath: workflow.sourcePath,
        installPath,
        installCommand: buildInstallCommand({
          targetTool,
          componentKind: 'command',
          componentId: workflow.id,
          artifactPath: adapterPath,
          installPath,
        }),
        bundleMembership: membershipFor(bundleMembership, targetTool, 'command', workflow.id),
        metadata: workflow.metadata,
      }));
    }
  }

  for (const skill of sharedSkills) {
    for (const targetTool of ['claude-code', 'github-copilot', 'openai-codex']) {
      const installPath = installPathForSkill(targetTool, skill);
      catalog.artifacts.push(createArtifactRecord({
        componentId: skill.id,
        componentKind: 'skill',
        componentVersion: skill.version,
        lifecycle: skill.lifecycle,
        targetTool,
        artifactPath: skill.sourcePath,
        sourcePath: skill.sourcePath,
        installPath,
        installCommand: buildInstallCommand({
          targetTool,
          componentKind: 'skill',
          componentId: skill.id,
          artifactPath: skill.sourcePath,
          installPath,
        }),
        bundleMembership: membershipFor(bundleMembership, targetTool, 'skill', skill.id),
        metadata: skill.metadata,
      }));
    }
  }

  for (const rule of sharedRules) {
    const claudeRulePath = `claude-code/rules/${rule.id}/${rule.id}.md`;
    if (!exists(path.join(REPO_ROOT, claudeRulePath))) {
      throw new Error(`missing generated Claude rule adapter '${claudeRulePath}' for ${rule.sourcePath}; run node scripts/sync-canonical-adapters.js`);
    }
    const claudeInstallPath = installPathForArtifact('claude-code', 'rule', rule.id);
    catalog.artifacts.push(createArtifactRecord({
      componentId: rule.id,
      componentKind: 'rule',
      componentVersion: rule.version,
      lifecycle: rule.lifecycle,
      targetTool: 'claude-code',
      artifactPath: claudeRulePath,
      sourcePath: rule.sourcePath,
      installPath: claudeInstallPath,
      installCommand: buildInstallCommand({
        targetTool: 'claude-code',
        componentKind: 'rule',
        componentId: rule.id,
        artifactPath: claudeRulePath,
        installPath: claudeInstallPath,
      }),
      bundleMembership: membershipFor(bundleMembership, 'claude-code', 'rule', rule.id),
      metadata: rule.metadata,
    }));

    const instructionPath = `github-copilot/instructions/${rule.id}.instructions.md`;
    if (!exists(path.join(REPO_ROOT, instructionPath))) {
      throw new Error(`missing generated GitHub Copilot rule adapter '${instructionPath}' for ${rule.sourcePath}; run node scripts/sync-canonical-adapters.js`);
    }
    const copilotInstallPath = installPathForArtifact('github-copilot', 'rule', rule.id);
    catalog.artifacts.push(createArtifactRecord({
      componentId: rule.id,
      componentKind: 'rule',
      componentVersion: rule.version,
      lifecycle: rule.lifecycle,
      targetTool: 'github-copilot',
      artifactPath: instructionPath,
      sourcePath: rule.sourcePath,
      installPath: copilotInstallPath,
      installCommand: buildInstallCommand({
        targetTool: 'github-copilot',
        componentKind: 'rule',
        componentId: rule.id,
        artifactPath: instructionPath,
        installPath: copilotInstallPath,
      }),
      bundleMembership: membershipFor(bundleMembership, 'github-copilot', 'rule', rule.id),
      metadata: rule.metadata,
    }));
  }

  for (const bundle of bundles) {
    const installPath = installPathForArtifact(bundle.tool, 'bundle', bundle.id);
    catalog.artifacts.push(createArtifactRecord({
      componentId: bundle.id,
      componentKind: 'bundle',
      componentVersion: bundle.version,
      lifecycle: bundle.lifecycle,
      targetTool: bundle.tool,
      artifactPath: bundle.artifactPath,
      sourcePath: bundle.sourcePath,
      installPath,
      installCommand: buildInstallCommand({
        targetTool: bundle.tool,
        componentKind: 'bundle',
        componentId: bundle.id,
        artifactPath: bundle.artifactPath,
        installPath,
      }),
      bundleMembership: [],
      metadata: bundle.metadata,
    }));
  }

  const canonicalHooksDir = path.join(REPO_ROOT, 'hooks');
  for (const entry of fs.readdirSync(canonicalHooksDir, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const id = entry.name;
    const artifactPath = `hooks/${id}/${id}.sh`;
    if (!exists(path.join(REPO_ROOT, artifactPath))) continue;

    const hookMetadata = readHookRuntimeMetadata('claude-code', id);
    const installPath = installPathForArtifact('claude-code', 'hook', id);
    catalog.artifacts.push(createArtifactRecord({
      componentId: id,
      componentKind: 'hook',
      componentVersion: readLatestReleasedVersion(path.join(canonicalHooksDir, id, 'CHANGELOG.md')),
      lifecycle: hookMetadata.lifecycle,
      lifecycleNotes: hookMetadata.lifecycleNotes,
      targetTool: 'claude-code',
      artifactPath,
      sourcePath: artifactPath,
      installPath,
      installCommand: buildInstallCommand({
        targetTool: 'claude-code',
        componentKind: 'hook',
        componentId: id,
        artifactPath,
        installPath,
        companionArtifacts: companionDownloads(HOOK_RUNTIME_HELPERS, '$HOME/.claude'),
      }),
      bundleMembership: membershipFor(bundleMembership, 'claude-code', 'hook', id),
      metadata: {
        companion_artifacts: HOOK_RUNTIME_HELPERS,
      },
    }));
  }

  const copilotHooksDir = path.join(REPO_ROOT, 'github-copilot', 'hooks');
  for (const entry of fs.readdirSync(copilotHooksDir, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const id = entry.name;
    const artifactPath = `github-copilot/hooks/${id}/${id}.json`;
    const shellPath = `github-copilot/hooks/${id}/${id}.sh`;
    if (!exists(path.join(REPO_ROOT, shellPath))) continue;

    const hookMetadata = readHookRuntimeMetadata('github-copilot', id);
    const installPath = installPathForArtifact('github-copilot', 'hook', id);
    catalog.artifacts.push(createArtifactRecord({
      componentId: id,
      componentKind: 'hook',
      componentVersion: readLatestReleasedVersion(path.join(canonicalHooksDir, id, 'CHANGELOG.md')),
      lifecycle: hookMetadata.lifecycle,
      lifecycleNotes: hookMetadata.lifecycleNotes,
      targetTool: 'github-copilot',
      artifactPath,
      sourcePath: artifactPath,
      installPath,
      installCommand: buildInstallCommand({
        targetTool: 'github-copilot',
        componentKind: 'hook',
        componentId: id,
        artifactPath,
        installPath,
        companionArtifacts: [
          {
            url: downloadUrlFor(shellPath),
            path: `.github/hooks/${id}.sh`,
          },
          ...companionDownloads(HOOK_RUNTIME_HELPERS, '.'),
          {
            url: downloadUrlFor(`hooks/${id}/${id}.sh`),
            path: `hooks/${id}/${id}.sh`,
          },
        ],
      }),
      bundleMembership: membershipFor(bundleMembership, 'github-copilot', 'hook', id),
      metadata: {
        companion_artifacts: [shellPath, ...HOOK_RUNTIME_HELPERS, `hooks/${id}/${id}.sh`],
      },
    }));
  }

  const codexHooksDir = path.join(REPO_ROOT, 'openai-codex', 'hooks');
  const codexHooksRegistry = 'openai-codex/hooks/hooks.json';
  for (const entry of fs.readdirSync(codexHooksDir, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const id = entry.name;
    const artifactPath = `openai-codex/hooks/${id}/${id}.sh`;
    if (!exists(path.join(REPO_ROOT, artifactPath))) continue;

    const hookMetadata = readHookRuntimeMetadata('openai-codex', id);
    const installPath = `~/.codex/openai-codex/hooks/${id}/${id}.sh`;
    const companionArtifacts = [
      {
        url: downloadUrlFor(codexHooksRegistry),
        path: '~/.codex/hooks.json',
      },
      ...companionDownloads(HOOK_RUNTIME_HELPERS, '~/.codex'),
      {
        url: downloadUrlFor(`hooks/${id}/${id}.sh`),
        path: `~/.codex/hooks/${id}/${id}.sh`,
      },
    ];
    if (id === 'integrity-warn') {
      companionArtifacts.push({
        url: downloadUrlFor('openai-codex/scripts/integrity-check.sh'),
        path: '~/.codex/openai-codex/scripts/integrity-check.sh',
      });
    }
    catalog.artifacts.push(createArtifactRecord({
      componentId: id,
      componentKind: 'hook',
      componentVersion: readLatestReleasedVersion(path.join(canonicalHooksDir, id, 'CHANGELOG.md')),
      lifecycle: hookMetadata.lifecycle,
      lifecycleNotes: hookMetadata.lifecycleNotes,
      targetTool: 'openai-codex',
      artifactPath,
      sourcePath: artifactPath,
      installPath,
      installCommand: buildInstallCommand({
        targetTool: 'openai-codex',
        componentKind: 'hook',
        componentId: id,
        artifactPath,
        installPath,
        companionArtifacts,
      }),
      bundleMembership: [],
      metadata: {
        companion_artifacts: companionArtifacts.map(artifact => artifact.url.replace(RAW_BASE_URL, '')),
      },
    }));
  }

  return catalog;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function countOccurrences(value, fragment) {
  if (!fragment) return 0;

  let count = 0;
  let offset = 0;
  while (offset < value.length) {
    const index = value.indexOf(fragment, offset);
    if (index === -1) break;
    count += 1;
    offset = index + fragment.length;
  }

  return count;
}

function findCatalogArtifact(catalog, { targetTool, componentKind, componentId }) {
  return catalog.artifacts.find(entry =>
    entry.target_tool === targetTool &&
    entry.component_kind === componentKind &&
    entry.component_id === componentId
  );
}

function runTests() {
  const lintWorkflowVersion = readLatestReleasedVersion(path.join(REPO_ROOT, 'workflows', 'lint', 'CHANGELOG.md'));
  assert(/^\d+\.\d+\.\d+$/.test(lintWorkflowVersion || ''), 'expected latest lint workflow version to parse as semver');

  const plannerFallback = parseClaudeAgentFallback('planner');
  assert(plannerFallback.modelTier === 'frontier', 'expected planner model tier fallback to map from inherit');
  assert(plannerFallback.capabilities.includes('write'), 'expected planner fallback to include write capability');
  assert(!plannerFallback.capabilities.includes('edit'), 'expected planner fallback to exclude edit capability');

  const frankensteinFallback = parseClaudeAgentFallback('frankenstein');
  assert(frankensteinFallback.capabilities.includes('delegate'), 'expected frankenstein fallback to include delegate capability');
  assert(frankensteinFallback.subagents.includes('planner'), 'expected frankenstein fallback to parse subagents');

  const bundle = parseBundleManifest(path.join(REPO_ROOT, 'bundles', 'ultra-dev', 'bundle.yaml'));
  assert(bundle && bundle.components.length > 0, 'expected bundle manifest parser to extract components');
  assert(bundle.components.some(component => component.type === 'agent' && component.id === 'frankenstein'), 'expected bundle parser to extract agent component ids');
  assert(Array.isArray(bundle.aliases) && bundle.aliases.includes('frankenstein-orchestration'), 'expected bundle parser to extract aliases');

  const catalog = buildCatalog();
  assert(Array.isArray(catalog.artifacts) && catalog.artifacts.length > 0, 'expected catalog to contain artifacts');
  assert(catalog.artifacts.some(entry => entry.component_id === 'planner' && entry.target_tool === 'openai-codex'), 'expected planner codex artifact in catalog');
  assert(catalog.artifacts.some(entry => entry.component_id === 'logging' && entry.target_tool === 'github-copilot'), 'expected github-copilot logging rule artifact in catalog');

  const claudeHookArtifact = findCatalogArtifact(catalog, {
    targetTool: 'claude-code',
    componentKind: 'hook',
    componentId: 'branch-guard',
  });
  assert(claudeHookArtifact, 'expected Claude hook artifact in catalog for branch-guard');
  assert(
    claudeHookArtifact.install_command.includes('curl -fsSL "https://raw.githubusercontent.com/bmjcoding/agent-toolkit/main/hooks/branch-guard/branch-guard.sh" -o "$HOME/.claude/hooks/branch-guard/branch-guard.sh"'),
    'expected Claude hook install command to download the hook shell'
  );
  assert(
    claudeHookArtifact.install_command.includes('chmod +x "$HOME/.claude/hooks/branch-guard/branch-guard.sh"'),
    'expected Claude hook install command to chmod the installed hook shell'
  );
  assert(
    claudeHookArtifact.install_command.includes('curl -fsSL "https://raw.githubusercontent.com/bmjcoding/agent-toolkit/main/hooks/_adapter_lib.sh" -o "$HOME/.claude/hooks/_adapter_lib.sh"'),
    'expected Claude hook install command to download the shared adapter library'
  );

  const copilotHookArtifact = findCatalogArtifact(catalog, {
    targetTool: 'github-copilot',
    componentKind: 'hook',
    componentId: 'branch-guard',
  });
  assert(copilotHookArtifact, 'expected GitHub Copilot hook artifact in catalog for branch-guard');
  assert(
    copilotHookArtifact.install_command.includes('curl -fsSL "https://raw.githubusercontent.com/bmjcoding/agent-toolkit/main/github-copilot/hooks/branch-guard/branch-guard.json" -o ".github/hooks/branch-guard.json"'),
    'expected GitHub Copilot hook install command to download the .json manifest'
  );
  assert(
    copilotHookArtifact.install_command.includes('curl -fsSL "https://raw.githubusercontent.com/bmjcoding/agent-toolkit/main/github-copilot/hooks/branch-guard/branch-guard.sh" -o ".github/hooks/branch-guard.sh"'),
    'expected GitHub Copilot hook install command to download the shell companion'
  );
  assert(
    copilotHookArtifact.install_command.includes('chmod +x ".github/hooks/branch-guard.sh"'),
    'expected GitHub Copilot hook install command to chmod the shell companion'
  );
  assert(
    copilotHookArtifact.install_command.includes('curl -fsSL "https://raw.githubusercontent.com/bmjcoding/agent-toolkit/main/hooks/branch-guard/branch-guard.sh" -o "hooks/branch-guard/branch-guard.sh"'),
    'expected GitHub Copilot hook install command to download the canonical root hook'
  );
  assert(
    !copilotHookArtifact.install_command.includes('chmod +x ".github/hooks/branch-guard.json"'),
    'expected GitHub Copilot hook install command to skip chmod for the .json manifest'
  );
  assert(
    !copilotHookArtifact.install_command.includes('# register'),
    'expected GitHub Copilot hook install command to omit inline comments'
  );

  const codexHookArtifact = findCatalogArtifact(catalog, {
    targetTool: 'openai-codex',
    componentKind: 'hook',
    componentId: 'integrity-warn',
  });
  assert(codexHookArtifact, 'expected OpenAI Codex hook artifact in catalog for integrity-warn');
  assert(
    codexHookArtifact.install_command.includes('curl -fsSL "https://raw.githubusercontent.com/bmjcoding/agent-toolkit/main/openai-codex/hooks/integrity-warn/integrity-warn.sh" -o "$HOME/.codex/openai-codex/hooks/integrity-warn/integrity-warn.sh"'),
    'expected Codex hook install command to download the primary hook shell'
  );
  assert(
    codexHookArtifact.install_command.includes('curl -fsSL "https://raw.githubusercontent.com/bmjcoding/agent-toolkit/main/openai-codex/hooks/hooks.json" -o "$HOME/.codex/hooks.json"'),
    'expected Codex hook install command to download hooks.json'
  );
  assert(
    codexHookArtifact.install_command.includes('curl -fsSL "https://raw.githubusercontent.com/bmjcoding/agent-toolkit/main/hooks/_adapter_lib.sh" -o "$HOME/.codex/hooks/_adapter_lib.sh"'),
    'expected Codex hook install command to download the shared adapter library'
  );
  assert(
    codexHookArtifact.install_command.includes('curl -fsSL "https://raw.githubusercontent.com/bmjcoding/agent-toolkit/main/hooks/integrity-warn/integrity-warn.sh" -o "$HOME/.codex/hooks/integrity-warn/integrity-warn.sh"'),
    'expected Codex hook install command to download the shared canonical hook shell'
  );
  assert(
    codexHookArtifact.install_command.includes('curl -fsSL "https://raw.githubusercontent.com/bmjcoding/agent-toolkit/main/openai-codex/scripts/integrity-check.sh" -o "$HOME/.codex/openai-codex/scripts/integrity-check.sh"'),
    'expected Codex hook install command to download the integrity-check companion'
  );
  assert(
    codexHookArtifact.install_command.includes('chmod +x "$HOME/.codex/openai-codex/hooks/integrity-warn/integrity-warn.sh"'),
    'expected Codex hook install command to chmod the primary hook shell'
  );
  assert(
    codexHookArtifact.install_command.includes('chmod +x "$HOME/.codex/hooks/_adapter_lib.sh"'),
    'expected Codex hook install command to chmod the shared adapter library'
  );
  assert(
    codexHookArtifact.install_command.includes('chmod +x "$HOME/.codex/hooks/integrity-warn/integrity-warn.sh"'),
    'expected Codex hook install command to chmod the shared canonical hook shell'
  );
  assert(
    codexHookArtifact.install_command.includes('chmod +x "$HOME/.codex/openai-codex/scripts/integrity-check.sh"'),
    'expected Codex hook install command to chmod the integrity-check companion'
  );
  assert(
    !codexHookArtifact.install_command.includes('chmod +x "$HOME/.codex/hooks.json"'),
    'expected Codex hook install command to skip chmod for hooks.json'
  );
  assert(
    countOccurrences(codexHookArtifact.install_command, 'chmod +x ') === 5,
    'expected Codex integrity-warn hook install command to chmod every downloaded shell exactly once'
  );

  const nonShellArtifact = findCatalogArtifact(catalog, {
    targetTool: 'github-copilot',
    componentKind: 'rule',
    componentId: 'logging',
  });
  assert(nonShellArtifact, 'expected GitHub Copilot logging rule artifact in catalog');
  assert(
    !nonShellArtifact.install_command.includes('chmod +x '),
    'expected non-shell artifact install command to skip chmod +x'
  );

  assert(
    catalog.artifacts.some(
      entry => entry.component_id === 'lint'
        && entry.component_kind === 'command'
        && entry.component_version === lintWorkflowVersion
    ),
    'expected lint command artifacts to use the latest canonical workflow version'
  );
  assert(
    catalog.artifacts.every(entry => VALID_LIFECYCLES.has(entry.lifecycle)),
    'expected every artifact to expose a valid lifecycle'
  );
  assert(
    catalog.artifacts.some(
      entry => entry.component_id === 'backend'
        && entry.component_kind === 'skill'
        && entry.target_tool === 'github-copilot'
        && entry.artifact_path.endsWith('/backend/SKILL.md')
        && entry.metadata?.category
    ),
    'expected github-copilot skill artifacts to resolve to the categorized canonical skill path'
  );
  assert(
    catalog.artifacts.some(
      entry => entry.component_id === 'frontend'
        && entry.component_kind === 'skill'
        && Array.isArray(entry.metadata?.dependencies)
        && entry.metadata.dependencies.includes('skill/design-authority')
        && entry.metadata.dependencies.includes('skill/design-lint')
    ),
    'expected frontend skill artifacts to expose shared-skill dependencies in metadata'
  );

  const plannerCodexArtifact = catalog.artifacts.find(entry => entry.component_id === 'planner' && entry.target_tool === 'openai-codex');
  assert(plannerCodexArtifact && plannerCodexArtifact.lifecycle === 'stable', 'expected planner codex artifact lifecycle to come from canonical root metadata');

  const bundleArtifact = catalog.artifacts.find(entry => entry.component_id === 'ultra-dev' && entry.component_kind === 'bundle');
  assert(bundleArtifact && bundleArtifact.lifecycle === 'stable', 'expected ultra-dev lifecycle to aggregate from canonical member lifecycle metadata');
  assert(bundleArtifact && Array.isArray(bundleArtifact.metadata?.aliases) && bundleArtifact.metadata.aliases.includes('frankenstein-orchestration'), 'expected ultra-dev bundle artifact to expose legacy alias metadata');

  const betaLifecycle = aggregateBundleLifecycle(
    [{ type: 'skill', id: 'synthetic-beta' }],
    new Map([['skill|synthetic-beta', 'beta']]),
    path.join(REPO_ROOT, 'bundles', 'ultra-dev', 'bundle.yaml'),
    'synthetic-beta-bundle'
  );
  assert(betaLifecycle === 'beta', 'expected aggregateBundleLifecycle to promote to beta when any member is beta');

  const experimentalLifecycle = aggregateBundleLifecycle(
    [{ type: 'skill', id: 'synthetic-experimental' }],
    new Map([['skill|synthetic-experimental', 'experimental']]),
    path.join(REPO_ROOT, 'bundles', 'ultra-dev', 'bundle.yaml'),
    'synthetic-experimental-bundle'
  );
  assert(experimentalLifecycle === 'experimental', 'expected aggregateBundleLifecycle to promote to experimental when any member is experimental');

  process.stdout.write('All tests passed.\n');
}

function main() {
  if (process.argv.includes('--test')) {
    runTests();
    return;
  }

  const catalog = buildCatalog();
  catalog.artifacts.sort((left, right) => {
    const leftKey = `${left.target_tool}|${left.component_kind}|${left.component_id}|${left.artifact_path}`;
    const rightKey = `${right.target_tool}|${right.component_kind}|${right.component_id}|${right.artifact_path}`;
    return leftKey.localeCompare(rightKey);
  });

  const output = `${JSON.stringify(catalog, null, 2)}\n`;
  if (process.argv.includes('--check')) {
    const existing = readFileSafe(OUTPUT_FILE);
    assert(existing !== null, `missing ${relativePath(OUTPUT_FILE)}; run scripts/generate-index.js`);
    assert(existing === output, `${relativePath(OUTPUT_FILE)} is stale; run scripts/generate-index.js`);
    process.stdout.write(`${relativePath(OUTPUT_FILE)} is up to date.\n`);
    return;
  }

  fs.writeFileSync(OUTPUT_FILE, output, 'utf8');
  process.stdout.write(`Generated ${OUTPUT_FILE} — ${catalog.artifacts.length} artifacts\n`);
}

main();
