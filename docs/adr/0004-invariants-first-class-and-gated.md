---
status: accepted
date: 2026-09-13
---

# Invariants are a first-class spec construct enforced by the coverage gate

Invariants surfaced during grilling — cross-cutting truths that range over *all* inputs (idempotence, round-trip, validity-preservation), distinct from example-based scenarios — are recorded as a first-class `#### Invariant:` construct in the spec with stable per-capability ids (e.g. `auth-login/INV1`), parallel to scenarios ([[0002]]). They are deliberately **not** ADRs (an invariant is a property, not a trade-off) and **not** `CONTEXT.md` (a glossary only). Each invariant is enforced by one of three routes — a fast-check **property test**, a **runtime guarantee** (DB constraint / branded type) that a test proves holds, or an explicit `[waived: reason]` for production-only/monitored properties — and whichever route is chosen, the coverage gate treats it uniformly: every invariant touched by a change's delta needs ≥1 covering test tagged `@invariant <id>`, or a waiver. Properties are authored **red-first** against the contract stubs, like acceptance tests ([[0001]]).

## Considered options

- **A standalone `INVARIANTS.md`** — rejected: divorces invariants from the requirements they constrain.
- **Recording invariants as ADRs** — rejected: an invariant is a property that holds, not a decision with alternatives.
- **Leaving invariants advisory** (caught only by mutation + human review) — rejected: reintroduces exactly the rot the bridge exists to prevent.

## Consequences

- The checker gains a second tagged construct (`@invariant` alongside `@covers`) but keeps one gate shape and one archive path.
- Property tests run in the pre-merge unit lane and must be **seeded** so a counterexample replays deterministically ([[0003]]).
- Because properties range over inputs they are strong by construction, raising the mutation score in the strength tier ([[0003]]).
- The enforcement route (property vs runtime guarantee) is an implementation detail; the gate only ever sees "is there a covering test?".
