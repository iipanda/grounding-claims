# Changelog

## 0.1.0
- Initial release: grounding-claims premise-gate skill (engine + 16-shape seed-lens), tested catalogue lib,
  triggering evals + behavioral gate scenario, bootstrap miner + incremental learning.

## 0.1.1
- Fix: remove invalid `skills` field from `.claude-plugin/plugin.json` (skills are auto-discovered
  from `skills/`); it failed Claude Code manifest validation on install ("skills: Invalid input").

## 0.1.2
- Portability: documented degradation paths for other harnesses — subagents-without-Workflow
  (e.g. Codex) dispatches refuters sequentially/batched; no-subagent harnesses run the refuter
  role inline; no-Node keeps the ledger and skips the catalogue append. Bootstrap mining stays
  a Claude Code Workflow (optional everywhere else).

## 0.1.3
- Public release: internal working documents removed and replaced with `docs/design.md`; README gained
  a Usage section; example data genericized; git history squashed for the public release.

## 0.1.4
- Self-contained skill folder: the catalogue library, write-catalogue script, and bootstrap workflow
  moved inside `skills/grounding-claims/` (scripts/ and workflows/), so a standalone install (Codex,
  plain copy) carries everything. Paths updated across SKILL.md and references.
- README rewritten: plainer language, shorter Codex install (skill-installer one-liner + manual copy).
