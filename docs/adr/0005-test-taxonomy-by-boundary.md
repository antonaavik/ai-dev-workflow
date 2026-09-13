---
status: accepted
date: 2026-09-13
---

# Test taxonomy: levels defined by boundary crossed; provenance is orthogonal

Test **level** is defined by the boundary a test crosses, not by folder or feel:

- **unit** — crosses no I/O boundary (in-process): server handler logic, `packages/*` functions, web components with props, hooks, and fast-check properties.
- **integration** — crosses exactly one boundary the code *owns* — its own DB or its own HTTP surface — and never another service: Express routes via supertest against a **real Postgres test container**, web components against **MSW-mocked HTTP**, and **migration up/down**.
- **e2e** — crosses *every* boundary with nothing faked (Playwright: browser → web build → server → DB), split into **smoke** (critical path, pre-merge) and **full** (nightly) per [[0003]].

Two rules disambiguate every case: **crosses the DB ⇒ at least integration, never unit**, and **anything mocked ⇒ not e2e, it's integration**. The integration DB is a real Postgres via testcontainers, not a fake — fidelity is the point of the lane, and migrations are gated pre-merge, so a fake engine would make migration tests meaningless. Runners: **Vitest** (node + jsdom projects per package/app) and **Playwright** (top-level config).

**Acceptance ([[0001]]) and property ([[0004]]) are provenance tags, orthogonal to level.** A scenario acceptance test runs at the lowest level that faithfully proves it — server scenarios → integration, UI/cross-tier scenarios → smoke e2e — and a property runs at unit. The coverage gate ([[0002]]) checks that a covering test *exists*, never its level.

## Considered options

- **Level by folder / by feel** — rejected: it blurs; "crosses the DB" is unambiguous and stable as the repo grows.
- **In-memory / fake DB for the integration lane** — rejected: makes migration tests meaningless and hides SQL divergence.
- **Forcing acceptance tests to be e2e** — rejected: a slow suite that can't run pre-merge.
- **Skipping the web MSW middle lane** — deferred, not rejected: kept thin for now, revisit when the web tier has real logic.

## Consequences

- CI needs Docker for the integration lane; the unit lane stays strictly I/O-free to preserve fast feedback.
- The tooling set is now fixed and gets pinned in the strict `catalog:` (subject to `minimumReleaseAge`): `vitest`, `supertest`, `testcontainers`, `msw`, `@playwright/test`, `fast-check`, `@stryker-mutator/core`.
- Levels map onto the two CI tiers of [[0003]]: unit + integration + smoke e2e + migrations run pre-merge; full e2e + mutation run nightly.
