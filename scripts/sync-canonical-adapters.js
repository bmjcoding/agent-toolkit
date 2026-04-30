#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const HOOK_REGISTRY_PATH = path.join(REPO_ROOT, 'hooks', 'registry.json');

function loadHookRegistry() {
  const registry = JSON.parse(fs.readFileSync(HOOK_REGISTRY_PATH, 'utf8'));
  const hooks = Array.isArray(registry.hooks) ? registry.hooks : [];
  const specs = {};
  const order = [];

  for (const hook of hooks) {
    if (!hook || typeof hook.id !== 'string' || hook.id.length === 0) {
      throw new Error(`Invalid hook registry entry in ${HOOK_REGISTRY_PATH}`);
    }
    if (specs[hook.id]) {
      throw new Error(`Duplicate hook registry entry: ${hook.id}`);
    }
    order.push(hook.id);
    specs[hook.id] = { ...hook };
    delete specs[hook.id].id;
  }

  return { specs, order };
}

const { specs: HOOK_SPECS, order: HOOK_ORDER } = loadHookRegistry();

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function desiredModeForPath(filePath) {
  return filePath.endsWith('.sh') ? 0o755 : null;
}

function ensureDesiredMode(filePath) {
  const desiredMode = desiredModeForPath(filePath);
  if (desiredMode === null || !fs.existsSync(filePath)) {
    return false;
  }

  const currentMode = fs.statSync(filePath).mode & 0o777;
  if (currentMode === desiredMode) {
    return false;
  }

  fs.chmodSync(filePath, desiredMode);
  return true;
}

function writeIfChanged(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8') === content) {
    return ensureDesiredMode(filePath);
  }
  fs.writeFileSync(filePath, content);
  ensureDesiredMode(filePath);
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

function parseYamlStringField(frontmatter, fieldName, fallback = '') {
  const scalar = extractField(new RegExp(`^${fieldName}:\\s*(.+)$`, 'm'), frontmatter, null);
  if (scalar && scalar !== '>' && scalar !== '|') {
    return normalizeFrontmatterValue(scalar);
  }

  const block = frontmatter.match(new RegExp(`^${fieldName}:\\s*[>|]\\s*\\n((?:\\s+.+\\n?)*)`, 'm'));
  if (!block || !block[1].trim()) return fallback;

  return block[1]
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join(' ')
    .trim();
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

function listCanonicalNames(rootDir, markerFile) {
  return fs.readdirSync(path.join(REPO_ROOT, rootDir), { withFileTypes: true })
    .filter(entry => entry.isDirectory() && fs.existsSync(path.join(REPO_ROOT, rootDir, entry.name, markerFile)))
    .map(entry => entry.name)
    .sort();
}

function readLatestReleasedVersion(changelogPath) {
  if (!fs.existsSync(changelogPath)) return null;
  const changelog = read(changelogPath);
  const match = changelog.match(/^## \[(?!Unreleased\])([^\]]+)\]/m);
  return match ? match[1] : null;
}

function escapeMarkdownTableCell(value) {
  return String(value || '').replaceAll('|', '\\|').replace(/\s+/g, ' ').trim();
}

function walkSkillFiles() {
  const skillsDir = path.join(REPO_ROOT, 'skills');
  const results = [];

  function visit(dirPath) {
    const skillPath = path.join(dirPath, 'SKILL.md');
    if (fs.existsSync(skillPath)) {
      results.push(skillPath);
      return;
    }

    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      visit(path.join(dirPath, entry.name));
    }
  }

  visit(skillsDir);
  return results;
}

function listSharedSkillEntries() {
  const entries = [];
  const seen = new Set();

  for (const skillPath of walkSkillFiles()) {
    const relPath = path.relative(REPO_ROOT, skillPath).split(path.sep).join('/');
    const relDir = path.posix.dirname(relPath);
    const parts = relDir.split('/').slice(1);
    const category = parts.length > 1 ? parts.slice(0, -1).join('/') : 'uncategorized';
    const fallbackId = parts[parts.length - 1];
    const content = read(skillPath);
    const frontmatter = splitFrontmatter(content).frontmatter;
    const id = normalizeFrontmatterValue(extractField(/^name:\s*(.+)$/m, frontmatter, fallbackId));
    const description = parseYamlStringField(frontmatter, 'description', '');
    const lifecycle = normalizeFrontmatterValue(extractField(/^lifecycle:\s*(.+)$/m, frontmatter, ''));
    const dependencies = parseYamlList(frontmatter, 'dependencies');

    if (seen.has(id)) {
      throw new Error(`Duplicate skill id '${id}' while scanning skills/`);
    }
    seen.add(id);

    entries.push({
      id,
      category,
      description,
      lifecycle,
      dependencies,
      sourcePath: relPath,
      changelogPath: `${relDir}/CHANGELOG.md`,
      version: readLatestReleasedVersion(path.join(REPO_ROOT, relDir, 'CHANGELOG.md')),
    });
  }

  return entries.sort((a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id));
}

function removePathIfExists(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function parseClaudeAgentConfig(frontmatter) {
  const model = normalizeFrontmatterValue(extractField(/^model:\s*(.+)$/m, frontmatter, 'inherit'));
  const toolsRaw = extractField(/^tools:\s*(.+)$/m, frontmatter, '');
  const skills = parseYamlList(frontmatter, 'skills');
  const disallowedToolsRaw = extractField(/^disallowedTools:\s*(.+)$/m, frontmatter, '');
  const maxTurnsRaw = normalizeFrontmatterValue(extractField(/^maxTurns:\s*(.+)$/m, frontmatter, ''));
  const effort = normalizeFrontmatterValue(extractField(/^effort:\s*(.+)$/m, frontmatter, 'medium'));

  const tools = splitTopLevelCommaList(toolsRaw);
  const disallowedTools = splitTopLevelCommaList(disallowedToolsRaw);
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

  const modelTier = model === 'sonnet'
    ? 'balanced'
    : model === 'haiku'
      ? 'fast'
      : 'frontier';

  return {
    modelTier,
    capabilities,
    skills,
    childAgents,
    disallowedTools,
    maxTurns: Number.parseInt(maxTurnsRaw, 10) || null,
    effort,
  };
}

function getCopilotModelForTier(modelTier) {
  if (modelTier === 'balanced') return 'Claude Sonnet 4.5';
  if (modelTier === 'fast') return 'Claude Haiku 4.5';
  return 'Claude Opus 4.6';
}

function getCodexModelForTier(modelTier) {
  if (modelTier === 'balanced') return 'gpt-5.3-codex';
  if (modelTier === 'fast') return 'gpt-5.3-codex-spark';
  return 'gpt-5.4';
}

function normalizeCodexReasoningEffort(effort) {
  if (effort === 'max') return 'xhigh';
  if (['low', 'medium', 'high', 'xhigh'].includes(effort)) return effort;
  return 'medium';
}

function deriveCodexSandboxMode(capabilities, disallowedTools) {
  const canWrite = capabilities.includes('write') || capabilities.includes('edit');
  const canDelegate = capabilities.includes('delegate');
  if (canWrite || canDelegate) return 'workspace-write';
  if (disallowedTools.includes('Write') || disallowedTools.includes('Edit')) return 'read-only';
  return 'workspace-write';
}

function renderCanonicalMarkdown({ name, description, lifecycle, adapterPaths, body, kind, modelTier, capabilities, subagents, skills }) {
  const adapterLines = adapterPaths.map(adapterPath => `  - ${adapterPath}`).join('\n');
  const metadataLines = [];
  if (lifecycle) metadataLines.push(`lifecycle: ${lifecycle}`);

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

function renderCodexToml({
  name,
  description,
  body,
  sourcePath,
  modelTier,
  capabilities,
  disallowedTools,
  maxTurns,
  effort,
}) {
  const escapedBody = body.trim()
    .replace(/\\/g, '\\\\')
    .replace(/"""/g, '\\"""');
  const sandboxMode = deriveCodexSandboxMode(capabilities, disallowedTools);
  const reasoningEffort = normalizeCodexReasoningEffort(effort);

  return [
    `# Generated from ${sourcePath}`,
    '',
    `name        = ${JSON.stringify(name)}`,
    `description = ${JSON.stringify(description)}`,
    `model       = ${JSON.stringify(getCodexModelForTier(modelTier))}`,
    `model_reasoning_effort = ${JSON.stringify(reasoningEffort)}`,
    `sandbox_mode = ${JSON.stringify(sandboxMode)}`,
    'approval_policy = "on-request"',
    ...(maxTurns ? [`num_turns = ${maxTurns}`] : []),
    '',
    'developer_instructions = """',
    escapedBody,
    '"""',
    '',
  ].join('\n');
}

function renderCopilotPromptMarkdown({ name, description, body }) {
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

  lines.push('---');
  lines.push('');
  lines.push(body.trim());
  lines.push('');

  return lines.join('\n');
}

function renderCopilotInstructionMarkdown({ applyTo, body }) {
  const lines = [
    '---',
    `applyTo: ${JSON.stringify(applyTo)}`,
    '---',
    '',
    body.trim(),
    '',
  ];

  return lines.join('\n');
}

function renderCodexConfigTemplate(skills) {
  const lines = [
    '# Codex CLI project configuration template',
    '# Generated from canonical skills under skills/<category>/.../<slug>/.',
    '#',
    '# Usage:',
    '#   Copy this file to .codex/config.toml in a trusted project repo.',
    '#   Global config lives at ~/.codex/config.toml.',
    '#   Project config is only loaded from trusted repos (codex trust <dir>).',
    '',
    '# ---------------------------------------------------------------------------',
    '# Core settings',
    '# ---------------------------------------------------------------------------',
    '',
    'model = "gpt-5.4"',
    'sandbox_mode = "workspace-write"',
    'approval_policy = "on-request"',
    '',
    '# ---------------------------------------------------------------------------',
    '# Skills configuration',
    '#',
    '# NOTE: skills.config[].path points to the SKILL.md file inside the skill',
    '# directory, not the directory itself. Skill files are categorized on disk as',
    '# skills/<category>/.../<slug>/SKILL.md, but the skill name remains the slug.',
    '# ---------------------------------------------------------------------------',
    '',
  ];

  for (const skill of skills) {
    lines.push('[[skills.config]]');
    lines.push(`path = "\${AGENT_TOOLKIT_DIR}/${skill.sourcePath}"`);
    lines.push('enabled = true');
    lines.push('');
  }

  lines.push('# ---------------------------------------------------------------------------');
  lines.push('# MCP server configuration (optional)');
  lines.push('# ---------------------------------------------------------------------------');
  lines.push('# Declare MCP servers as [mcp_servers.<id>] tables.');
  lines.push('# Each server runs as a subprocess exposing tools to Codex sessions.');
  lines.push('#');
  lines.push('# Example:');
  lines.push('# [mcp_servers.filesystem]');
  lines.push('# command = "npx"');
  lines.push('# args = ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]');
  lines.push('# env = {}');
  lines.push('');

  return lines.join('\n');
}

function renderSkillsReadme(skills) {
  const lines = [
    '# skills/',
    '',
    'Shared skill definitions. Root `skills/` is the single source of truth for universal skill content used across the toolkit.',
    '',
    '## Contribution Entry Point',
    '',
    'Before opening a pull request that touches skills, run the repo-local Claude contribution',
    'assistant at `.claude/agents/contribution-assistant.md`. It runs `definition-review` on',
    'changed definitions, updates versioned changelogs, regenerates generated assets, and runs',
    'the local gate.',
    '',
    '## Layout',
    '',
    'Skills are categorized on disk, while the frontmatter `name` remains the stable skill id:',
    '',
    '```text',
    'skills/',
    '  <category>/',
    '    ...',
    '      <slug>/',
    '        SKILL.md',
    '        CHANGELOG.md',
    '        references/',
    '        scripts/',
    '        evals/',
    '```',
    '',
    'Category directories are open-ended and discovered recursively. Adding, renaming, or splitting categories should not require generator changes as long as each skill directory contains `SKILL.md` and `CHANGELOG.md`.',
    '',
    'Flat `skills/<slug>/` paths are treated as a legacy migration fallback only.',
    '',
    '## Skills',
    '',
    '| Category | Skill | Version | Lifecycle | Description |',
    '|---|---|---|---|---|',
  ];

  for (const skill of skills) {
    lines.push(`| ${escapeMarkdownTableCell(skill.category)} | \`${skill.id}\` | ${escapeMarkdownTableCell(skill.version || 'Unreleased')} | ${escapeMarkdownTableCell(skill.lifecycle)} | ${escapeMarkdownTableCell(skill.description)} |`);
  }

  lines.push('');
  lines.push('## Category Taxonomy');
  lines.push('');
  lines.push('- Categories are navigation, not identity. The stable skill id is the `name` frontmatter field.');
  lines.push('- Reuse an existing category when the new skill fits a contributor-facing domain already present.');
  lines.push('- Create a new category when the skill would otherwise make an existing category ambiguous, or when two or more related skills need a clearer home.');
  lines.push('- Nested categories are allowed for scale, for example `skills/platform/security/<slug>/`.');
  lines.push('- Use kebab-case category names. Do not encode lifecycle, target tool, owner, or release status in the category path.');
  lines.push('');
  lines.push('## Versioning');
  lines.push('');
  lines.push('Skill versions live in each skill\'s `CHANGELOG.md` section headers. The stable skill id');
  lines.push('is the `name` frontmatter field, not the category path, and this repository does not');
  lines.push('require release tags for skill versions.');
  lines.push('');
  lines.push('## Adding A Skill');
  lines.push('');
  lines.push('1. Create `skills/<category>/.../<slug>/SKILL.md` with matching `name: <slug>` frontmatter.');
  lines.push('2. Create `skills/<category>/.../<slug>/CHANGELOG.md` with the initial version entry.');
  lines.push('3. Run `npm run ci` to refresh adapters, catalog inputs, generated inventories,');
  lines.push('   and validation before opening a pull request.');
  lines.push('');

  return lines.join('\n');
}

function renderRulesReadme(rules) {
  const lines = [
    '# rules/',
    '',
    'Shared rule definitions — the single source of truth for rule content used across the toolkit\'s supported AI surfaces.',
    '',
    '## Contribution Entry Point',
    '',
    'Before opening a pull request that touches rules, run the repo-local Claude contribution',
    'assistant at `.claude/agents/contribution-assistant.md`. It checks the changed component,',
    'updates versioned changelogs, regenerates adapters, and runs the local gate.',
    '',
    '## Ownership',
    '',
    '- Root `rules/` is canonical.',
    '- Claude Code consumes generated adapters under `claude-code/rules/`.',
    '- GitHub Copilot for VS Code consumes generated adapters under `github-copilot/instructions/`.',
    '- OpenAI Codex uses them through `openai-codex/rules/build-agents-md.sh` and related composition assets.',
    '',
    '## Structure',
    '',
    '```text',
    'rules/',
    '  <slug>/',
    '    <slug>.md',
    '    CHANGELOG.md',
    '```',
    '',
    '## Rules',
    '',
    '| Rule | Lifecycle |',
    '|---|---|',
  ];

  for (const rule of rules) {
    lines.push(`| \`${rule.id}\` | ${escapeMarkdownTableCell(rule.lifecycle)} |`);
  }

  lines.push('');
  lines.push('## Versioning');
  lines.push('');
  lines.push('Rule versions live in each rule\'s `CHANGELOG.md` section headers. This repository does');
  lines.push('not require release tags for rule versions.');
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
    lifecycle: normalizeFrontmatterValue(extractField(/^lifecycle:\s*(.+)$/m, parts.frontmatter, '')),
    modelTier: normalizeFrontmatterValue(extractField(/^model-tier:\s*(.+)$/m, parts.frontmatter, '')),
    capabilities: parseYamlList(parts.frontmatter, 'capabilities'),
    subagents: parseYamlList(parts.frontmatter, 'subagents'),
    skills: parseYamlList(parts.frontmatter, 'skills'),
  };
}

function removeFrontmatterField(frontmatter, fieldName) {
  return frontmatter
    .split('\n')
    .filter(line => !line.match(new RegExp(`^${fieldName}:\\s*`)))
    .join('\n');
}

function listCanonicalHookSlugs() {
  const hooksDir = path.join(REPO_ROOT, 'hooks');
  return fs.readdirSync(hooksDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(name => fs.existsSync(path.join(hooksDir, name, `${name}.sh`)))
    .sort((a, b) => HOOK_ORDER.indexOf(a) - HOOK_ORDER.indexOf(b));
}

function renderCopilotHookManifest({ slug, event }) {
  const spec = HOOK_SPECS[slug];
  return JSON.stringify({
    hooks: {
      [event]: [
        {
          type: 'command',
          command: `bash "\${AGENT_TOOLKIT_DIR:-\${TOOLKIT_PATH:-$PWD}}/github-copilot/hooks/${slug}/${slug}.sh"`,
          timeoutMs: spec.timeoutMs,
        },
      ],
    },
  }, null, 2) + '\n';
}

function renderHookAdapter({ tool, slug, spec }) {
  const label = tool === 'github-copilot' ? 'VS Code Copilot' : 'Codex';

  if (spec.adapterKind === 'integrity-warn') {
    return [
      '#!/usr/bin/env bash',
      `# ${label} adapter: point the canonical integrity-warn hook at the ${tool === 'github-copilot' ? 'Copilot' : 'Codex'} integrity script.`,
      'set -euo pipefail',
      '',
      'SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd -P)"',
      'REPO_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd -P)"',
      '',
      `export AGENT_TOOLKIT_HOOK_TOOL="${tool}"`,
      `export AGENT_TOOLKIT_INTEGRITY_SCRIPT="\${REPO_DIR}/${tool}/scripts/integrity-check.sh"`,
      '',
      'exec "${REPO_DIR}/hooks/integrity-warn/integrity-warn.sh"',
      '',
    ].join('\n');
  }

  const lines = [
    '#!/usr/bin/env bash',
  ];

  if (spec.adapterKind === 'direct') {
    lines.push(`# ${label} adapter: delegate directly to the canonical root ${slug} hook.`);
  } else if (spec.adapterKind === 'handoff') {
    lines.push(`# ${label} adapter: normalize stop-event fields, then delegate to root hooks/${slug}.`);
  } else if (spec.adapterKind === 'protect-config') {
    lines.push(`# ${label} adapter: normalize Bash payloads for root protect-config and block protected file edits directly${tool === 'openai-codex' ? ' when present' : ''}.`);
  } else if (spec.adapterKind === 'changelog-check') {
    lines.push(`# ${label} adapter: derive a pre-push-style ref payload from git push, then delegate to root hooks/changelog-check.`);
  } else {
    lines.push(`# ${label} adapter: self-filter ${tool === 'github-copilot' ? 'PreToolUse' : 'Bash'} payloads, then delegate to root hooks/${slug}.`);
  }

  lines.push('set -euo pipefail', '', 'SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd -P)"');
  lines.push('# shellcheck source=../../../hooks/_adapter_lib.sh');
  lines.push('source "${SCRIPT_DIR}/../../../hooks/_adapter_lib.sh"');
  lines.push('');

  if (spec.adapterKind === 'direct') {
    lines.push(`run_root_hook "${slug}"`, '');
    return lines.join('\n');
  }

  lines.push('read_adapter_input');

  if (spec.adapterKind === 'handoff') {
    lines.push('NORMALIZED=$(normalize_handoff_payload)');
    lines.push('[[ -n "${NORMALIZED}" ]] || exit 0', '');
    lines.push(`run_root_hook_with_input "${slug}" "\${NORMALIZED}"`, '');
    return lines.join('\n');
  }

  if (spec.adapterKind === 'command-filter') {
    lines.push('COMMAND=$(extract_command)');
    lines.push('[[ -n "${COMMAND}" ]] || exit 0');
    lines.push(`${spec.commandPredicate} "\${COMMAND}" || exit 0`, '');
    lines.push(`run_root_hook_with_input "${slug}" "$(normalize_command_payload "\${COMMAND}")"`, '');
    return lines.join('\n');
  }

  if (spec.adapterKind === 'changelog-check') {
    lines.push('COMMAND=$(extract_command)');
    lines.push('[[ -n "${COMMAND}" ]] || exit 0');
    lines.push('is_git_push_command "${COMMAND}" || exit 0', '');
    lines.push('PUSH_CONTEXT=$(derive_push_context "${COMMAND}") || exit 0');
    lines.push('IFS=$\'\\t\' read -r REMOTE REMOTE_URL LOCAL_REF LOCAL_SHA REMOTE_REF REMOTE_SHA <<< "${PUSH_CONTEXT}"', '');
    lines.push('CHANGELOG_OUTPUT="$(printf \'%s %s %s %s\\n\' "${LOCAL_REF}" "${LOCAL_SHA}" "${REMOTE_REF}" "${REMOTE_SHA}" | run_root_hook "changelog-check" "${REMOTE}" "${REMOTE_URL}" 2>&1)" || CHANGELOG_STATUS=$?');
    lines.push('CHANGELOG_STATUS="${CHANGELOG_STATUS:-0}"', '');
    lines.push('if [[ "${CHANGELOG_STATUS}" -eq 0 ]]; then');
    lines.push('  exit 0');
    lines.push('fi', '');
    lines.push('REASON="$(printf \'%s\\n\' "${CHANGELOG_OUTPUT}" | awk \'NF { gsub(/[[:space:]]+/, " "); print; exit }\')"');
    lines.push('[[ -n "${REASON}" ]] || REASON="CHANGELOG.md checks failed for the pending git push. Update the relevant changelog entry before retrying."');
    lines.push('emit_deny "${REASON}"', '');
    return lines.join('\n');
  }

  if (spec.adapterKind === 'protect-config') {
    lines.push('COMMAND=$(extract_command)');
    lines.push('if [[ -n "${COMMAND}" ]]; then');
    lines.push('  run_root_hook_with_input "protect-config" "$(normalize_command_payload "${COMMAND}")"');
    lines.push('  exit 0');
    lines.push('fi', '');
    lines.push('RAW_TOOL=$(extract_tool_name)');
    lines.push('TOOL=$(normalize_edit_tool_name "${RAW_TOOL}")');
    lines.push('FILE=$(extract_file_path)');
    lines.push('[[ -n "${TOOL}" && -n "${FILE}" ]] || exit 0', '');
    lines.push('if is_protected_file_path "${FILE}"; then');
    lines.push('  emit_deny "Write to control-plane files is blocked. Protected paths (settings.json, hooks/, CLAUDE.md, agents/, statusline-command.sh, orchestrator logs, orchestrator session.id, hookify rules) require direct user action to modify."');
    lines.push('fi', '', 'exit 0', '');
    return lines.join('\n');
  }

  throw new Error(`Unknown hook adapter kind: ${spec.adapterKind}`);
}

function renderCodexHooksJson(slugs) {
  const grouped = {
    SessionStart: [],
    PreToolUse: [],
    PostToolUse: [],
    UserPromptSubmit: [],
    SubagentStart: [],
    Stop: [],
  };

  for (const slug of slugs) {
    const spec = HOOK_SPECS[slug];
    grouped[spec.codexEvent].push({
      matcher: spec.codexMatcher,
      hooks: [
        {
          type: 'command',
          command: `\${AGENT_TOOLKIT_DIR:-$HOME/.codex}/openai-codex/hooks/${slug}/${slug}.sh`,
          statusMessage: spec.codexStatusMessage,
          timeoutMs: spec.timeoutMs,
        },
      ],
    });
  }

  return JSON.stringify({ hooks: grouped }, null, 2) + '\n';
}

function pruneUnknownHookDirs(toolDir, allowedSlugs) {
  for (const entry of fs.readdirSync(toolDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (allowedSlugs.has(entry.name)) continue;
    fs.rmSync(path.join(toolDir, entry.name), { recursive: true, force: true });
  }
}

function syncHooks() {
  const canonicalSlugs = listCanonicalHookSlugs();
  const knownSlugs = new Set(Object.keys(HOOK_SPECS));

  for (const slug of canonicalSlugs) {
    if (!knownSlugs.has(slug)) {
      throw new Error(`Missing hook spec for canonical hook: ${slug}`);
    }
  }

  for (const slug of knownSlugs) {
    if (!canonicalSlugs.includes(slug)) {
      throw new Error(`Hook spec has no matching canonical hook directory: ${slug}`);
    }
  }

  const copilotHooksDir = path.join(REPO_ROOT, 'github-copilot', 'hooks');
  const codexHooksDir = path.join(REPO_ROOT, 'openai-codex', 'hooks');
  const allowedSlugs = new Set(canonicalSlugs);

  pruneUnknownHookDirs(copilotHooksDir, allowedSlugs);
  pruneUnknownHookDirs(codexHooksDir, allowedSlugs);

  for (const slug of canonicalSlugs) {
    const spec = HOOK_SPECS[slug];

    writeIfChanged(
      path.join(copilotHooksDir, slug, `${slug}.json`),
      renderCopilotHookManifest({ slug, event: spec.copilotEvent })
    );
    writeIfChanged(
      path.join(copilotHooksDir, slug, `${slug}.sh`),
      renderHookAdapter({ tool: 'github-copilot', slug, spec })
    );
    writeIfChanged(
      path.join(codexHooksDir, slug, `${slug}.sh`),
      renderHookAdapter({ tool: 'openai-codex', slug, spec })
    );
  }

  writeIfChanged(
    path.join(codexHooksDir, 'hooks.json'),
    renderCodexHooksJson(canonicalSlugs)
  );
}

function syncAgents() {
  const claudeAgentsDir = path.join(REPO_ROOT, 'claude-code', 'agents');
  const copilotAgentsDir = path.join(REPO_ROOT, 'github-copilot', 'agents');
  const codexAgentsDir = path.join(REPO_ROOT, 'openai-codex', 'agents');
  const canonicalAgentsDir = path.join(REPO_ROOT, 'agents');

  const names = listCanonicalNames('agents', 'AGENT.md');

  for (const entry of fs.readdirSync(claudeAgentsDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      removePathIfExists(path.join(claudeAgentsDir, entry.name));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      const slug = entry.name.replace(/\.md$/, '');
      if (!names.includes(slug)) removePathIfExists(path.join(claudeAgentsDir, entry.name));
    }
  }

  for (const entry of fs.readdirSync(copilotAgentsDir, { withFileTypes: true })) {
    if (entry.isDirectory() && !names.includes(entry.name)) {
      removePathIfExists(path.join(copilotAgentsDir, entry.name));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.agent.md')) {
      const slug = entry.name.replace(/\.agent\.md$/, '');
      if (!names.includes(slug)) removePathIfExists(path.join(copilotAgentsDir, entry.name));
    }
  }

  for (const entry of fs.readdirSync(codexAgentsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.toml')) continue;
    const slug = entry.name.replace(/\.toml$/, '');
    if (!names.includes(slug)) removePathIfExists(path.join(codexAgentsDir, entry.name));
  }

  for (const name of names) {
    const claudePath = path.join(claudeAgentsDir, `${name}.md`);
    const legacyClaudePath = path.join(claudeAgentsDir, name, `${name}.md`);
    const copilotPath = path.join(copilotAgentsDir, `${name}.agent.md`);
    const codexPath = path.join(codexAgentsDir, `${name}.toml`);
    const canonicalPath = path.join(canonicalAgentsDir, name, 'AGENT.md');
    const canonicalChangelogPath = path.join(canonicalAgentsDir, name, 'CHANGELOG.md');
    const legacyClaudeChangelogPath = path.join(claudeAgentsDir, name, 'CHANGELOG.md');

    const claudeMarkdown = read(fs.existsSync(claudePath) ? claudePath : legacyClaudePath);
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
    const lifecycle = existingCanonical && existingCanonical.lifecycle
      ? existingCanonical.lifecycle
      : 'stable';
    const modelTier = existingCanonical && existingCanonical.modelTier
      ? existingCanonical.modelTier
      : claudeConfig.modelTier;
    const capabilities = existingCanonical && existingCanonical.capabilities.length > 0
      ? existingCanonical.capabilities
      : claudeConfig.capabilities;
    const subagents = existingCanonical && existingCanonical.subagents.length > 0
      ? existingCanonical.subagents
      : claudeConfig.childAgents;
    const skills = existingCanonical && existingCanonical.skills.length > 0
      ? existingCanonical.skills
      : claudeConfig.skills;
    const disallowedTools = claudeConfig.disallowedTools;
    const maxTurns = claudeConfig.maxTurns;
    const effort = claudeConfig.effort;

    writeIfChanged(
      canonicalPath,
      renderCanonicalMarkdown({
        kind: 'agent',
        name,
        description,
        lifecycle,
        modelTier,
        capabilities,
        subagents,
        skills,
        adapterPaths: [
          `claude-code/agents/${name}.md`,
          `github-copilot/agents/${name}.agent.md`,
          `openai-codex/agents/${name}.toml`,
        ],
        body: canonicalBody,
      })
    );

    if (!fs.existsSync(canonicalChangelogPath) && fs.existsSync(legacyClaudeChangelogPath)) {
      writeIfChanged(canonicalChangelogPath, read(legacyClaudeChangelogPath));
    }

    writeIfChanged(claudePath, `${claudeParts.frontmatter}\n\n${canonicalBody}`);
    removePathIfExists(path.join(claudeAgentsDir, name));
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
        capabilities,
        disallowedTools,
        maxTurns,
        effort,
      })
    );
  }
}

function syncWorkflows() {
  const claudeCommandsDir = path.join(REPO_ROOT, 'claude-code', 'commands');
  const copilotPromptsDir = path.join(REPO_ROOT, 'github-copilot', 'prompts');
  const canonicalWorkflowsDir = path.join(REPO_ROOT, 'workflows');

  const names = listCanonicalNames('workflows', 'WORKFLOW.md');

  for (const entry of fs.readdirSync(claudeCommandsDir, { withFileTypes: true })) {
    if (entry.isDirectory() && !names.includes(entry.name)) {
      removePathIfExists(path.join(claudeCommandsDir, entry.name));
    }
  }

  for (const entry of fs.readdirSync(copilotPromptsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.prompt.md')) continue;
    const slug = entry.name.replace(/\.prompt\.md$/, '');
    if (!names.includes(slug)) removePathIfExists(path.join(copilotPromptsDir, entry.name));
  }

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
    const canonicalBody = existingCanonical
      ? existingCanonical.body
      : stripLeadingHtmlComments(copilotParts.body || claudeParts.body);
    const description = existingCanonical
      ? existingCanonical.description
      : normalizeFrontmatterValue(
          extractField(/^description:\s*(.+)$/m, copilotParts.frontmatter, '') ||
          extractField(/^description:\s*(.+)$/m, claudeParts.frontmatter, '')
        );
    const lifecycle = existingCanonical && existingCanonical.lifecycle
      ? existingCanonical.lifecycle
      : 'stable';

    writeIfChanged(
      canonicalPath,
      renderCanonicalMarkdown({
        kind: 'workflow',
        name,
        description,
        lifecycle,
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

    writeIfChanged(claudePath, `${removeFrontmatterField(claudeParts.frontmatter, 'argument-hint')}\n\n${canonicalBody}`);
    writeIfChanged(
      copilotPath,
      renderCopilotPromptMarkdown({
        name,
        description,
        body: canonicalBody,
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

  for (const entry of fs.readdirSync(claudeRulesDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || names.includes(entry.name)) continue;
    removePathIfExists(path.join(claudeRulesDir, entry.name));
  }

  for (const entry of fs.readdirSync(copilotInstructionsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.instructions.md')) continue;
    const slug = entry.name.replace(/\.instructions\.md$/, '');
    if (!names.includes(slug)) removePathIfExists(path.join(copilotInstructionsDir, entry.name));
  }

  const ruleEntries = [];
  for (const name of names) {
    const canonicalPath = path.join(canonicalRulesDir, name, `${name}.md`);
    const claudePath = path.join(claudeRulesDir, name, `${name}.md`);
    const copilotPath = path.join(copilotInstructionsDir, `${name}.instructions.md`);

    const canonicalMarkdown = read(canonicalPath);
    const parts = splitFrontmatter(canonicalMarkdown);
    const body = stripLeadingHtmlComments(parts.body);

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

    ruleEntries.push({
      id: name,
      lifecycle: normalizeFrontmatterValue(extractField(/^lifecycle:\s*(.+)$/m, parts.frontmatter, '')),
    });

    writeIfChanged(
      claudePath,
      canonicalMarkdown.endsWith('\n') ? canonicalMarkdown : `${canonicalMarkdown}\n`
    );
    writeIfChanged(
      copilotPath,
      renderCopilotInstructionMarkdown({
        applyTo,
        body,
      })
    );
  }

  writeIfChanged(path.join(REPO_ROOT, 'rules', 'README.md'), renderRulesReadme(ruleEntries));
}

function syncSkills() {
  const skills = listSharedSkillEntries();

  writeIfChanged(
    path.join(REPO_ROOT, 'openai-codex', 'config.toml.template'),
    renderCodexConfigTemplate(skills)
  );

  writeIfChanged(
    path.join(REPO_ROOT, 'skills', 'README.md'),
    renderSkillsReadme(skills)
  );
}

function main() {
  const modes = new Set(process.argv.slice(2));
  const runAll = modes.size === 0 || modes.has('--all');

  if (runAll || modes.has('--agents')) syncAgents();
  if (runAll || modes.has('--workflows')) syncWorkflows();
  if (runAll || modes.has('--rules')) syncRules();
  if (runAll || modes.has('--skills')) syncSkills();
  if (runAll || modes.has('--hooks')) syncHooks();
}

main();
