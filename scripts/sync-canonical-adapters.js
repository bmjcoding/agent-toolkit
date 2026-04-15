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
  return trimmed.replace(/^["']|["']$/g, '');
}

function parseClaudeAgentConfig(frontmatter) {
  const model = normalizeFrontmatterValue(extractField(/^model:\s*(.+)$/m, frontmatter, 'inherit'));
  const toolsRaw = extractField(/^tools:\s*(.+)$/m, frontmatter, '');
  const disallowedRaw = extractField(/^disallowedTools:\s*(.+)$/m, frontmatter, '');
  const skills = parseYamlList(frontmatter, 'skills');

  const tools = splitTopLevelCommaList(toolsRaw);
  const disallowedTools = new Set(splitTopLevelCommaList(disallowedRaw));
  const agentTool = tools.find(tool => /^Agent\(/.test(tool));
  const childAgents = agentTool
    ? agentTool
        .replace(/^Agent\(/, '')
        .replace(/\)$/, '')
        .split(',')
        .map(value => value.trim())
        .filter(Boolean)
    : [];

  const enabledTools = tools.filter(tool => {
    const baseName = tool.replace(/\(.+$/, '');
    return !disallowedTools.has(baseName);
  });

  const copilotTools = [];
  if (enabledTools.some(tool => tool === 'Read')) copilotTools.push('read');
  if (enabledTools.some(tool => tool === 'Write' || tool === 'Edit')) copilotTools.push('edit');
  if (enabledTools.some(tool => tool === 'Glob' || tool === 'Grep')) copilotTools.push('search');
  if (enabledTools.some(tool => tool === 'Bash')) copilotTools.push('execute');
  if (enabledTools.some(tool => tool === 'WebSearch' || tool === 'WebFetch')) copilotTools.push('web');
  if (enabledTools.some(tool => tool === 'TodoWrite')) copilotTools.push('todo');

  const modelTier = model === 'sonnet'
    ? 'balanced'
    : model === 'haiku'
      ? 'fast'
      : 'frontier';

  return {
    model,
    modelTier,
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

function renderCanonicalMarkdown({ name, description, adapterPaths, body, kind }) {
  const adapterLines = adapterPaths.map(adapterPath => `  - ${adapterPath}`).join('\n');
  const fileKey = kind === 'agent' ? 'AGENT.md' : 'WORKFLOW.md';

  return [
    '---',
    `name: ${name}`,
    `description: ${JSON.stringify(description)}`,
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

function renderCopilotMarkdown({ name, description, body, modelTier, tools, childAgents }) {
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
  return [
    `# Generated from ${sourcePath}`,
    '',
    `name        = ${JSON.stringify(name)}`,
    `description = ${JSON.stringify(description)}`,
    `model       = ${JSON.stringify(getCodexModelForTier(modelTier))}`,
    '',
    `developer_instructions = ${JSON.stringify(body.trim())}`,
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
  };
}

function syncAgents() {
  const claudeAgentsDir = path.join(REPO_ROOT, 'claude-code', 'agents');
  const copilotAgentsDir = path.join(REPO_ROOT, 'github-copilot', 'agents');
  const codexAgentsDir = path.join(REPO_ROOT, 'openai-codex', 'agents');
  const canonicalAgentsDir = path.join(REPO_ROOT, 'agents');

  const names = fs.readdirSync(claudeAgentsDir)
    .filter(name => fs.existsSync(path.join(claudeAgentsDir, name, `${name}.md`)))
    .sort();

  for (const name of names) {
    const claudePath = path.join(claudeAgentsDir, name, `${name}.md`);
    const copilotPath = path.join(copilotAgentsDir, `${name}.agent.md`);
    const codexPath = path.join(codexAgentsDir, `${name}.toml`);
    const canonicalPath = path.join(canonicalAgentsDir, name, 'AGENT.md');
    const canonicalChangelogPath = path.join(canonicalAgentsDir, name, 'CHANGELOG.md');
    const claudeChangelogPath = path.join(claudeAgentsDir, name, 'CHANGELOG.md');

    const claudeMarkdown = read(claudePath);
    const copilotMarkdown = read(copilotPath);
    const claudeParts = splitFrontmatter(claudeMarkdown);
    const copilotParts = splitFrontmatter(copilotMarkdown);
    const claudeConfig = parseClaudeAgentConfig(claudeParts.frontmatter);
    const existingCanonical = fs.existsSync(canonicalPath) ? extractCanonicalMetadata(read(canonicalPath)) : null;
    const canonicalBody = existingCanonical
      ? existingCanonical.body
      : stripLeadingHtmlComments(copilotParts.body || claudeParts.body);
    const description = existingCanonical
      ? existingCanonical.description
      : normalizeFrontmatterValue(
          extractField(/^description:\s*(.+)$/m, copilotParts.frontmatter, '') ||
          extractField(/^description:\s*(.+)$/m, claudeParts.frontmatter, '')
        );

    writeIfChanged(
      canonicalPath,
      renderCanonicalMarkdown({
        kind: 'agent',
        name,
        description,
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
        modelTier: claudeConfig.modelTier,
        tools: claudeConfig.copilotTools,
        childAgents: claudeConfig.childAgents,
      })
    );
    writeIfChanged(
      codexPath,
      renderCodexToml({
        name,
        description,
        body: canonicalBody,
        sourcePath: `agents/${name}/AGENT.md`,
        modelTier: claudeConfig.modelTier,
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
  const claudeCommandsDir = path.join(REPO_ROOT, 'claude-code', 'commands');
  const copilotPromptsDir = path.join(REPO_ROOT, 'github-copilot', 'prompts');
  const canonicalWorkflowsDir = path.join(REPO_ROOT, 'workflows');

  const names = fs.readdirSync(claudeCommandsDir)
    .filter(name => fs.existsSync(path.join(claudeCommandsDir, name, `${name}.md`)))
    .sort();

  for (const name of names) {
    const claudePath = path.join(claudeCommandsDir, name, `${name}.md`);
    const copilotPath = path.join(copilotPromptsDir, `${name}.prompt.md`);
    const canonicalPath = path.join(canonicalWorkflowsDir, name, 'WORKFLOW.md');
    const canonicalChangelogPath = path.join(canonicalWorkflowsDir, name, 'CHANGELOG.md');
    const claudeChangelogPath = path.join(claudeCommandsDir, name, 'CHANGELOG.md');

    const claudeMarkdown = read(claudePath);
    const copilotMarkdown = read(copilotPath);
    const claudeParts = splitFrontmatter(claudeMarkdown);
    const copilotParts = splitFrontmatter(copilotMarkdown);
    const existingCanonical = fs.existsSync(canonicalPath) ? extractCanonicalMetadata(read(canonicalPath)) : null;
    const argumentHint = normalizeFrontmatterValue(
      extractField(/^argument-hint:\s*(.+)$/m, claudeParts.frontmatter, '') ||
      extractField(/^argument-hint:\s*(.+)$/m, copilotParts.frontmatter, '')
    );
    const canonicalBody = existingCanonical
      ? existingCanonical.body
      : stripLeadingHtmlComments(copilotParts.body || claudeParts.body);
    const description = existingCanonical
      ? existingCanonical.description
      : normalizeFrontmatterValue(
          extractField(/^description:\s*(.+)$/m, copilotParts.frontmatter, '') ||
          extractField(/^description:\s*(.+)$/m, claudeParts.frontmatter, '')
        );

    writeIfChanged(
      canonicalPath,
      renderCanonicalMarkdown({
        kind: 'workflow',
        name,
        description,
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

function main() {
  syncAgents();
  syncWorkflows();
}

main();
