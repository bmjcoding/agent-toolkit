#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const AGENT_PATH = path.join(REPO_ROOT, '.claude', 'agents', 'contribution-assistant.md');
const SKILLS_DIR = path.join(REPO_ROOT, '.claude', 'skills');

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function frontmatter(markdown) {
  if (!markdown.startsWith('---\n')) return '';
  const end = markdown.indexOf('\n---\n', 4);
  return end === -1 ? '' : markdown.slice(4, end);
}

function yamlList(block, field) {
  const match = block.match(new RegExp(`^${field}:\\s*\\n((?:\\s+-\\s+.+\\n?)*)`, 'm'));
  if (!match) return [];
  return match[1]
    .split('\n')
    .map(line => line.match(/^\s+-\s+(.+)$/))
    .filter(Boolean)
    .map(item => item[1].trim());
}

function assertInsideRepo(absPath, label) {
  const relative = path.relative(REPO_ROOT, absPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    fail(`${label} resolves outside this repository: ${absPath}`);
  }
}

function validateSkill(skillName) {
  const skillPath = path.join(SKILLS_DIR, skillName);
  if (!fs.existsSync(skillPath)) {
    fail(`missing repo-local Claude skill: .claude/skills/${skillName}`);
    return;
  }

  const stat = fs.lstatSync(skillPath);
  const realPath = fs.realpathSync(skillPath);
  assertInsideRepo(realPath, `.claude/skills/${skillName}`);

  const skillDefinition = stat.isDirectory()
    ? path.join(skillPath, 'SKILL.md')
    : path.join(realPath, 'SKILL.md');
  if (!fs.existsSync(skillDefinition)) {
    fail(`missing SKILL.md for .claude/skills/${skillName}`);
  }
}

function main() {
  if (!fs.existsSync(AGENT_PATH)) {
    fail('missing .claude/agents/contribution-assistant.md');
    return;
  }
  if (!fs.existsSync(SKILLS_DIR)) {
    fail('missing .claude/skills/');
    return;
  }

  const metadata = frontmatter(read(AGENT_PATH));
  const skills = yamlList(metadata, 'skills');
  if (skills.length === 0) {
    fail('contribution-assistant declares no skills');
    return;
  }

  for (const skill of skills) {
    validateSkill(skill);
  }

  if (process.exitCode) return;
  console.log(`Claude contribution assets validated (${skills.length} skills).`);
}

main();
