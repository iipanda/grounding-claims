export const meta = {
  name: 'bootstrap-grounding-catalogue',
  description: 'Mine a repo\'s docs for recurring hidden-assumption failures and return per-repo catalogue entries',
  phases: [{ title: 'Mine' }, { title: 'Cluster' }],
};

// Tolerate args arriving as a JSON-encoded string (some callers stringify) or as an object.
const a = typeof args === 'string' ? JSON.parse(args) : (args || {});
const root = a.root || '.';
const glob = a.glob || `${root}/docs/**/*.md`;

const FINDING_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['findings'],
  properties: { findings: { type: 'array', items: {
    type: 'object', additionalProperties: false,
    required: ['assumption', 'reality', 'shape', 'probe', 'source'],
    properties: {
      assumption: { type: 'string' }, reality: { type: 'string' }, shape: { type: 'string' },
      probe: { type: 'string' }, source: { type: 'string' },
    },
  } } },
};

phase('Mine');
log(`Mining docs under ${glob}`);
const listing = await agent(
  `List up to 200 markdown files matching ${glob} (one path per line). Run a shell command; output ONLY the paths.`,
  { label: 'list docs' });
const files = String(listing).split('\n').map((s) => s.trim()).filter((s) => s.endsWith('.md'));
const batches = [];
for (let i = 0; i < files.length; i += 10) batches.push(files.slice(i, i + 10));

const mined = await parallel(batches.map((b, i) => () => agent(
  [
    'Read each of these docs in full and extract cases where a LOAD-BEARING implicit assumption turned out wrong:',
    b.join('\n'),
    'For each: assumption (as held), reality, shape (short category), probe (cheap read-only check that would have caught it), source (path). Only real, doc-supported findings.',
  ].join('\n'),
  { label: `mine batch ${i + 1}/${batches.length}`, phase: 'Mine', schema: FINDING_SCHEMA },
)));
const findings = mined.filter(Boolean).flatMap((r) => r.findings || []);

const CAT_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['entries'],
  properties: { entries: { type: 'array', items: {
    type: 'object', additionalProperties: false,
    required: ['key', 'definition', 'recognitionTell', 'probe', 'weight', 'examples'],
    properties: {
      key: { type: 'string' }, definition: { type: 'string' }, recognitionTell: { type: 'string' },
      probe: { type: 'string' }, weight: { type: 'string' }, examples: { type: 'array', items: { type: 'string' } },
    },
  } } },
};

phase('Cluster');
const clustered = await agent(
  [
    'Cluster these assumption-failure findings into sharp, non-overlapping catalogue entries — at most 15, and FEWER when the findings only support fewer (merge near-duplicates; never pad the count).',
    JSON.stringify(findings),
    'Each entry: key (kebab-case), definition, recognitionTell (a literal tripwire phrase), probe (cheap read-only), weight (low|medium|high|critical), examples (source refs).',
  ].join('\n'),
  { label: 'cluster → catalogue', phase: 'Cluster', schema: CAT_SCHEMA });

return { root, count: findings.length, entries: clustered.entries };
