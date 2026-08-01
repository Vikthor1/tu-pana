#!/usr/bin/env node

// Final-QA validator for the UX Recovery Audit package. Read-only: it checks the
// issue/RC/remediation graph, package links, JSON logs, and screenshot evidence.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const auditRoot = path.resolve(here, '..');
const repoRoot = path.resolve(auditRoot, '../../..');
const failures = [];
const passes = [];

function fail(message) { failures.push(message); }
function pass(message) { passes.push(message); }
function read(relative) { return fs.readFileSync(path.join(auditRoot, relative), 'utf8'); }
function filesUnder(root, predicate = () => true) {
  const result = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) result.push(...filesUnder(target, predicate));
    else if (predicate(target)) result.push(target);
  }
  return result;
}

// Issue register: identity, severity totals, and one primary RC / remediation route each.
const issueText = read('issue-register.md');
const heading = /^### UX-(\d{3}) · (P[0-3]) · ([^—\n]+) — (.+)$/gm;
const matches = [...issueText.matchAll(heading)];
const issues = new Map();
for (let index = 0; index < matches.length; index += 1) {
  const match = matches[index];
  const id = `UX-${match[1]}`;
  const block = issueText.slice(match.index, matches[index + 1]?.index ?? issueText.length);
  const rc = block.match(/RC-([1-8])/);
  const directionStart = block.indexOf('Direction:');
  const directionText = directionStart >= 0 ? block.slice(directionStart) : '';
  const routes = [...new Set([...directionText.matchAll(/\bR([0-7])\b/g)].map(item => `R${item[1]}`))];
  if (issues.has(id)) fail(`duplicate issue ${id}`);
  if (!rc) fail(`${id} has no RC-1…RC-8 reference`);
  if (!routes.length) fail(`${id} has no R0…R7 remediation direction`);
  issues.set(id, { severity: match[2], rc: rc ? `RC-${rc[1]}` : null, routes });
}

if (issues.size !== 85) fail(`expected 85 issues, found ${issues.size}`);
for (let number = 1; number <= 85; number += 1) {
  const id = `UX-${String(number).padStart(3, '0')}`;
  if (!issues.has(id)) fail(`missing ${id}`);
}
const counts = { P0: 0, P1: 0, P2: 0, P3: 0 };
for (const issue of issues.values()) counts[issue.severity] += 1;
const expectedCounts = { P0: 2, P1: 27, P2: 32, P3: 24 };
if (JSON.stringify(counts) !== JSON.stringify(expectedCounts)) {
  fail(`severity totals ${JSON.stringify(counts)} != ${JSON.stringify(expectedCounts)}`);
} else {
  pass(`severity totals: P0 2 · P1 27 · P2 32 · P3 24`);
}

// RCA primary mapping must contain every issue exactly once and match the register's primary RC.
const rcaText = read('root-cause-analysis.md');
const rcaAssignments = new Map();
for (const section of rcaText.split(/^## RC-/m).slice(1)) {
  const rcNumber = section.match(/^(\d)/)?.[1];
  const explainsLine = section.match(/\*\*Explains:\*\*([^\n]+)/)?.[1] ?? '';
  const explains = explainsLine.split(/\(\+\s*secondary|\(secondary/i)[0];
  for (const id of explains.match(/UX-\d{3}/g) ?? []) {
    if (rcaAssignments.has(id)) fail(`${id} appears in multiple RCA primary Explains lists`);
    rcaAssignments.set(id, `RC-${rcNumber}`);
  }
}
for (const [id, issue] of issues) {
  if (!rcaAssignments.has(id)) fail(`${id} missing from RCA primary Explains lists`);
  else if (rcaAssignments.get(id) !== issue.rc) {
    fail(`${id} register ${issue.rc} != RCA ${rcaAssignments.get(id)}`);
  }
}
if (rcaAssignments.size === 85 && !failures.some(item => item.includes('RCA'))) {
  pass('85/85 issues map to exactly one matching primary root cause');
}

for (const file of ['remediation-roadmap.md', 'acceptance-criteria.md']) {
  const text = read(file);
  for (let route = 0; route <= 7; route += 1) {
    if (!new RegExp(`^## R${route}\\b`, 'm').test(text)) fail(`${file} missing R${route} section`);
  }
}
if (!failures.some(item => item.includes('missing R'))) pass('roadmap and acceptance criteria contain R0–R7');

// Evidence logs and screenshots.
const evidenceRoot = path.join(auditRoot, 'evidence');
const walkFiles = fs.readdirSync(evidenceRoot)
  .filter(name => /^walk-.+\.json$/.test(name))
  .map(name => path.join(evidenceRoot, name))
  .sort();
const referencedShots = new Set();
function collectShots(value) {
  if (Array.isArray(value)) value.forEach(collectShots);
  else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (key === 'shot' && typeof child === 'string') referencedShots.add(child);
      else collectShots(child);
    }
  }
}
for (const file of walkFiles) {
  try { collectShots(JSON.parse(fs.readFileSync(file, 'utf8'))); }
  catch (error) { fail(`${path.basename(file)} invalid JSON: ${error.message}`); }
}
if (walkFiles.length !== 10) fail(`expected 10 walk JSON logs, found ${walkFiles.length}`);
else pass('10/10 walk logs parse as JSON');

const screenshotRoot = path.join(evidenceRoot, 'screens');
const screenshots = filesUnder(screenshotRoot, file => file.endsWith('.jpg'));
if (screenshots.length !== 370) fail(`expected 370 screenshots, found ${screenshots.length}`);
for (const shot of referencedShots) {
  if (!fs.existsSync(path.join(evidenceRoot, shot))) fail(`JSON references missing screenshot ${shot}`);
}
const actualRelative = new Set(screenshots.map(file => path.relative(evidenceRoot, file)));
for (const shot of actualRelative) {
  if (!referencedShots.has(shot)) fail(`screenshot not referenced by walk JSON: ${shot}`);
}
if (screenshots.length === 370 && referencedShots.size === 370 &&
    !failures.some(item => item.includes('screenshot'))) {
  pass('370/370 screenshots exist and are referenced by walk JSON');
}

// Exact Markdown evidence references and internal artifact links.
const markdownFiles = filesUnder(auditRoot, file => file.endsWith('.md'));
let exactEvidenceRefs = 0;
let skippedPatternRefs = 0;
const internalRefs = new Set();
for (const file of markdownFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/`((?:evidence\/)?screens\/[^`]+\.jpg)`/g)) {
    const reference = match[1];
    if (/[…*<>]/.test(reference)) { skippedPatternRefs += 1; continue; }
    const relative = reference.startsWith('evidence/') ? reference : `evidence/${reference}`;
    exactEvidenceRefs += 1;
    if (!fs.existsSync(path.join(auditRoot, relative))) {
      fail(`${path.relative(auditRoot, file)} references missing ${reference}`);
    }
  }
  for (const match of text.matchAll(/`([^`]+\.(?:md|mjs))`/g)) {
    const reference = match[1].replace(/\s+/g, '');
    if (/[*<>]/.test(reference)) continue;
    internalRefs.add(reference);
    const candidates = [
      path.resolve(path.dirname(file), reference),
      path.resolve(auditRoot, reference),
      path.resolve(repoRoot, reference),
      path.resolve(auditRoot, path.basename(reference)),
      path.resolve(repoRoot, path.basename(reference)),
    ];
    if (!candidates.some(candidate => fs.existsSync(candidate))) {
      fail(`${path.relative(auditRoot, file)} has unresolved artifact link ${reference}`);
    }
  }
}
if (!failures.some(item => item.includes('references missing'))) {
  pass(`${exactEvidenceRefs} exact Markdown screenshot references resolve (${skippedPatternRefs} ranged/pattern references manually scoped)`);
}
if (!failures.some(item => item.includes('unresolved artifact link'))) {
  pass(`${internalRefs.size} unique internal Markdown/script artifact references resolve`);
}

for (const message of passes) console.log(`PASS  ${message}`);
for (const message of failures) console.error(`FAIL  ${message}`);
console.log(`SUMMARY ${passes.length} checks passed; ${failures.length} failures`);
process.exitCode = failures.length ? 1 : 0;
