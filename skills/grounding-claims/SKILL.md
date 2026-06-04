---
name: grounding-claims
description: Premise gate — surface and verify a plan's hidden assumptions BEFORE acting. You MUST use this whenever you are about to execute, review, or act on a plan or instruction that involves any of - upgrading, installing, or migrating a tool, dependency, controller, or cluster component; using an API or feature tied to a specific version; deleting, formatting, or resetting data on the strength of an assumed backup; treating merged, green CI, Succeeded, or HTTP 200 as proof that something works or is live; or being asked what a plan assumes or whether it is safe. It surfaces the load-bearing implicit assumptions, adversarially refutes each (false until proven), and STOPS if any is false or unverifiable. Fires even when nobody says "assumptions". Complements verification-before-completion (the outcome gate after work) — this is the premise gate before work.
---

# grounding-claims

A **premise gate**. Other discipline verifies the *outcome* after work; this verifies the *premises*
before/during work. When you are about to build, change, or operate something, the plan rests on
implicit premises ("this version supports it", "the running pod = the manifest I merged", "a 200 means
it works"). When a load-bearing premise is false, the work fails or causes an incident. This skill makes
those premises explicit and forces real evidence before you act.

## When to run
- Right after you form an approach or read/write a plan, and BEFORE you start executing it.
- Especially when the approach depends on: a version/feature, an API or CLI shape, a config/flag/env value,
  a secret/permission/scope, "what is live", a destructive or irreversible step, or another actor's state.

## The loop (order is the anti-blinders mechanism)
Track the loop as a checklist (e.g. a TodoWrite item per step where available) so you don't short-circuit the 9 steps.

1. **Detect input.** Is there a written plan/spec? Audit its content. If not, audit the approach you just
   formed in this conversation.
2. **First-principles (THINK FIRST).** Bottom-up, derive the load-bearing premises of *this* solution:
   "what must be true for this to work?" Do NOT open the catalogue yet — thinking first is what keeps the
   catalogue a widening aid instead of blinders.
3. **Widen.** Now walk `references/seed-lens.md` (universal shapes) AND this repo's
   `docs/assumptions/catalogue.md` if it exists. Add any assumption you missed.
4. **Completeness-critic.** Ask: "which load-bearing assumption fits NO shape above — especially
   domain-specific or novel ones?" Add those too. (This is the explicit defense against a closed catalogue.)
5. **Triage.** Keep an assumption only if it is **load-bearing × plausibly-wrong × falsifiable**. Drop
   trivially-true ones and infinite-regress ones ("the filesystem works"). Load-bearing but not cheaply
   falsifiable ⇒ keep it as an UNVERIFIABLE risk for the gate (do not silently wave it away).
6. **Route.** Classify the task: APP/CODE vs INFRA/OPS (a task that is both ⇒ union both). Lead with that
   mode's shapes plus the cross-cutting ones:
   - APP/CODE: success-signal-lies · live≠source · pod-green≠app-reachable · mechanism-does-what-name-says · incomplete-fix · absence≠zero · async/ordering/idempotency.
   - INFRA/OPS: high-blast-radius-op (defer to repo rules) · precondition-present · version/capability · localize-the-real-cause · identity/target.
   - Cross-cutting (always): reversibility/backup-first · capacity/quota · auth/scope/secret · concurrency-with-other-actors.

   APP/CODE work that touches dependencies, config, or secrets should also union `version/capability`,
   `precondition-present`, and `auth/scope/secret`.
7. **Refute.** For each surviving load-bearing assumption, dispatch a fresh adversarial subagent to
   DISPROVE it, per `references/refuter-contract.md`. ≤ ~6 ⇒ inline subagents; more ⇒ a Workflow fan-out.
   No subagent or Workflow facility in this harness? Play the refuter role yourself, inline, one
   assumption at a time — fresh-eyes, default-FALSE, honoring the full refuter contract (R1–R3 apply
   unchanged; the evidence rules carry the rigor, not the process isolation).
8. **Gate.** Build the run-ledger (`references/catalogue-format.md`). Any load-bearing assumption that is
   **FALSE or UNVERIFIABLE ⇒ STOP and report to the user** with the ledger. Lower-weight ⇒ logged risk, proceed.
9. **Persist & learn.**
   - Write the run-ledger to `docs/assumptions/<topic>-<date>.md` (table from `references/catalogue-format.md`).
   - For each genuinely-NEW shape that surfaced (one not already in `docs/assumptions/catalogue.md`), append it
     via the plugin's `lib/catalogue.mjs` (at the plugin root — `../../lib/catalogue.mjs` from this skill dir):
     read the catalogue, `mergeEntry(entries, newShape)`, `renderCatalogue(...)`, write the file back — exact
     recipe in `references/catalogue-format.md`. `mergeEntry` dedups by key, so re-running is safe.
   - First use in a repo with a `docs/` history and NO catalogue yet: OFFER (opt-in — mining is token-intensive)
     to run the bootstrap workflow if available (`workflows/bootstrap-catalogue.mjs`), then persist its entries
     with `scripts/write-catalogue.mjs`.

## The teeth (enforce regardless of mode)
- **R1 — Evidence from a probe run THIS loop.** Every TRUE/FALSE verdict must cite evidence produced *during
  this loop*, shown as `invocation → result` (e.g. `kubectl get nodes → v1.30.2`): a command and its observed
  output, or a passage from a doc you fetched/read this run. You may NOT cite the plan/spec under audit as
  proof of its own premise, and a bare conclusion without its underlying probe output is not a citation.
  No probe-backed evidence ⇒ the verdict is UNVERIFIABLE, not "ok".
- **R2 — Probe safety.** Every probe must be (a) read-only or dry-run, (b) ~<5s, (c) safe on production. If a
  probe is NOT (e.g. a mutating replay, a node-side pull), DO NOT run it — mark UNVERIFIABLE and route it to
  the same double-confirm path as a high-blast-radius op. Never trade a hypothetical failure for a real one.
- **R3 — Absence ≠ zero.** Empty / 0-rows / EOF / 404 is missing-data, never a confirmed negative, until you
  have proven the query/path/stream itself succeeded.

## Boundaries
- Defer high-blast-radius ops to the repo's own safety rules (e.g. CLAUDE.md golden rules) — point at them, don't restate.
- This skill does not auto-fix the plan; it gates and reports. The operator decides at the STOP.
- Hand off the final "it's done and works" claim to verification-before-completion.

## Degradation in other harnesses
Steps 1–8 need only file reads, shell, and reasoning — they work in any agent harness. Known fallbacks:
- Subagents but no Workflow fan-out (e.g. Codex) ⇒ dispatch refuters sequentially/batched for any count.
- No subagents at all ⇒ inline refuter role (step 7 above). Sequential is fine; skipping refutation is not.
- Skill folder installed standalone (without the plugin repo's `lib/`) ⇒ same as no-Node: write the
  run-ledger, skip the catalogue append, and say so in the ledger.
- No Node available ⇒ still write the run-ledger (markdown); skip the catalogue append and say so in the ledger.
- Bootstrap mining is a Claude Code Workflow; elsewhere the catalogue simply starts empty and grows incrementally.
