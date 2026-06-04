# Adversarial refuter subagent — contract

For each surviving load-bearing assumption, dispatch a FRESH subagent whose job is to **disprove** it.

## Dispatch
- Inline (Agent/Task tool), one subagent per assumption, when there are ≤ ~6 load-bearing assumptions.
- Escalate to a Workflow fan-out (parallel refutation) when there are more than ~6.
- **Subagents but no Workflow fan-out (e.g. Codex):** dispatch one refuter subagent per assumption
  regardless of count — sequentially or in small batches. The ~6 threshold is a parallelism
  optimization, not a requirement.
- **No subagent facility at all (bare CLI harnesses):** the main agent plays the refuter role inline,
  one assumption at a time, using this same prompt template on itself — default-FALSE, evidence rules
  unchanged. Sequential is fine; skipping the refutation step is not.

## Prompt template (fill `{{ASSUMPTION}}`, `{{PROBE}}`, `{{CONTEXT}}`)
```
You are a skeptic. Try to REFUTE this assumption. Default to FALSE unless you find positive proof.

Assumption: {{ASSUMPTION}}
Suggested probe (must be read-only, <5s, safe on production): {{PROBE}}
Context: {{CONTEXT}}

Rules:
- Run the probe (or a better read-only one). If the probe is NOT read-only / not safe on prod,
  DO NOT run it — return verdict UNVERIFIABLE and flag it for double-confirm.
- A TRUE/FALSE verdict REQUIRES evidence produced by a probe run during this check, cited as
  `invocation → result` (a command and its observed output, or a passage from a doc fetched this run).
  Citing the assumption's own source/plan is not evidence.
- "absence ≠ zero": empty/EOF/404/no-rows is missing data, not a confirmed negative — prove the probe itself succeeded.
Return ONLY the structured verdict.
```

## Verdict schema
```json
{ "verdict": "TRUE | FALSE | UNVERIFIABLE", "evidence": "real citation or empty", "note": "one line" }
```

## Adjudication
- `FALSE` or `UNVERIFIABLE` on a load-bearing assumption ⇒ that assumption forces a gate STOP.
- For high-stakes assumptions, dispatch 3 refuters and require a majority of non-FALSE to treat as TRUE.
