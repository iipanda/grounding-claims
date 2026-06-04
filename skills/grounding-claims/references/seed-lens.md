# Seed-lens — universal assumption shapes

> **Common shapes — recall aids to WIDEN the first-principles pass (step 2 of the loop). NOT a
> checklist to bound it. This list is non-exhaustive; always run the completeness-critic
> (step 4) for load-bearing assumptions that fit no shape here, especially domain-specific ones.**
> Examples in parentheses are illustrations from one ops codebase — yours will differ.

| Shape | Tripwire (recognitionTell) | Probe (cheap, read-only, <5s) |
|---|---|---|
| `success-signal-lies` | your next sentence has `done\|fixed\|working\|passing\|deployed\|Succeeded\|200` | assert the concrete artifact/effect, not the summary field (e.g. `ls` the produced file; read the log line) |
| `live≠source` | "merged / patched / committed" used to mean "live" | read the running object's actual state (image/limits/ready) and diff vs source |
| `pod-green≠app-reachable` | declaring a service healthy from pod Ready / open port / curl 200 without exercising the user path | exercise the real user-facing protocol end-to-end (login / page-load / console), trace the full origin path — not just pod/infra health |
| `version/capability` | relying on a feature/flag/field "because it normally works" | `--version` / schema introspection / replay the call against the live endpoint and read the status |
| `precondition-present` | pointing a flag/script/manifest at a path/tag/ID/secret | `ls`/`command -v`/manifest-inspect; resolve external IDs against their API |
| `localize-the-real-cause` | naming a root cause, or deciding from a single metric | (a) read what the metric *measures*, (b) probe the suspected layer independently *at the failure window*, (c) confirm the env = prod |
| `absence≠zero` | mapping empty / 0-rows / EOF / 404 to "none" / "off" / "idle" | prove the query/path/stream itself succeeded before trusting its emptiness |
| `reversibility/backup-first` | about to delete / format / force-push / migrate / drop | confirm a fresh, restorable backup/snapshot/undo path exists first |
| `auth/scope/secret` | assuming an identity/token/secret has exactly the right scope | check perms (`can-i`) / decode token scopes / grep the CORS-Origin allowlist / check secret rotation |
| `concurrency-with-other-actors` | assuming "I'm the only one touching this resource" | check for a controller/CronJob/HPA/lease that owns the field (e.g. ownership metadata) |
| `async/ordering/idempotency` | assuming sync / ordered / safe-to-retry | re-read via primary; assert a monotonic floor; test the handler invoked twice yields one effect |
| `capacity/quota` | a bulk op assuming there is headroom | disk/inode (`df -i`), fd (`ulimit -n`), allocatable, provider rate-limit headers |
| `mechanism-does-what-name-says` | trusting a named function/job/guard as a safety net | read its body and ALL branches; grep for the actual delete/cap/guard call; look for TODO/stub markers |
| `incomplete-fix` | closing an issue after fixing the one repro you saw | `rg` every sibling site of the pattern; test the other known variants |
| `identity/target` | acting on a human-reported name / time / current selection | resolve to the canonical live object; confirm the action targets exactly it |
| `high-blast-radius-op` | a reload/restart/cutover/destructive op on prod or a control-plane | **defer to the repo's own safety rules** (e.g. CLAUDE.md golden rules); write blast-radius/rollback/out-of-band plan; require double-confirm |

## How to use this lens
1. You have already done the first-principles pass (step 2): you listed what must be true for *this* solution.
2. Walk the table. For each shape, ask: "does my plan quietly assume this?" Add any you missed to your assumption list.
3. Then run the completeness-critic (step 4): "which load-bearing assumption fits NO shape above?"
