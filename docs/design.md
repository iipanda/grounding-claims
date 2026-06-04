# grounding-claims — design overview

## Problem

Agents act on plans that rest on implicit, unverified premises: "this version supports the feature",
"the running service reflects the manifest I merged", "a 200 means it works", "the backup already has a
copy". When a load-bearing premise is false, the work fails late or causes an incident. Existing
discipline skills verify the **outcome** after work; nothing verifies the **premises** before it.
`grounding-claims` is that missing layer: a **premise gate**.

## Architecture — three layers

```
LAYER 1 — Engine (the method)        generic, first-principles, domain-agnostic   → SKILL.md
LAYER 2 — Seed-lens                  16 universal shapes, EXPLICITLY non-exhaustive → references/seed-lens.md
LAYER 3 — Per-repo learned catalogue bootstrap-by-mining + incremental merge      → docs/assumptions/catalogue.md (in each target repo)
```

The central design tension: a fixed taxonomy becomes **blinders** (the agent only hunts known shapes
and misses the novel premise that actually hurts), but pure "think about your assumptions" is vague and
lets hallucinations through. The resolution is ordering: the catalogue is only ever consulted to
**widen** a first-principles pass, never to bound it, and a completeness-critic step always runs.

## The loop (order is the anti-blinders mechanism)

detect input → **first-principles** (think before opening any catalogue) → widen via seed-lens +
repo catalogue → completeness-critic ("which load-bearing assumption fits NO shape?") → triage
(load-bearing × plausibly-wrong × falsifiable) → route (APP/CODE vs INFRA/OPS + cross-cutting) →
**adversarial refutation** (fresh refuter per assumption, false-until-proven) → **tiered gate**
(load-bearing FALSE/UNVERIFIABLE ⇒ STOP + ledger; lower weight ⇒ logged risk) → persist & learn.

## The teeth (anti-proof-theater)

- **R1 — Evidence from a probe run THIS loop**, cited as `invocation → result`. Citing the audited
  plan as proof of its own premise is disallowed; a bare conclusion is not a citation.
- **R2 — Probe safety:** read-only/dry-run, ~<5s, safe on production — otherwise mark UNVERIFIABLE
  and route to a double-confirm path. Never trade a hypothetical failure for a real one.
- **R3 — Absence ≠ zero:** empty/EOF/404 is missing data, never a confirmed negative, until the
  query/path/stream itself is proven to have succeeded.

## Learning (Layer 3)

A repo-local `docs/assumptions/catalogue.md` holds learned shapes (human table + a JSON
source-of-truth block), managed only via `lib/catalogue.mjs` — `mergeEntry` is idempotent by key,
preserves an existing entry's identity fields, unions examples, and escalates weight. A repo with a
rich docs/postmortem history can be bootstrapped by the fan-out mining workflow
(`workflows/bootstrap-catalogue.mjs`, Claude Code Workflow runtime); elsewhere the catalogue starts
empty and grows incrementally.

## Validation

The seed-lens shapes generalize failure patterns that recur in real operational history — each shape
exists because its class of assumption has repeatedly broken real systems. The loop itself is
validated end-to-end by the in-repo planted-assumptions behavioral scenario
(`skills/grounding-claims/evals/scenarios/`): all planted false premises surfaced, zero fabricated
evidence, STOP at the gate. Trigger-eval results and their interpretation live in
`skills/grounding-claims/evals/results/`.

## Positioning

- vs an outcome gate (verification-before-completion): premises **before** work vs outcome **after**;
  complementary — this skill hands the final done-claim to the outcome gate.
- vs systematic debugging: this is the premise checklist debugging consults when localizing a cause,
  not a replacement for the debugging loop.
- High-blast-radius operations **defer to the target repo's own safety rules** rather than restating them.
- Degradation in other harnesses is documented in SKILL.md (subagents-without-Workflow ⇒ sequential
  refuters; no subagents ⇒ inline refuter role; no Node ⇒ ledger only).
