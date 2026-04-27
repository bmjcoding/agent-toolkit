#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const HOOK_SPECS = {
  'branch-guard': {
    adapterKind: 'command-filter',
    commandPredicate: 'is_git_commit_or_push_command',
    copilotEvent: 'PreToolUse',
    codexEvent: 'PreToolUse',
    codexMatcher: 'Bash',
    codexStatusMessage: 'Checking branch guard...',
  },
  'changelog-check': {
    adapterKind: 'changelog-check',
    copilotEvent: 'PreToolUse',
    codexEvent: 'PreToolUse',
    codexMatcher: 'Bash',
    codexStatusMessage: 'Validating changelog entry...',
  },
  'dispatch-validate': {
    adapterKind: 'direct',
    copilotEvent: 'PreToolUse',
    codexEvent: 'PreToolUse',
    codexMatcher: '.*',
    codexStatusMessage: 'Validating dispatch prompt...',
  },
  'extract-handoff': {
    adapterKind: 'handoff',
    copilotEvent: 'SubagentStop',
    codexEvent: 'Stop',
    codexMatcher: '.*',
    codexStatusMessage: 'Extracting handoff JSON...',
  },
  'inject-context': {
    adapterKind: 'direct',
    copilotEvent: 'SubagentStart',
    codexEvent: 'UserPromptSubmit',
    codexMatcher: '.*',
    codexStatusMessage: 'Injecting session context...',
  },
  'integrity-warn': {
    adapterKind: 'integrity-warn',
    copilotEvent: 'SubagentStop',
    codexEvent: 'PostToolUse',
    codexMatcher: 'Bash',
    codexStatusMessage: 'Running integrity check...',
  },
  'post-agent-audit': {
    adapterKind: 'direct',
    copilotEvent: 'SubagentStop',
    codexEvent: 'Stop',
    codexMatcher: '.*',
    codexStatusMessage: 'Auditing agent scope...',
  },
  'pre-push-secrets': {
    adapterKind: 'command-filter',
    commandPredicate: 'is_git_commit_or_push_command',
    copilotEvent: 'PreToolUse',
    codexEvent: 'PreToolUse',
    codexMatcher: 'Bash',
    codexStatusMessage: 'Scanning for secrets before push...',
  },
  'printf-lint': {
    adapterKind: 'direct',
    copilotEvent: 'PostToolUse',
    codexEvent: 'PostToolUse',
    codexMatcher: '.*',
    codexStatusMessage: 'Linting printf safety...',
  },
  'protect-config': {
    adapterKind: 'protect-config',
    copilotEvent: 'PreToolUse',
    codexEvent: 'PreToolUse',
    codexMatcher: 'Bash',
    codexStatusMessage: 'Checking config protection...',
  },
};
const HOOK_ORDER = [
  'branch-guard',
  'changelog-check',
  'dispatch-validate',
  'extract-handoff',
  'inject-context',
  'integrity-warn',
  'post-agent-audit',
  'pre-push-secrets',
  'printf-lint',
  'protect-config',
];

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

function removePathIfExists(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  fs.rmSync(targetPath, { recursive: true, force: true });
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

function renderCanonicalMarkdown({ name, description, lifecycle, adapterPaths, body, kind, modelTier, capabilities, subagents, skills, argumentHint }) {
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
    lifecycle: normalizeFrontmatterValue(extractField(/^lifecycle:\s*(.+)$/m, parts.frontmatter, '')),
    modelTier: normalizeFrontmatterValue(extractField(/^model-tier:\s*(.+)$/m, parts.frontmatter, '')),
    capabilities: parseYamlList(parts.frontmatter, 'capabilities'),
    subagents: parseYamlList(parts.frontmatter, 'subagents'),
    skills: parseYamlList(parts.frontmatter, 'skills'),
    argumentHint: normalizeFrontmatterValue(extractField(/^argument-hint:\s*(.+)$/m, parts.frontmatter, '')),
  };
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
  return JSON.stringify({
    hooks: {
      [event]: [
        {
          type: 'command',
          command: `bash "$AGENT_TOOLKIT_DIR/github-copilot/hooks/${slug}/${slug}.sh"`,
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
    PreToolUse: [],
    PostToolUse: [],
    UserPromptSubmit: [],
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
    const argumentHint = normalizeFrontmatterValue(
      (existingCanonical && existingCanonical.argumentHint) ||
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

  for (const entry of fs.readdirSync(claudeRulesDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || names.includes(entry.name)) continue;
    removePathIfExists(path.join(claudeRulesDir, entry.name));
  }

  for (const entry of fs.readdirSync(copilotInstructionsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.instructions.md')) continue;
    const slug = entry.name.replace(/\.instructions\.md$/, '');
    if (!names.includes(slug)) removePathIfExists(path.join(copilotInstructionsDir, entry.name));
  }

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
  const modes = new Set(process.argv.slice(2));
  const runAll = modes.size === 0 || modes.has('--all');

  if (runAll || modes.has('--agents')) syncAgents();
  if (runAll || modes.has('--workflows')) syncWorkflows();
  if (runAll || modes.has('--rules')) syncRules();
  if (runAll || modes.has('--hooks')) syncHooks();
}

main();
