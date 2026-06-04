# Trigger eval results

Harness: skill-creator `run_eval.py` (bare `claude -p`, runs-per-query=3, threshold=0.5).

- run1 (original description): 3/8 — all 3 negatives correctly quiet; positives mostly 0.0 (id3 at 0.33).
- run2 (sharpened description): 4/8 — negatives still 3/3 quiet; destructive-action positive now 0.67.

Read: the bare print-mode harness under-measures plan-execution skills (claude -p answers
"upgrade X" conversationally without consulting skills). Negatives at 0.0 are the strong signal
(no over-trigger). Real in-session behavior is validated by evals/scenarios/ (planted-assumptions
run: full loop followed, zero fabricated evidence, STOP gate). Future work: skill-creator
improve_description.py loop; beware overfitting to this 8-query set.
