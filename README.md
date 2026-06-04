# grounding-claims

A Claude Code plugin. A **premise gate**: before acting on a plan, the agent surfaces the
load-bearing implicit assumptions the plan rests on, adversarially refutes each (false until
proven), and **stops** if any load-bearing assumption is false or unverifiable.

- Engine: `skills/grounding-claims/SKILL.md` — the 9-step loop (first-principles → widen → completeness-critic → triage → route → refute → gate → persist) plus the three teeth (probe-backed evidence, probe safety, absence ≠ zero).
- Universal assumption shapes: `skills/grounding-claims/references/seed-lens.md` (16 shapes, explicitly non-exhaustive).
- Per-repo learned catalogue: `docs/assumptions/catalogue.md` in each target repo — bootstrapped by mining the repo's docs (`workflows/bootstrap-catalogue.mjs`), grown incrementally via `lib/catalogue.mjs` (`mergeEntry` is idempotent by key).

See [`docs/design.md`](docs/design.md) for the design rationale.

## Install

From Claude Code (the repo is its own single-plugin marketplace):

```
/plugin marketplace add iipanda/grounding-claims
/plugin install grounding-claims@grounding-claims-marketplace
```

Already added the marketplace before? Refresh it first: `/plugin marketplace update grounding-claims-marketplace`.

For local development, point the marketplace at your checkout instead:
`/plugin marketplace add /path/to/grounding-claims-plugin`.

### Codex CLI

Codex reads skills (a folder with `SKILL.md`) from `~/.codex/skills/` — the same format this plugin
uses. Paste this prompt into Codex and let it install itself:

```
Install the "grounding-claims" skill (a premise gate) for me:

1. git clone https://github.com/iipanda/grounding-claims ~/.agents/grounding-claims
2. mkdir -p ~/.codex/skills
3. ln -s ~/.agents/grounding-claims/skills/grounding-claims ~/.codex/skills/grounding-claims
   — if your skill discovery doesn't follow symlinks, copy the folder instead:
   cp -R ~/.agents/grounding-claims/skills/grounding-claims ~/.codex/skills/grounding-claims
4. Verify ~/.codex/skills/grounding-claims/SKILL.md exists and has name+description frontmatter.
5. Note: the optional catalogue library lives at ~/.agents/grounding-claims/lib/catalogue.mjs;
   the skill knows how to degrade if it can't reach it.
6. Tell me exactly what you did, then remind me to restart Codex so it picks up the new skill.
```

Codex has subagents but no Workflow fan-out — the skill's degradation rules cover that (refuters run
sequentially). Invoke with `/skills`, a `$grounding-claims` mention, or implicitly by task match.

## Usage

The skill fires on its own when you ask the agent to act on something premise-heavy — version
upgrades, "it's merged so it works", a destructive step "covered" by an assumed backup, using an API
tied to a specific version. You can also invoke it explicitly:

- *"Check what this plan assumes before you run it."*
- *"Ground the claims in this approach."*

What a run produces:

1. **A run-ledger** — every load-bearing assumption with a verdict (`TRUE` / `FALSE` / `UNVERIFIABLE`)
   and probe-backed evidence in `invocation → result` form. No probe, no verdict — the skill refuses
   to "verify" anything it didn't actually check.
2. **A gate decision** — any load-bearing assumption that is FALSE or UNVERIFIABLE makes the agent
   **STOP and report** instead of proceeding; lower-weight items are logged as risks and work continues.
3. **Repo artifacts** — the ledger lands in `docs/assumptions/<topic>-<date>.md`, and newly-learned
   assumption shapes accumulate in `docs/assumptions/catalogue.md`, so the gate gets sharper the longer
   you use it in a repo. On first use in a repo with a rich docs/postmortem history, the skill offers
   an opt-in bootstrap that mines that history into a starter catalogue.

Works degraded in other harnesses too: with subagents but no Workflow fan-out it refutes sequentially;
with no subagents at all the agent plays the refuter role inline (the evidence rules carry the rigor).

## Develop / test

```
node --test          # catalogue lib + structural skill tests (no deps; Node 18+)
```

Trigger evals live in `skills/grounding-claims/evals/` (skill-creator `run_eval.py` format in
`trigger-evals.json`; results + interpretation in `evals/results/`). The behavioral gate scenario
is `evals/scenarios/planted-assumptions-plan.md` + `EXPECTED.md`.
