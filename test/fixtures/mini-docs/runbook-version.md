# Upgrade postmortem
We assumed the tool supported `--json` at the installed version. It did not (added in a later release),
so the command errored and the rollout stalled. Fix: check `tool --version` against the feature's docs first.
