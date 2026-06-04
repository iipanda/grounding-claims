# grounding-claims

A premise gate for coding agents, packaged as a Claude Code plugin. Before the agent acts on a
plan, it lists the assumptions the plan depends on, tries to disprove each one (an assumption
counts as false until a probe proves it), and stops if a load-bearing assumption turns out false
or can't be verified.

Three parts:

- `skills/grounding-claims/SKILL.md` — the loop: derive assumptions from first principles, widen
  with a catalogue of known shapes, triage, refute, gate.
- `skills/grounding-claims/references/seed-lens.md` — 16 common assumption shapes, each with a
  tripwire phrase and a cheap read-only probe. The list is deliberately not exhaustive.
- a per-repo catalogue (`docs/assumptions/catalogue.md` in whatever repo you use it in) that
  records the shapes caught there, so the gate improves with use.

Design rationale: [`docs/design.md`](docs/design.md).

## Install

### Claude Code

The repo is its own single-plugin marketplace:

```
/plugin marketplace add iipanda/grounding-claims
/plugin install grounding-claims@grounding-claims-marketplace
```

Added the marketplace earlier? Refresh it first: `/plugin marketplace update grounding-claims-marketplace`.
For local development, point the marketplace at your checkout instead.

### Codex

Codex reads the same SKILL.md format. If you have a skill installer, paste:

```
Install the grounding-claims skill from https://github.com/iipanda/grounding-claims (the skill folder is skills/grounding-claims)
```

Or by hand: copy `skills/grounding-claims/` into `~/.codex/skills/` and restart Codex. The folder
is self-contained; the catalogue scripts and the bootstrap workflow ship inside it.

## Usage

The skill triggers on its own when a task leans on unverified premises: version upgrades, "it's
merged so it works", a destructive step that assumes a backup exists. You can also ask directly:
"check what this plan assumes before you run it".

A run produces:

1. A ledger of assumptions, each with a verdict (TRUE, FALSE, or UNVERIFIABLE) and the probe that
   produced it, written as `invocation → result`. No probe, no verdict.
2. A gate decision. A false or unverifiable load-bearing assumption stops the agent, and it reports
   the ledger instead of proceeding. Lower-weight items get logged as risks.
3. Files in your repo: the ledger in `docs/assumptions/<topic>-<date>.md`, plus new assumption
   shapes appended to `docs/assumptions/catalogue.md`. In a repo with a long docs or postmortem
   history, the skill offers to mine it into a starter catalogue (opt-in, costs tokens).

In harnesses without parallel fan-out the refuters run sequentially; with no subagents at all the
agent plays the refuter role itself. The evidence rules are the same either way.

## Develop / test

```
node --test
```

Tests cover the catalogue library and the skill's structure (no dependencies, Node 18+). Trigger
evals live in `skills/grounding-claims/evals/`, the behavioral scenario in
`skills/grounding-claims/evals/scenarios/`.
