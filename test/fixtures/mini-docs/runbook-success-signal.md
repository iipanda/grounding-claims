# Deploy postmortem
The CI job was green so we assumed the artifact published. It hadn't — the publish step swallowed an error
and exited 0. The page 500'd for an hour. Fix: assert the artifact exists, don't trust the green check.
