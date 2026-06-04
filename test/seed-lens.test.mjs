import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const md = readFileSync(new URL('../skills/grounding-claims/references/seed-lens.md', import.meta.url), 'utf8');

test('seed-lens lists at least 15 shapes as table rows with a tripwire and a probe', () => {
  const rows = md.split('\n').filter((l) => /^\|\s*`[a-z]/.test(l)); // table rows whose first cell is a `code` key
  assert.ok(rows.length >= 15, `expected >=15 shape rows, found ${rows.length}`);
  for (const r of rows) {
    const cells = r.split('|').map((c) => c.trim()).filter(Boolean);
    assert.ok(cells.length >= 3, `row needs key|tripwire|probe: ${r}`);
  }
});

test('seed-lens states it is non-exhaustive', () => {
  assert.match(md, /non-exhaustive/i);
});
