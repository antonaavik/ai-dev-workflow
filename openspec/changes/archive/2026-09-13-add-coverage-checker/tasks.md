## 1. Package scaffold

- [x] 1.1 Create `packages/spec-test-coverage` (TS/ESM) with an `openspec-coverage` bin stub that throws `NotImplemented`, and verify `pnpm --filter spec-test-coverage typecheck` passes
- [x] 1.2 Add Vitest and the runtime deps (a CommonMark/Markdown parser, a glob matcher) to the `catalog:` block and reference them as `catalog:`, then verify `pnpm install` succeeds under the age-gate (pick older versions if rejected)
- [x] 1.3 Add fixture specs and fixture test files under `packages/spec-test-coverage/test/fixtures/` covering ADDED, MODIFIED (changed + unchanged scenarios), REMOVED, waivers, dangling tags, and a missing-id item; verify the fixtures load

## 2. Parser (the one module coupled to the markdown format)

- [x] 2.1 Write red tests, tagged `@covers spec-test-coverage/S16`, asserting the parser extracts scenario/invariant ids from `[S<n>]`/`[INV<n>]` markers and flags an item with no id; run red, then implement until green
- [x] 2.2 Implement parsing of `## ADDED/MODIFIED/REMOVED/RENAMED` operation headers into a delta model, and verify unit tests cover each operation
- [x] 2.3 Implement main-spec parsing and a whitespace-normalised scenario/invariant text comparison, and verify tests cover an identical vs a reworded scenario

## 3. Tag scanner

- [x] 3.1 Implement discovery of test files by configurable glob (default `**/*.{test,spec}.{ts,tsx}`, excluding build output) and a line scan for `@covers`/`@invariant <id>`; verify a scan test finds tags and ignores untagged files

## 4. Coverage gate — `check` command (red-first)

- [x] 4.1 Write red tests tagged `@covers spec-test-coverage/S1` and `@covers spec-test-coverage/S2` (covered scenario passes, uncovered scenario fails); run red, then implement the ADDED-requirement gate until green
- [x] 4.2 Write red test tagged `@covers spec-test-coverage/S3` (uncovered invariant fails) and implement invariant gating until green
- [x] 4.3 Write red tests tagged `@covers spec-test-coverage/S4`, `S5`, `S6` (MODIFIED unchanged not gated, MODIFIED changed gated, all ADDED scenarios gated) and implement delta-scoping until green

## 5. Dangling links, waivers, and reporting

- [x] 5.1 Write red tests tagged `@covers spec-test-coverage/S7`, `S8` and implement dangling-reference detection until green
- [x] 5.2 Write red tests tagged `@covers spec-test-coverage/S10`, `S11` and implement waiver handling (empty reason rejected) until green
- [x] 5.3 Write red tests tagged `@covers spec-test-coverage/S12`, `S13` and implement deterministic exit codes and itemised violation output until green

## 6. Global map — `map` command

- [x] 6.1 Write red tests tagged `@covers spec-test-coverage/S14`, `S15` and implement the reporting-only global map (lists covering tests per id, marks uncovered, exits zero) until green

## 7. Self-coverage and wiring

- [x] 7.1 Run `openspec-coverage check --change add-coverage-checker` against this change and verify it exits zero (every scenario S1–S16 covered) — the checker gates itself
- [x] 7.2 Add a blocking pre-merge CI step that runs `openspec-coverage check` for the change (ADR-0003), and verify it fails a branch with an uncovered scenario
- [x] 7.3 Document the `/opsx:archive` hook that runs `openspec-coverage map` to regenerate the global map (ADR-0002), and verify the map file is produced
