---
status: accepted
date: 2026-09-13
---

# Scenarios are the test contract; blind acceptance tests run before implementation

In our OpenSpec flow every requirement is expressed as `#### Scenario:` blocks, and we treat the scenario as the single contract: it is both what an acceptance test is written against and the unit of test traceability ([[0002]]). Acceptance tests are authored in a fenced **red-first phase at the start of `/opsx:apply`** — not during `/opsx:propose`, which is contractually planning-only and must not touch project code — from the spec alone, before any implementation file exists, and must fail with an **assertion** error ("red for the right reason"), never a compile error or a vacuous pass. To make that possible, `propose` emits the observable contract (signatures / HTTP shape / error types) as `NotImplemented` stubs so the tests compile and fail meaningfully.

## Considered options

- **Acceptance tests at `propose`** (as in the initial sketch) — rejected: `propose` is contractually planning-only and tests are project code.
- **Tests written after implementation** — rejected: not adversarial, no red signal, the agent grades its own work.
- **A separate agent/context authors tests for hard blindness** — rejected (Fork B): doubles orchestration cost and is still not fully adversarial with one model.

## Consequences

- `propose` must define the observable interface precisely enough that a test compiles before any implementation exists.
- Every scenario gains a stable id ([[0002]]).
- "Blind" here means **temporal/artifact** blindness under one agent; honesty is enforced by red-for-the-right-reason + human review of the red + post-merge mutation ([[0003]]), not by authorship separation.
