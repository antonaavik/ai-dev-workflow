## Why

The QA regime in ADRs 0001–0005 hinges on a coverage gate with teeth: every scenario and invariant a change touches must have a covering test, or the "spec is the contract" idea is just prose that rots (ADR-0002, ADR-0004). Nothing enforces that today. We need an executable checker so the gate runs in CI as a blocking pre-merge check rather than being aspired to in review.

## What Changes

- New `spec-test-coverage` capability: a CLI, delivered as a workspace package, that parses OpenSpec specs, a change's delta, and `@covers`/`@invariant` tags in test files.
- **Coverage gate** command (`check`): fails when any scenario or invariant *touched by a change's delta* lacks a covering test or an explicit `[waived: reason]`. Scenario-level, delta-scoped — MODIFIED requirements are gated by a scenario-diff against the current main spec, so carried-over scenarios are not re-gated (ADR-0002).
- **Dangling-link** check: fails when any `@covers`/`@invariant` tag points to a scenario/invariant id that no longer exists (ADR-0002).
- **Global map** command (`map`): regenerates a whole-repo spec↔test map from the living specs, for use at `/opsx:archive` (ADR-0002).
- Consumes the stable per-capability id convention (`<capability>/S<n>`, `<capability>/INV<n>`) and the `@covers` / `@invariant` / `[waived: reason]` tag conventions established by ADRs 0001/0002/0004.

## Capabilities

### New Capabilities
- `spec-test-coverage`: verifies the spec↔test coverage gate (delta-scoped scenario/invariant coverage, waivers, dangling-link detection) and regenerates the global spec↔test map.

### Modified Capabilities
<!-- None: openspec/specs/ is empty; this introduces the first capability. -->

## Impact

- New workspace package (e.g. `packages/spec-test-coverage`) exposing an `openspec-coverage` bin; its runtime deps (a Markdown/spec parser, a glob matcher) added to the strict `catalog:` subject to `minimumReleaseAge`.
- Wired into pre-merge CI as a blocking gate (ADR-0003) and invoked at `/opsx:archive` to regenerate the map (ADR-0002).
- Depends on OpenSpec's change/delta and spec file structure (parses `openspec/changes/<name>/specs/**` against `openspec/specs/**`).
- No changes to `apps/*`; the checker itself is covered by its own tests under this regime.
