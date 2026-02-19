#!/usr/bin/env node
// Simple validator for SKILL.md frontmatter (no external deps)
const fs = require('fs');
const path = require('path');

function help() {
  console.log('validate-skill.js — validate SKILL.md frontmatter and basic rules');
  console.log('Usage: node validate-skill.js <path-to-SKILL.md-or-skill-dir>');
  console.log('Example: node validate-skill.js .agent/skills/creating-antigravity-skills/SKILL.md');
}

function exitWithError(msg) {
  console.error('ERROR:', msg);
  process.exitCode = 1;
}

function readSkillFile(p) {
  let stat;
  try { stat = fs.statSync(p); } catch (e) { return null; }
  if (stat && stat.isDirectory()) p = path.join(p, 'SKILL.md');
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}

function parseFrontmatter(text) {
  // Accept either LF or CRLF line endings for cross-platform compatibility
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const body = m[1];
  const lines = body.split(/\n/);
  const obj = {};
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (val.startsWith('>-') || val === '>-' || val === '|-') {
      // multi-line: collect remaining lines until next key or end
      // fallback: capture full remainder as description
      val = body.slice(body.indexOf(line) + line.length).trim();
      obj[key] = val;
      break;
    }
    // remove surrounding quotes
    val = val.replace(/^['\"]|['\"]$/g, '');
    obj[key] = val;
  }
  return obj;
}

function validateName(name) {
  if (!/^[a-z0-9-]{1,64}$/.test(name)) return '`name` must be lowercase, numbers or hyphens, max 64 chars.';
  if (/claude|anthropic/.test(name)) return '`name` must not contain `claude` or `anthropic`.';
  const segments = name.split('-');
  if (!segments.some(s => s.endsWith('ing'))) return '`name` should include a gerund segment (at least one segment ending with "ing").';
  return null;
}

function validateDescription(desc) {
  if (!desc || desc.length === 0) return '`description` is required.';
  if (desc.length > 1024) return '`description` must be <= 1024 chars.';
  // crude third-person check
  const lower = desc.toLowerCase();
  if (/\b(i |we |you )/i.test(desc)) return '`description` should be written in third person (avoid I, we, you).';
  // require at least one trigger-like token
  if (!(/skill|skill.md|agent|\.agent\/skills|template|antigravity/.test(lower))) return '`description` should include explicit triggers/keywords (e.g. skill, SKILL.md, .agent/skills).';
  return null;
}

function run(target) {
  if (!target) { help(); process.exitCode = 1; return; }
  const text = readSkillFile(target);
  if (!text) { exitWithError('SKILL.md not found at: ' + target); return; }
  const fm = parseFrontmatter(text);
  if (!fm) { exitWithError('Missing YAML frontmatter (--- ... ---)'); return; }
  const errors = [];
  const nameErr = validateName(fm.name || '');
  if (nameErr) errors.push(nameErr);
  const descErr = validateDescription(fm.description || '');
  if (descErr) errors.push(descErr);
  if (errors.length) {
    console.error('\nValidation failed for', target);
    errors.forEach(e => console.error('- ' + e));
    process.exitCode = 1;
    return;
  }
  console.log('OK — frontmatter looks valid for', target);
}

if (require.main === module) {
  const arg = process.argv[2];
  if (!arg || arg === '--help' || arg === '-h') { help(); process.exitCode = arg ? 0 : 1; }
  else run(arg);
}
