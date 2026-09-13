---
status: accepted
date: 2026-09-13
---

# Skills-QA is a separate track, out of scope for the prescribed test regime

This repo's primary artifact is the AI dev workflow itself (skills, commands, `AGENTS.md`), and ADRs [[0001]]–[[0005]] design the test regime the workflow **prescribes to the software built with it** (`apps/*`, `packages/*`). QA *of the skills themselves* — triggering accuracy and behaviour via `claude plugin eval` — is a distinct track that tests prompts rather than software, and is deliberately out of scope here so the prescribed regime stays coherent. It is a strong candidate for a dedicated follow-up session.

## Consequences

- The coverage gate ([[0002]]), taxonomy ([[0005]]), and CI tiers ([[0003]]) apply to `apps/*` and `packages/*` code, not to `.claude/skills/*`.
- A future ADR will define the skills-eval track if it is adopted; until then skills are validated only by human review.
