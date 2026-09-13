---
status: accepted
date: 2026-09-13
---

# Spec↔test coverage gate: scenario-level, delta-scoped, with waivers and dangling-link checks

Every scenario carries an explicit, stable, per-capability id (e.g. `auth-login/S2`), and tests declare the scenario(s) they cover with a `@covers <id>` tag. A checker scans specs and tags to (a) **fail if any scenario touched by the change's delta has no covering test** and (b) **fail if any `@covers` tag points to a scenario that no longer exists** (the dangling-link mirror). Gating is **scenario-level** — a requirement with four scenarios cannot pass on one test — but **delta-scoped**: for MODIFIED requirements only scenarios whose text differs from the current main spec are gated, since carried-over scenarios already have tests. Non-testable scenarios (copy, config, non-functional) are satisfied by an explicit, greppable `[waived: reason]` marker, never a silent pass. The gate checks that a covering test *exists*, not its level — a scenario may legitimately be covered by a unit test. This is the contract half of [[0001]].

## Considered options

- **Requirement-level gating** — rejected: lets untested behaviours slip through a multi-scenario requirement.
- **Title-slug ids** — rejected: they break on rename, so RENAMED deltas would orphan every tag.
- **A hand-maintained map synced at archive** — rejected: it rots and has no enforcement teeth; the map must be generated and checked pre-merge.

## Consequences

- Scenario ids must be unique within a capability and survive the archive fold into main specs.
- RENAME is safe because the id, not the title, is the anchor.
- The checker (coverage + dangling-link + scenario-diff for MODIFIED) is the one piece of net-new tooling we own.
- The blocking check is delta-scoped; `archive` still regenerates the global map so drift across all living specs stays visible ([[0003]]).
- The same gate covers invariants as a second tagged construct ([[0004]]).
