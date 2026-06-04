# Artifact formats: run-ledger and per-repo catalogue

## Run-ledger (one per skill run)
Path: `docs/assumptions/<topic>-<YYYY-MM-DD>.md` (configurable). A table the operator reads at the gate:

| Assumption | Load-bearing? | Weight | Verdict | Evidence (citation) | Gate status |
|---|---|---|---|---|---|
| Flux v2.8 supports this k8s minor | yes | critical | FALSE | `kubectl get nodes` → v1.30.2; Flux v2.8 docs require v1.33+ | **STOP** |
| `run.sh` exists after install | yes | high | TRUE | `kubectl exec … ls /data/run.sh` → present | pass |

Rules:
- **Verdict ∈ {TRUE, FALSE, UNVERIFIABLE}.** A verdict of TRUE/FALSE REQUIRES evidence produced by a probe
  run during this loop, and the Evidence column MUST show it as `invocation → result` (as in the example rows
  above) — not just a conclusion. Citing the audited plan/spec as proof of its own premise is disallowed.
  No probe-backed evidence ⇒ verdict is `UNVERIFIABLE`.
- **Gate:** any load-bearing assumption that is FALSE or UNVERIFIABLE ⇒ **STOP** and report. Lower-weight ⇒ logged risk, proceed.

## Per-repo catalogue (learned shapes)
Path: `docs/assumptions/catalogue.md` (configurable). Human table + a JSON source-of-truth block
between `<!-- grounding-claims-catalogue:start -->` / `:end` markers. Managed ONLY via the skill's
bundled `scripts/catalogue.mjs` (`extractEntries` / `mergeEntry` / `renderCatalogue`) — never
hand-edit the JSON block directly.

Entry schema: `{ key, definition, recognitionTell, probe, weight, examples[] }`.

**Anti-blinders invariant:** the catalogue is consulted ONLY at step 3 (widen), never before step 2
(first-principles); step 4 (completeness-critic) always runs regardless of catalogue size.

## Fallback paths
If the repo has no `docs/` directory, write both artifacts under `.grounding-claims/` at the repo root.

## Incremental append (every run)
```bash
node -e "import('<this-skill-dir>/scripts/catalogue.mjs').then(async m=>{
  const fs=require('fs'); const p='docs/assumptions/catalogue.md';
  const {meta,entries}=fs.existsSync(p)?m.extractEntries(fs.readFileSync(p,'utf8')):{meta:{},entries:[]};
  const {entries:next}=m.mergeEntry(entries, NEW_SHAPE /* {key,definition,recognitionTell,probe,weight,examples} */);
  fs.writeFileSync(p, m.renderCatalogue({meta,entries:next}));
})"
```
`mergeEntry` is idempotent by key, so this is safe to run repeatedly.
