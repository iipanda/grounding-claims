#!/usr/bin/env node
// Usage: node write-catalogue.mjs <out.md> <entries.json> [repo]
import { readFileSync, writeFileSync } from 'node:fs';
import { renderCatalogue, validateEntry } from './catalogue.mjs';

const [out, entriesPath, repo = ''] = process.argv.slice(2);
if (!out || !entriesPath) { console.error('usage: write-catalogue.mjs <out.md> <entries.json> [repo]'); process.exit(2); }
const entries = JSON.parse(readFileSync(entriesPath, 'utf8'));
for (const e of entries) {
  const errs = validateEntry(e);
  if (errs.length) { console.error(`invalid entry ${e.key}: ${errs.join('; ')}`); process.exit(1); }
}
writeFileSync(out, renderCatalogue({ meta: { repo, updated: new Date().toISOString().slice(0, 10) }, entries }));
console.log(`wrote ${entries.length} entries → ${out}`);
