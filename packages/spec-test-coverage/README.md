# @dev-workflow/spec-test-coverage

The executable teeth for the spec↔test coverage gate ([ADR-0002](../../docs/adr/0002-coverage-gate-scenario-level-delta-scoped.md), [ADR-0004](../../docs/adr/0004-invariants-first-class-and-gated.md)). It reads OpenSpec specs, a change's delta, and `@covers` / `@invariant` tags in test files.

## Conventions it consumes

- **Ids** — each `#### Scenario:` / `#### Invariant:` carries a stable marker `[S<n>]` / `[INV<n>]`; the full id is `<capability>/<marker>` (e.g. `spec-test-coverage/S1`).
- **Tags** — a test claims coverage with `@covers <id>` (scenarios) or `@invariant <id>` (invariants), anywhere in the file.
- **Waivers** — a spec item annotated `[waived: reason]` on its header satisfies the gate; an empty reason is rejected.

## Commands

```bash
# Blocking pre-merge gate (ADR-0003): every scenario/invariant the change's
# delta touches must be covered or waived, with no dangling tags.
openspec-coverage check --change <name> [--repo <path>] [--tests <path>]

# Reporting-only global map over all living specs. Never fails.
openspec-coverage map [--repo <path>] [--tests <path>]
```

`check` exits non-zero and itemises every uncovered id, dangling reference, and invalid waiver; it exits zero when the delta is fully satisfied. It is delta-scoped: MODIFIED requirements are gated only where a scenario's text differs from the current main spec.

## The `/opsx:archive` hook

Archiving folds a change's delta specs into the living specs under `openspec/specs/`. Right after that sync, regenerate the global spec↔test map so drift across the whole spec set stays visible ([ADR-0002](../../docs/adr/0002-coverage-gate-scenario-level-delta-scoped.md)):

```bash
openspec-coverage map > openspec/coverage-map.txt
```

Because `map` is reporting-only it never blocks the archive; it just records which living-spec scenarios and invariants are covered and which are not.
