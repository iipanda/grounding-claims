import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractEntries, validateEntry, renderCatalogue, mergeEntry, normalizeKey, BLOCK_START } from '../skills/grounding-claims/scripts/catalogue.mjs';

const SAMPLE = {
  key: 'version-capability',
  definition: 'A feature/flag/field is assumed supported at the version actually deployed.',
  recognitionTell: "relying on a feature 'because it normally works' without checking the live version",
  probe: 'run --version / kubectl explain / replay the call against the live endpoint and read the status',
  weight: 'high',
  examples: ['upgrade-postmortem: controller v9.2 needs platform v3.4+, live was v3.1'],
};

test('validateEntry: flags a missing required field', () => {
  const { key, ...noKey } = SAMPLE;
  const errs = validateEntry(noKey);
  assert.ok(errs.some((e) => e.includes('key')), `expected a key error, got ${JSON.stringify(errs)}`);
});

test('validateEntry: a complete entry has no errors', () => {
  assert.deepEqual(validateEntry(SAMPLE), []);
});

test('normalizeKey: lowercases, trims, hyphenates', () => {
  assert.equal(normalizeKey('  Version Capability '), 'version-capability');
});

test('extractEntries: empty/none returns empty entries', () => {
  const { entries } = extractEntries('# Catalogue\n\nno data here\n');
  assert.deepEqual(entries, []);
});

test('mergeEntry: appends a genuinely new key', () => {
  const start = [SAMPLE];
  const { entries, added } = mergeEntry(start, {
    key: 'absence-not-zero', definition: 'empty/EOF/404 read as a confirmed negative',
    recognitionTell: 'mapping empty/404/EOF to "none"/"off"', probe: 'prove the query/path/stream succeeded first',
    weight: 'high', examples: ['sleep-scheduler-postmortem: 422 read as hasData=false'],
  });
  assert.equal(added, true);
  assert.equal(entries.length, 2);
  assert.equal(start.length, 1, 'must not mutate input');
});

test('mergeEntry: dedups an existing key and unions examples', () => {
  const { entries, added } = mergeEntry([SAMPLE], {
    ...SAMPLE, examples: ['demo-app: patched CR limits, pod kept old'],
  });
  assert.equal(added, false);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].examples.length, 2);
});

test('renderCatalogue → extractEntries round-trips the entries', () => {
  const data = { meta: { repo: 'demo', updated: 'fixed-date' }, entries: [SAMPLE] };
  const md = renderCatalogue(data);
  assert.ok(md.includes(BLOCK_START));
  const back = extractEntries(md);
  assert.deepEqual(back.entries, data.entries);
});

test('mergeEntry: throws on invalid entry', () => {
  assert.throws(() => mergeEntry([], {}), /invalid entry/);
});

test('renderCatalogue → extractEntries round-trips an entry with an embedded ``` fence', () => {
  const d = {
    meta: {},
    entries: [{ ...SAMPLE, recognitionTell: 'see ```yaml``` blocks' }],
  };
  const back = extractEntries(renderCatalogue(d));
  assert.deepEqual(back.entries, d.entries);
});

test('renderCatalogue → extractEntries round-trips an entry with a literal end-marker', () => {
  const d = {
    meta: {},
    entries: [{ ...SAMPLE, probe: 'watch for <!-- grounding-claims-catalogue:end --> in output' }],
  };
  const back = extractEntries(renderCatalogue(d));
  assert.deepEqual(back.entries, d.entries);
});

test('mergeEntry: preserves identity fields and escalates weight on existing key', () => {
  const { entries, added } = mergeEntry([SAMPLE], {
    ...SAMPLE,
    definition: 'CHANGED definition',
    recognitionTell: 'CHANGED recognitionTell',
    probe: 'CHANGED probe',
    weight: 'critical',
  });
  assert.equal(added, false);
  assert.equal(entries[0].definition, SAMPLE.definition);
  assert.equal(entries[0].recognitionTell, SAMPLE.recognitionTell);
  assert.equal(entries[0].probe, SAMPLE.probe);
  assert.equal(entries[0].weight, 'critical');
});

test('mergeEntry: stores the normalized key on insert', () => {
  const { entries } = mergeEntry([], { ...SAMPLE, key: '  My Key  ' });
  assert.equal(entries[0].key, 'my-key');
});
