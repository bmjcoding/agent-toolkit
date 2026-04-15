#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(REPO_ROOT, 'index.json');
const RUNTIME_METADATA_FILE = path.join(REPO_ROOT, 'tools', 'catalog-metadata.json');
const RAW_BASE_URL = 'https://raw.githubusercontent.com/bmjcoding/agent-toolkit/main/';
const VALID_LIFECYCLES = new Set(['stable', 'beta', 'experimental']);
const VALID_AVAILABILITIES = new Set(['supported', 'unverified', 'unavailable']);

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

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
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
  return crypto.createHash('sha256').update(buffer).digest('hex');
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

function normalizeAvailability(value) {
  if (value === null || value === undefined || value === '') return null;

  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'available') return 'supported';
  if (normalized === 'supported') return 'supported';
  if (normalized === 'unverified') return 'unverified';
  if (normalized === 'unavailable') return 'unavailable';
  return null;
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

function requireAvailability(value, { componentKind, componentId, sourcePath }) {
  const availability = normalizeAvailability(value);
  if (!availability) {
    throw new Error(
      `missing or invalid availability for ${componentKind} ${componentId} in ${describePath(sourcePath)}`
    );
  }
  return availability;
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

function readRuntimeCatalogMetadata() {
  const metadata = readJsonSafe(RUNTIME_METADATA_FILE);
  return metadata && typeof metadata === 'object' ? metadata : { hooks: {} };
}

function readGitHubCopilotCommandManifest(workflowId) {
  const manifestPath = path.join(REPO_ROOT, 'github-copilot', 'commands', workflowId, 'manifest.json');
  const manifest = readJsonSafe(manifestPath);
  if (!manifest) {
    return {
      sourcePath: relativePath(manifestPath),
      availability: 'supported',
    };
  }

  return {
    sourcePath: relativePath(manifestPath),
    availability: requireAvailability(manifest.status || 'supported', {
      componentKind: 'command',
      componentId: workflowId,
      sourcePath: manifestPath,
    }),
  };
}

function readHookRuntimeMetadata(runtimeMetadata, targetTool, hookId) {
  const metadata = runtimeMetadata.hooks?.[targetTool]?.[hookId];
  if (!metadata || typeof metadata !== 'object') {
    throw new Error(`missing hook catalog metadata for ${targetTool} hook ${hookId} in ${relativePath(RUNTIME_METADATA_FILE)}`);
  }

  return {
    lifecycle: requireLifecycle(metadata.lifecycle, {
      componentKind: 'hook',
      componentId: hookId,
      sourcePath: `${relativePath(RUNTIME_METADATA_FILE)} (${targetTool})`,
    }),
    availability: requireAvailability(metadata.availability, {
      componentKind: 'hook',
      componentId: hookId,
      sourcePath: `${relativePath(RUNTIME_METADATA_FILE)} (${targetTool})`,
    }),
    lifecycleNotes: typeof metadata.lifecycle_notes === 'string' && metadata.lifecycle_notes.trim()
      ? metadata.lifecycle_notes.trim()
      : null,
  };
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

  for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const id = entry.name;
    const skillPath = path.join(skillsDir, id, 'SKILL.md');
    const content = readFileSafe(skillPath);
    if (!content) continue;

    const frontmatter = parseFrontmatter(extractFrontmatterBlock(content));
    results.push({
      id,
      description: frontmatter.description || '',
      lifecycle: requireLifecycle(frontmatter.lifecycle, {
        componentKind: 'skill',
        componentId: id,
        sourcePath: skillPath,
      }),
      version: readLatestReleasedVersion(path.join(skillsDir, id, 'CHANGELOG.md')),
      sourcePath: relativePath(skillPath),
      metadata: {},
    });
  }

  return results;
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

function readBundles(tool) {
  const bundlesDir = path.join(REPO_ROOT, tool, 'bundles');
  if (!exists(bundlesDir)) return [];

  const results = [];
  for (const entry of fs.readdirSync(bundlesDir, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const id = entry.name;
    const bundlePath = path.join(bundlesDir, id, 'bundle.yaml');
    if (!exists(bundlePath)) continue;

    const parsed = parseBundleManifest(bundlePath);
    if (!parsed) continue;

    results.push({
      tool,
      id: parsed.id || id,
      lifecycle: requireLifecycle(parsed.status, {
        componentKind: 'bundle',
        componentId: parsed.id || id,
        sourcePath: bundlePath,
      }),
      version: readLatestReleasedVersion(path.join(bundlesDir, id, 'CHANGELOG.md')),
      artifactPath: relativePath(bundlePath),
      metadata: {
        name: parsed.name,
        description: parsed.description,
        tags: parsed.tags,
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
    if (componentKind === 'skill') return `~/.claude/skills/${componentId}/SKILL.md`;
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
    if (componentKind === 'skill') return `.agents/skills/${componentId}/SKILL.md`;
  }

  return null;
}

function buildInstallCommand({ targetTool, componentKind, componentId, artifactPath, installPath, companionArtifacts = [] }) {
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
    const directory = path.posix.dirname(download.path);
    const shellDirectory = directory.startsWith('~/') ? `$HOME/${directory.slice(2)}` : directory;
    const shellPath = download.path.startsWith('~/') ? `$HOME/${download.path.slice(2)}` : download.path;
    if (!createdDirectories.has(directory)) {
      commands.push(`mkdir -p "${shellDirectory}"`);
      createdDirectories.add(directory);
    }
    commands.push(`curl -fsSL "${download.url}" -o "${shellPath}"`);
  }

  if (targetTool === 'github-copilot' && componentKind === 'hook') {
    commands.push(`# register ${componentId} through the paired .json hook definition`);
  }

  return commands.join(' && ');
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
  availability,
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
    availability: requireAvailability(availability, {
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
  const bundles = [
    ...readBundles('claude-code'),
    ...readBundles('github-copilot'),
  ];
  const bundleMembership = buildBundleMembershipMap(bundles);
  const runtimeMetadata = readRuntimeCatalogMetadata();

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
        availability: 'supported',
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
    const copilotCommandManifest = readGitHubCopilotCommandManifest(workflow.id);
    for (const adapterPath of workflow.adapters) {
      const targetTool = adapterPath.split('/')[0];
      if (!exists(path.join(REPO_ROOT, adapterPath))) continue;

      const installPath = installPathForArtifact(targetTool, 'command', workflow.id);
      catalog.artifacts.push(createArtifactRecord({
        componentId: workflow.id,
        componentKind: 'command',
        componentVersion: workflow.version,
        lifecycle: workflow.lifecycle,
        availability: targetTool === 'github-copilot' ? copilotCommandManifest.availability : 'supported',
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
    for (const targetTool of ['claude-code', 'openai-codex']) {
      const installPath = installPathForArtifact(targetTool, 'skill', skill.id);
      catalog.artifacts.push(createArtifactRecord({
        componentId: skill.id,
        componentKind: 'skill',
        componentVersion: skill.version,
        lifecycle: skill.lifecycle,
        availability: 'supported',
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
    const claudeInstallPath = installPathForArtifact('claude-code', 'rule', rule.id);
    catalog.artifacts.push(createArtifactRecord({
      componentId: rule.id,
      componentKind: 'rule',
      componentVersion: rule.version,
      lifecycle: rule.lifecycle,
      availability: 'supported',
      targetTool: 'claude-code',
      artifactPath: rule.sourcePath,
      sourcePath: rule.sourcePath,
      installPath: claudeInstallPath,
      installCommand: buildInstallCommand({
        targetTool: 'claude-code',
        componentKind: 'rule',
        componentId: rule.id,
        artifactPath: rule.sourcePath,
        installPath: claudeInstallPath,
      }),
      bundleMembership: membershipFor(bundleMembership, 'claude-code', 'rule', rule.id),
      metadata: rule.metadata,
    }));

    const instructionPath = `github-copilot/instructions/${rule.id}.instructions.md`;
    if (exists(path.join(REPO_ROOT, instructionPath))) {
      const copilotInstallPath = installPathForArtifact('github-copilot', 'rule', rule.id);
      catalog.artifacts.push(createArtifactRecord({
        componentId: rule.id,
        componentKind: 'rule',
        componentVersion: rule.version,
        lifecycle: rule.lifecycle,
        availability: 'supported',
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
  }

  for (const bundle of bundles) {
    const installPath = installPathForArtifact(bundle.tool, 'bundle', bundle.id);
    catalog.artifacts.push(createArtifactRecord({
      componentId: bundle.id,
      componentKind: 'bundle',
      componentVersion: bundle.version,
      lifecycle: bundle.lifecycle,
      availability: 'supported',
      targetTool: bundle.tool,
      artifactPath: bundle.artifactPath,
      sourcePath: bundle.artifactPath,
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

  const claudeHooksDir = path.join(REPO_ROOT, 'claude-code', 'hooks');
  for (const entry of fs.readdirSync(claudeHooksDir, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const id = entry.name;
    const artifactPath = `claude-code/hooks/${id}/${id}.sh`;
    if (!exists(path.join(REPO_ROOT, artifactPath))) continue;

    const hookMetadata = readHookRuntimeMetadata(runtimeMetadata, 'claude-code', id);
    const installPath = installPathForArtifact('claude-code', 'hook', id);
    catalog.artifacts.push(createArtifactRecord({
      componentId: id,
      componentKind: 'hook',
      componentVersion: readLatestReleasedVersion(path.join(claudeHooksDir, id, 'CHANGELOG.md')),
      lifecycle: hookMetadata.lifecycle,
      availability: hookMetadata.availability,
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
      }),
      bundleMembership: membershipFor(bundleMembership, 'claude-code', 'hook', id),
      metadata: {},
    }));
  }

  const copilotHooksDir = path.join(REPO_ROOT, 'github-copilot', 'hooks');
  for (const fileName of fs.readdirSync(copilotHooksDir).filter(name => name.endsWith('.json')).sort()) {
    const id = fileName.replace(/\.json$/, '');
    const artifactPath = `github-copilot/hooks/${fileName}`;
    const shellPath = `github-copilot/hooks/${id}.sh`;
    if (!exists(path.join(REPO_ROOT, shellPath))) continue;

    const hookMetadata = readHookRuntimeMetadata(runtimeMetadata, 'github-copilot', id);
    const installPath = installPathForArtifact('github-copilot', 'hook', id);
    catalog.artifacts.push(createArtifactRecord({
      componentId: id,
      componentKind: 'hook',
      componentVersion: readLatestReleasedVersion(path.join(copilotHooksDir, 'CHANGELOG.md')),
      lifecycle: hookMetadata.lifecycle,
      availability: hookMetadata.availability,
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
        ],
      }),
      bundleMembership: membershipFor(bundleMembership, 'github-copilot', 'hook', id),
      metadata: {
        companion_artifacts: [shellPath],
      },
    }));
  }

  const codexHooksDir = path.join(REPO_ROOT, 'openai-codex', 'hooks');
  const codexHooksRegistry = 'openai-codex/hooks/hooks.json';
  for (const fileName of fs.readdirSync(codexHooksDir).filter(name => name.endsWith('.sh')).sort()) {
    const id = fileName.replace(/\.sh$/, '');
    const artifactPath = `openai-codex/hooks/${fileName}`;
    if (!exists(path.join(REPO_ROOT, artifactPath))) continue;

    const hookMetadata = readHookRuntimeMetadata(runtimeMetadata, 'openai-codex', id);
    const installPath = `~/.codex/hooks/${fileName}`;
    catalog.artifacts.push(createArtifactRecord({
      componentId: id,
      componentKind: 'hook',
      componentVersion: readLatestReleasedVersion(path.join(codexHooksDir, 'CHANGELOG.md')),
      lifecycle: hookMetadata.lifecycle,
      availability: hookMetadata.availability,
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
        companionArtifacts: [
          {
            url: downloadUrlFor(codexHooksRegistry),
            path: '~/.codex/hooks.json',
          },
        ],
      }),
      bundleMembership: [],
      metadata: {
        companion_artifacts: [codexHooksRegistry],
      },
    }));
  }

  return catalog;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runTests() {
  assert(readLatestReleasedVersion(path.join(REPO_ROOT, 'workflows', 'lint', 'CHANGELOG.md')) === '4.1.0', 'expected latest lint workflow version to parse');

  const plannerFallback = parseClaudeAgentFallback('planner');
  assert(plannerFallback.modelTier === 'frontier', 'expected planner model tier fallback to map from inherit');
  assert(plannerFallback.capabilities.includes('write'), 'expected planner fallback to include write capability');
  assert(!plannerFallback.capabilities.includes('edit'), 'expected planner fallback to exclude edit capability');

  const frankensteinFallback = parseClaudeAgentFallback('frankenstein');
  assert(frankensteinFallback.capabilities.includes('delegate'), 'expected frankenstein fallback to include delegate capability');
  assert(frankensteinFallback.subagents.includes('planner'), 'expected frankenstein fallback to parse subagents');

  const bundle = parseBundleManifest(path.join(REPO_ROOT, 'claude-code', 'bundles', 'frankenstein-orchestration', 'bundle.yaml'));
  assert(bundle && bundle.components.length > 0, 'expected bundle manifest parser to extract components');
  assert(bundle.components.some(component => component.type === 'agent' && component.id === 'frankenstein'), 'expected bundle parser to extract agent component ids');

  const catalog = buildCatalog();
  assert(Array.isArray(catalog.artifacts) && catalog.artifacts.length > 0, 'expected catalog to contain artifacts');
  assert(catalog.artifacts.some(entry => entry.component_id === 'planner' && entry.target_tool === 'openai-codex'), 'expected planner codex artifact in catalog');
  assert(catalog.artifacts.some(entry => entry.component_id === 'logging' && entry.target_tool === 'github-copilot'), 'expected github-copilot logging rule artifact in catalog');
  assert(
    catalog.artifacts.every(entry => VALID_LIFECYCLES.has(entry.lifecycle)),
    'expected every artifact to expose a valid lifecycle'
  );
  assert(
    catalog.artifacts.every(entry => VALID_AVAILABILITIES.has(entry.availability)),
    'expected every artifact to expose a valid availability'
  );

  const plannerCodexArtifact = catalog.artifacts.find(entry => entry.component_id === 'planner' && entry.target_tool === 'openai-codex');
  assert(plannerCodexArtifact && plannerCodexArtifact.lifecycle === 'stable', 'expected planner codex artifact lifecycle to come from canonical root metadata');

  const auditCopilotArtifact = catalog.artifacts.find(entry => entry.component_id === 'audit' && entry.target_tool === 'github-copilot');
  assert(auditCopilotArtifact && auditCopilotArtifact.availability === 'supported', 'expected github-copilot command availability to normalize from manifest status');

  const codexHookArtifact = catalog.artifacts.find(entry => entry.component_id === 'branch-guard' && entry.target_tool === 'openai-codex');
  assert(codexHookArtifact && codexHookArtifact.availability === 'unverified', 'expected codex hook availability to come from runtime metadata');

  const bundleArtifact = catalog.artifacts.find(entry => entry.component_id === 'frontend-development' && entry.component_kind === 'bundle');
  assert(bundleArtifact && bundleArtifact.lifecycle === 'stable', 'expected bundle lifecycle to normalize from bundle status');

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
