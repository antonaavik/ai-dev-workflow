---
status: accepted
date: 2026-09-13
---

# Two-tier test enforcement: existence blocks pre-merge, strength advises post-merge

We split test enforcement by cost and by the question it answers. **Pre-merge CI (blocking)** runs the fast, deterministic gates — unit + integration tests, smoke e2e, migration up/down, and the coverage/dangling-link checker ([[0002]]) — answering *"is every touched scenario wired to a test?"*. **Post-merge / nightly (advisory)** runs the slow, quality gates — full e2e and mutation testing — answering *"are those tests actually strong?"*; surviving mutants open an issue rather than block. Migration up/down is deliberately pre-merge: a broken migration discovered after merge is already on `main`.

## Considered options

- **Mutation pre-merge** — rejected: too slow to gate every PR on.
- **Migrations post-merge** (as in the initial sketch) — rejected: too late to catch a broken migration.
- **Full e2e pre-merge** — rejected: flake would block the whole team; a smoke subset gates pre-merge and the full suite runs nightly.

## Consequences

- Mutation is the automated backstop for the "AI grades its own test" risk in [[0001]], but only catches weak tests *after* merge.
- Smoke e2e needs a quarantine/flake policy so one flaky test cannot block the gate.
- Someone must own triaging nightly mutation issues, or they become noise nobody reads.
- The concrete lanes and runners for each level are defined in [[0005]].
