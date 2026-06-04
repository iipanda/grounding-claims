import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const md = readFileSync(new URL('../skills/grounding-claims/SKILL.md', import.meta.url), 'utf8');

test('SKILL.md has YAML frontmatter with name and a pushy description', () => {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(m, 'missing frontmatter');
  assert.match(m[1], /name:\s*grounding-claims/);
  assert.match(m[1], /description:\s*.+/);
  assert.ok(m[1].length < 1500, 'frontmatter description should be concise');
});

test('SKILL.md references all three reference files', () => {
  for (const ref of ['seed-lens.md', 'catalogue-format.md', 'refuter-contract.md']) {
    assert.ok(md.includes(ref), `SKILL.md must point at references/${ref}`);
  }
});

test('SKILL.md enforces the anti-blinders ordering and the citation rule', () => {
  assert.match(md, /first-principles/i);
  assert.match(md, /completeness-critic/i);
  assert.match(md, /citation/i);
});
