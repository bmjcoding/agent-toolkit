#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeIfChanged(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8') === content) {
    return false;
  }
  fs.writeFileSync(filePath, content);
  return true;
}

function splitFrontmatter(markdown) {
  if (!markdown.startsWith('---\n')) {
    return { frontmatter: '', body: markdown.trimStart() };
  }

  const end = markdown.indexOf('\n---\n', 4);
  if (end === -1) {
    return { frontmatter: '', body: markdown.trimStart() };
  }

  const frontmatter = markdown.slice(0, end + 5).trimEnd();
  const body = markdown.slice(end + 5).trimStart();
  return { frontmatter, body };
}

function stripLeadingHtmlComments(body) {
  let text = body.trimStart();
  while (text.startsWith('<!--')) {
    const end = text.indexOf('-->');
    if (end === -1) break;
    text = text.slice(end + 3).trimStart();
  }
  return text.trim() + '\n';
}

function extractField(regex, text, fallback = '') {
  const match = text.match(regex);
  return match ? match[1] : fallback;
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
    .map(matchLine => normalizeFrontmatterValue(matchLine[1]));
}

function normalizeFrontmatterValue(value) {
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

function readLatestReleasedVersion(changelogPath) {
  if (!fs.existsSync(changelogPath)) return null;
  const changelog = read(changelogPath);
  const match = changelog.match(/^## \[(?!Unreleased\])([^\]]+)\]/m);
  return match ? match[1] : null;
}

function listCanonicalComponentNames(rootDir, markerFile) {
  const absoluteRoot = path.join(REPO_ROOT, rootDir);
  return fs.readdirSync(absoluteRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(name => fs.existsSync(path.join(absoluteRoot, name, markerFile)))
    .sort();
}

function firstAdapterPath(adapters, prefix, fallbackPath) {
  return adapters.find(adapter => adapter.startsWith(prefix)) || fallbackPath;
}

function parseClaudeAgentConfig(frontmatter) {
  const model = normalizeFrontmatterValue(extractField(/^model:\s*(.+)$/m, frontmatter, 'inherit'));
  const toolsRaw = extractField(/^tools:\s*(.+)$/m, frontmatter, '');
  const skills = parseYamlList(frontmatter, 'skills');

  const tools = splitTopLevelCommaList(toolsRaw);
  const agentTool = tools.find(tool => /^Agent\(/.test(tool));
  const childAgents = agentTool
    ? agentTool
        .replace(/^Agent\(/, '')
        .replace(/\)$/, '')
        .split(',')
        .map(value => value.trim())
        .filter(Boolean)
    : [];

  const capabilities = [];
  if (tools.some(tool => tool === 'Read')) capabilities.push('read');
  if (tools.some(tool => tool === 'Write')) capabilities.push('write');
  if (tools.some(tool => tool === 'Edit')) capabilities.push('edit');
  if (tools.some(tool => tool === 'Glob' || tool === 'Grep')) capabilities.push('search');
  if (tools.some(tool => tool === 'Bash')) capabilities.push('execute');
  if (tools.some(tool => tool === 'WebSearch' || tool === 'WebFetch')) capabilities.push('web');
  if (tools.some(tool => tool === 'TodoWrite')) capabilities.push('todo');
  if (childAgents.length > 0) capabilities.push('delegate');

  const copilotTools = [];
  if (capabilities.includes('read')) copilotTools.push('read');
  if (capabilities.includes('write') || capabilities.includes('edit')) copilotTools.push('edit');
  if (capabilities.includes('search')) copilotTools.push('search');
  if (capabilities.includes('execute')) copilotTools.push('execute');
  if (capabilities.includes('web')) copilotTools.push('web');
  if (capabilities.includes('todo')) copilotTools.push('todo');

  const modelTier = model === 'sonnet'
    ? 'balanced'
    : model === 'haiku'
      ? 'fast'
      : 'frontier';

  return {
    model,
    modelTier,
    capabilities,
    skills,
    childAgents,
    copilotTools,
  };
}

function getCopilotModelForTier(modelTier) {
  if (modelTier === 'balanced') return 'Claude Sonnet 4.5 (copilot)';
  if (modelTier === 'fast') return 'Claude Haiku 4.5 (copilot)';
  return 'Claude Opus 4.5 (copilot)';
}

function getCodexModelForTier(modelTier) {
  if (modelTier === 'balanced') return 'gpt-5.3-codex';
  if (modelTier === 'fast') return 'gpt-5.3-codex-spark';
  return 'gpt-5.4';
}

function renderCanonicalMarkdown({ name, description, adapterPaths, body, kind, modelTier, capabilities, subagents, skills, argumentHint }) {
  const adapterLines = adapterPaths.map(adapterPath => `  - ${adapterPath}`).join('\n');
  const metadataLines = [];

  if (kind === 'agent') {
    if (modelTier) metadataLines.push(`model-tier: ${modelTier}`);
    if (capabilities && capabilities.length > 0) {
      metadataLines.push('capabilities:');
      for (const capability of capabilities) metadataLines.push(`  - ${capability}`);
    }
    if (subagents && subagents.length > 0) {
      metadataLines.push('subagents:');
      for (const subagent of subagents) metadataLines.push(`  - ${subagent}`);
    }
    if (skills && skills.length > 0) {
      metadataLines.push('skills:');
      for (const skill of skills) metadataLines.push(`  - ${skill}`);
    }
  }

  if (kind === 'workflow' && argumentHint) {
    metadataLines.push(`argument-hint: ${JSON.stringify(argumentHint)}`);
  }

  return [
    '---',
    `name: ${name}`,
    `description: ${JSON.stringify(description)}`,
    ...metadataLines,
    'adapters:',
    adapterLines,
    '---',
    '',
    `<!-- Canonical shared ${kind} body. Tool-native wrappers live in the listed adapter files. -->`,
    '',
    body.trim(),
    '',
  ].join('\n');
}

function renderCopilotMarkdown({ name, description, body, modelTier, capabilities, childAgents }) {
  const tools = [];
  if (capabilities.includes('read')) tools.push('read');
  if (capabilities.includes('write') || capabilities.includes('edit')) tools.push('edit');
  if (capabilities.includes('search')) tools.push('search');
  if (capabilities.includes('execute')) tools.push('execute');
  if (capabilities.includes('web')) tools.push('web');
  if (capabilities.includes('todo')) tools.push('todo');

  const renderedTools = [...tools];
  if (childAgents.length > 0 && !renderedTools.includes('agent')) {
    renderedTools.push('agent');
  }

  const lines = [
    '---',
    `name: ${name}`,
    `description: ${JSON.stringify(description)}`,
    `model: ${JSON.stringify(getCopilotModelForTier(modelTier))}`,
  ];

  if (renderedTools.length > 0) {
    lines.push('tools:');
    for (const tool of renderedTools) lines.push(`  - ${tool}`);
  }

  if (childAgents.length > 0) {
    lines.push('agents:');
    for (const childAgent of childAgents) lines.push(`  - ${childAgent}`);
  }

  lines.push('user-invocable: true');
  lines.push('target: vscode');
  lines.push('---');
  lines.push('');
  lines.push(body.trim());
  lines.push('');

  return lines.join('\n');
}

function renderCodexToml({ name, description, body, sourcePath, modelTier }) {
  const escapedBody = body.trim()
    .replace(/\\/g, '\\\\')
    .replace(/"""/g, '\\"""');

  return [
    `# Generated from ${sourcePath}`,
    '',
    `name        = ${JSON.stringify(name)}`,
    `description = ${JSON.stringify(description)}`,
    `model       = ${JSON.stringify(getCodexModelForTier(modelTier))}`,
    '',
    'developer_instructions = """',
    escapedBody,
    '"""',
    '',
  ].join('\n');
}

function renderCopilotPromptMarkdown({ name, description, body, argumentHint }) {
  const lines = [
    '---',
    `name: ${name}`,
    `description: ${JSON.stringify(description)}`,
    "agent: 'agent'",
    'tools:',
    '  - read',
    '  - edit',
    '  - search',
    '  - execute',
  ];

  if (argumentHint) {
    lines.push(`argument-hint: ${JSON.stringify(argumentHint)}`);
  }

  lines.push('---');
  lines.push('');
  lines.push(body.trim());
  lines.push('');

  return lines.join('\n');
}

function renderCopilotInstructionMarkdown({ description, applyTo, body }) {
  const lines = [
    '---',
    `description: ${JSON.stringify(description)}`,
    `applyTo: ${JSON.stringify(applyTo)}`,
    '---',
    '',
    body.trim(),
    '',
  ];

  return lines.join('\n');
}

function deriveRuleDescription(body) {
  const firstLine = body
    .split('\n')
    .map(line => line.trim())
    .find(Boolean);

  if (!firstLine) {
    return 'Shared rule adapter generated from the canonical root rule.';
  }

  const normalized = firstLine
    .replace(/^[-*]\s+/, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  if (normalized.length <= 140) {
    return normalized;
  }

  return `${normalized.slice(0, 137).trimEnd()}...`;
}

function extractCanonicalMetadata(markdown) {
  const parts = splitFrontmatter(markdown);
  const body = parts.body.replace(
    /^<!-- Canonical shared (agent|workflow) body\. Tool-native wrappers live in the listed adapter files\. -->\n\n?/,
    ''
  );
  return {
    frontmatter: parts.frontmatter,
    body: body.trim() + '\n',
    name: normalizeFrontmatterValue(extractField(/^name:\s*(.+)$/m, parts.frontmatter, '')),
    description: normalizeFrontmatterValue(extractField(/^description:\s*(.+)$/m, parts.frontmatter, '')),
    modelTier: normalizeFrontmatterValue(extractField(/^model-tier:\s*(.+)$/m, parts.frontmatter, '')),
    capabilities: parseYamlList(parts.frontmatter, 'capabilities'),
    subagents: parseYamlList(parts.frontmatter, 'subagents'),
    skills: parseYamlList(parts.frontmatter, 'skills'),
    adapters: parseYamlList(parts.frontmatter, 'adapters'),
    argumentHint: normalizeFrontmatterValue(extractField(/^argument-hint:\s*(.+)$/m, parts.frontmatter, '')),
  };
}

function syncAgents() {
  const copilotAgentsDir = path.join(REPO_ROOT, 'github-copilot', 'agents');
  const canonicalAgentsDir = path.join(REPO_ROOT, 'agents');

  const names = listCanonicalComponentNames('agents', 'AGENT.md');

  for (const name of names) {
    const canonicalPath = path.join(canonicalAgentsDir, name, 'AGENT.md');
    const canonicalChangelogPath = path.join(canonicalAgentsDir, name, 'CHANGELOG.md');
    const canonical = extractCanonicalMetadata(read(canonicalPath));
    const claudePath = path.join(
      REPO_ROOT,
      firstAdapterPath(canonical.adapters, 'claude-code/', `claude-code/agents/${name}/${name}.md`)
    );
    const copilotPath = path.join(
      REPO_ROOT,
      firstAdapterPath(canonical.adapters, 'github-copilot/', `github-copilot/agents/${name}.agent.md`)
    );
    const codexPath = path.join(
      REPO_ROOT,
      firstAdapterPath(canonical.adapters, 'openai-codex/', `openai-codex/agents/${name}.toml`)
    );
    const claudeChangelogPath = path.join(path.dirname(claudePath), 'CHANGELOG.md');

    if (!fs.existsSync(claudePath)) {
      throw new Error(`missing Claude agent adapter for canonical agent '${name}': ${path.relative(REPO_ROOT, claudePath)}`);
    }

    const claudeParts = splitFrontmatter(read(claudePath));
    const claudeConfig = parseClaudeAgentConfig(claudeParts.frontmatter);
    const canonicalBody = canonical.body;
    const description = canonical.description;
    const modelTier = canonical.modelTier || claudeConfig.modelTier;
    const capabilities = canonical.capabilities.length > 0
      ? canonical.capabilities
      : claudeConfig.capabilities;
    const subagents = canonical.subagents.length > 0
      ? canonical.subagents
      : claudeConfig.childAgents;
    const skills = canonical.skills.length > 0
      ? canonical.skills
      : claudeConfig.skills;

    writeIfChanged(
      canonicalPath,
      renderCanonicalMarkdown({
        kind: 'agent',
        name,
        description,
        modelTier,
        capabilities,
        subagents,
        skills,
        adapterPaths: [
          `claude-code/agents/${name}/${name}.md`,
          `github-copilot/agents/${name}.agent.md`,
          `openai-codex/agents/${name}.toml`,
        ],
        body: canonicalBody,
      })
    );

    if (!fs.existsSync(canonicalChangelogPath) && fs.existsSync(claudeChangelogPath)) {
      writeIfChanged(canonicalChangelogPath, read(claudeChangelogPath));
    }

    writeIfChanged(claudePath, `${claudeParts.frontmatter}\n\n${canonicalBody}`);
    writeIfChanged(
      copilotPath,
      renderCopilotMarkdown({
        name,
        description,
        body: canonicalBody,
        modelTier,
        capabilities,
        childAgents: subagents,
      })
    );
    writeIfChanged(
      codexPath,
      renderCodexToml({
        name,
        description,
        body: canonicalBody,
        sourcePath: `agents/${name}/AGENT.md`,
        modelTier,
      })
    );

    const manifestDir = path.join(copilotAgentsDir, name);
    const manifestPath = path.join(manifestDir, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(read(manifestPath));
      manifest.download_url = `https://raw.githubusercontent.com/bmjcoding/agent-toolkit/main/github-copilot/agents/${name}.agent.md`;
      manifest.install_path = '.github/agents/';
      manifest.install_command = `mkdir -p .github/agents && curl -fsSL https://raw.githubusercontent.com/bmjcoding/agent-toolkit/main/github-copilot/agents/${name}.agent.md -o .github/agents/${name}.agent.md`;
      manifest.notes = 'Workspace-scoped VS Code Copilot agent adapter.';
      writeIfChanged(`${manifestPath}`, JSON.stringify(manifest, null, 2) + '\n');
    }
  }
}

function syncWorkflows() {
  const canonicalWorkflowsDir = path.join(REPO_ROOT, 'workflows');

  const names = listCanonicalComponentNames('workflows', 'WORKFLOW.md');

  for (const name of names) {
    const canonicalPath = path.join(canonicalWorkflowsDir, name, 'WORKFLOW.md');
    const canonicalChangelogPath = path.join(canonicalWorkflowsDir, name, 'CHANGELOG.md');
    const canonical = extractCanonicalMetadata(read(canonicalPath));
    const claudePath = path.join(
      REPO_ROOT,
      firstAdapterPath(canonical.adapters, 'claude-code/', `claude-code/commands/${name}/${name}.md`)
    );
    const copilotPath = path.join(
      REPO_ROOT,
      firstAdapterPath(canonical.adapters, 'github-copilot/', `github-copilot/prompts/${name}.prompt.md`)
    );
    const claudeChangelogPath = path.join(path.dirname(claudePath), 'CHANGELOG.md');

    if (!fs.existsSync(claudePath)) {
      throw new Error(`missing Claude workflow adapter for canonical workflow '${name}': ${path.relative(REPO_ROOT, claudePath)}`);
    }

    const claudeParts = splitFrontmatter(read(claudePath));
    const argumentHint = canonical.argumentHint || normalizeFrontmatterValue(
      extractField(/^argument-hint:\s*(.+)$/m, claudeParts.frontmatter, '')
    );
    const canonicalBody = canonical.body;
    const description = canonical.description;

    writeIfChanged(
      canonicalPath,
      renderCanonicalMarkdown({
        kind: 'workflow',
        name,
        description,
        argumentHint,
        adapterPaths: [
          `claude-code/commands/${name}/${name}.md`,
          `github-copilot/prompts/${name}.prompt.md`,
        ],
        body: canonicalBody,
      })
    );

    if (!fs.existsSync(canonicalChangelogPath) && fs.existsSync(claudeChangelogPath)) {
      writeIfChanged(canonicalChangelogPath, read(claudeChangelogPath));
    }

    writeIfChanged(claudePath, `${claudeParts.frontmatter}\n\n${canonicalBody}`);
    writeIfChanged(
      copilotPath,
      renderCopilotPromptMarkdown({
        name,
        description,
        body: canonicalBody,
        argumentHint,
      })
    );

  }
}

function syncRules() {
  const canonicalRulesDir = path.join(REPO_ROOT, 'rules');
  const claudeRulesDir = path.join(REPO_ROOT, 'claude-code', 'rules');
  const copilotInstructionsDir = path.join(REPO_ROOT, 'github-copilot', 'instructions');

  const names = fs.readdirSync(canonicalRulesDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(name => fs.existsSync(path.join(canonicalRulesDir, name, `${name}.md`)))
    .sort();

  for (const name of names) {
    const canonicalPath = path.join(canonicalRulesDir, name, `${name}.md`);
    const claudePath = path.join(claudeRulesDir, name, `${name}.md`);
    const copilotPath = path.join(copilotInstructionsDir, `${name}.instructions.md`);

    const canonicalMarkdown = read(canonicalPath);
    const parts = splitFrontmatter(canonicalMarkdown);
    const body = stripLeadingHtmlComments(parts.body);

    const explicitDescription = normalizeFrontmatterValue(
      extractField(/^description:\s*(.+)$/m, parts.frontmatter, '')
    );
    const description = explicitDescription || deriveRuleDescription(body);

    const explicitApplyTo = normalizeFrontmatterValue(
      extractField(/^applyTo:\s*(.+)$/m, parts.frontmatter, '')
    );

    let paths = parseYamlList(parts.frontmatter, 'paths');
    const pathsRaw = extractField(/^paths:\s*(.+)$/m, parts.frontmatter, '');
    if (paths.length === 0 && pathsRaw) {
      try {
        const parsed = JSON.parse(pathsRaw);
        if (Array.isArray(parsed)) paths = parsed;
      } catch {
        paths = [];
      }
    }

    const applyTo = explicitApplyTo || (paths.length > 0 ? paths.join(',') : '**/*');

    writeIfChanged(
      claudePath,
      canonicalMarkdown.endsWith('\n') ? canonicalMarkdown : `${canonicalMarkdown}\n`
    );
    writeIfChanged(
      copilotPath,
      renderCopilotInstructionMarkdown({
        description,
        applyTo,
        body,
      })
    );
  }
}

function main() {
  syncAgents();
  syncWorkflows();
  syncRules();
}

main();
