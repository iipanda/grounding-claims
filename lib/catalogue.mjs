// lib/catalogue.mjs — deterministic per-repo catalogue management.
// The catalogue.md carries a JSON source-of-truth block between these markers:
export const BLOCK_START = '<!-- grounding-claims-catalogue:start -->';
export const BLOCK_END = '<!-- grounding-claims-catalogue:end -->';
export const REQUIRED_FIELDS = ['key', 'definition', 'recognitionTell', 'probe', 'weight'];
const WEIGHT_RANK = { low: 1, medium: 2, high: 3, critical: 4 };

export function normalizeKey(key) {
  return String(key).trim().toLowerCase().replace(/\s+/g, '-');
}

export function validateEntry(entry) {
  const errors = [];
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) return ['entry is not an object'];
  for (const f of REQUIRED_FIELDS) {
    if (entry[f] === undefined || entry[f] === null || String(entry[f]).trim() === '') {
      errors.push(`missing required field: ${f}`);
    }
  }
  if (entry.examples !== undefined && !Array.isArray(entry.examples)) {
    errors.push('examples must be an array');
  }
  return errors;
}

export function extractEntries(md) {
  const s = md.indexOf(BLOCK_START);
  const e = md.lastIndexOf(BLOCK_END);
  if (s === -1 || e === -1 || e < s) return { meta: {}, entries: [] };
  const inner = md.slice(s + BLOCK_START.length, e);
  const fence = inner.match(/```json\s*([\s\S]*)```/);
  if (!fence) return { meta: {}, entries: [] };
  const parsed = JSON.parse(fence[1].trim());
  return { meta: parsed.meta || {}, entries: Array.isArray(parsed.entries) ? parsed.entries : [] };
}

/**
 * Merge an entry into the catalogue. Dedups by normalized key. On an existing
 * key, identity fields (definition/recognitionTell/probe) are PRESERVED from the
 * existing entry; `examples` are unioned; `weight` escalates to the higher
 * severity. Does not mutate inputs.
 */
export function mergeEntry(entries, entry) {
  const errs = validateEntry(entry);
  if (errs.length) throw new Error(`invalid entry: ${errs.join('; ')}`);
  const k = normalizeKey(entry.key);
  const out = entries.map((e) => structuredClone(e));
  const idx = out.findIndex((e) => normalizeKey(e.key) === k);
  if (idx === -1) {
    out.push({ ...entry, key: k });
    return { entries: out, added: true };
  }
  const existing = out[idx];
  const exA = Array.isArray(existing.examples) ? existing.examples : [];
  const exB = Array.isArray(entry.examples) ? entry.examples : [];
  const weight = (WEIGHT_RANK[entry.weight] || 0) > (WEIGHT_RANK[existing.weight] || 0) ? entry.weight : existing.weight;
  out[idx] = { ...existing, weight, examples: [...new Set([...exA, ...exB])] };
  return { entries: out, added: false };
}

export function renderCatalogue({ meta = {}, entries = [] }) {
  const sorted = [...entries].sort(
    (a, b) => (WEIGHT_RANK[b.weight] || 0) - (WEIGHT_RANK[a.weight] || 0) || a.key.localeCompare(b.key),
  );
  const cell = (s) => String(s).replace(/\|/g, '\\|');
  const rows = sorted
    .map((e) => `| \`${e.key}\` | ${e.weight} | ${cell(e.recognitionTell)} | ${cell(e.probe)} |`)
    .join('\n');
  const metaLine = [meta.repo ? `Repo: \`${meta.repo}\`` : '', meta.updated ? `Updated: ${meta.updated}` : ''].filter(Boolean).join('  ');
  const json = JSON.stringify({ meta, entries }, null, 2);
  return `# Assumption Catalogue — learned shapes for this repo

> **Anti-blinders invariant:** this catalogue is consulted ONLY to *widen* a first-principles
> pass (never to bound it), and the completeness-critic step always runs regardless of what is
> listed here. A learned catalogue must not become a closed world.

${metaLine ? metaLine + '\n\n' : ''}| Shape | Weight | Tripwire (recognitionTell) | Probe |
|---|---|---|---|
${rows}

${BLOCK_START}
\`\`\`json
${json}
\`\`\`
${BLOCK_END}
`;
}
