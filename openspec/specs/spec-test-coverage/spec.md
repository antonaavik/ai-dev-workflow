# spec-test-coverage

## Purpose

Verifies the spec↔test coverage gate for a change — that every scenario and invariant the change touches is covered by a test or an explicit waiver — and regenerates a global spec↔test map for archiving.

## Requirements

### Requirement: Coverage gate over touched scenarios and invariants
The checker SHALL provide a `check` command that fails when any scenario or invariant introduced or changed by a change's delta has neither a covering test (a test tagged `@covers <id>` or `@invariant <id>`) nor an explicit `[waived: reason]` marker on the spec item. Coverage is satisfied by the *existence* of a covering test at any level; the checker SHALL NOT require a particular test level.

#### Scenario: [S1] touched scenario with a covering test passes
- **WHEN** a change's delta adds scenario `spec-test-coverage/S9` and a test file contains `@covers spec-test-coverage/S9`
- **THEN** `check` reports that scenario as covered and does not fail on it

#### Scenario: [S2] touched scenario with no covering test fails
- **WHEN** a change's delta adds scenario `spec-test-coverage/S9` and no test tags it and it carries no waiver
- **THEN** `check` fails and names `spec-test-coverage/S9` as uncovered

#### Scenario: [S3] touched invariant with no covering test fails
- **WHEN** a change's delta adds invariant `spec-test-coverage/INV1` and no test tags it with `@invariant` and it carries no waiver
- **THEN** `check` fails and names `spec-test-coverage/INV1` as uncovered

#### Scenario: [S16] a touched item without an id is a violation
- **WHEN** a change's delta adds a scenario that carries no `[S<n>]` id marker
- **THEN** `check` fails and reports that the touched item has no id, so it cannot be dodged by omission

### Requirement: Delta scoping by scenario-diff
The checker SHALL gate only the scenarios and invariants that the delta changes. For ADDED requirements it SHALL gate every scenario and invariant. For MODIFIED requirements it SHALL gate only those whose text differs from the current main spec, determined by comparing each delta item against its counterpart in `openspec/specs/`; items whose text is unchanged SHALL NOT be gated.

#### Scenario: [S4] unchanged scenario in a MODIFIED requirement is not gated
- **WHEN** a MODIFIED requirement restates a scenario whose text is identical to the current main spec, and that scenario has no new test
- **THEN** `check` does not fail on that scenario

#### Scenario: [S5] changed scenario in a MODIFIED requirement is gated
- **WHEN** a MODIFIED requirement restates a scenario with text that differs from the current main spec, and that scenario has no covering test or waiver
- **THEN** `check` fails and names that scenario as uncovered

#### Scenario: [S6] every scenario of an ADDED requirement is gated
- **WHEN** a delta adds a requirement with three scenarios and only one is tagged by a test
- **THEN** `check` fails and names the two untagged scenarios as uncovered

### Requirement: Dangling-link detection
The checker SHALL fail when a `@covers` or `@invariant` tag in a test references a scenario or invariant id that does not exist in the specs, so that removed or renamed items cannot leave tests pointing at nothing.

#### Scenario: [S7] tag pointing at a removed id fails
- **WHEN** a test contains `@covers spec-test-coverage/S99` and no scenario with id `spec-test-coverage/S99` exists in any spec
- **THEN** `check` fails and names `spec-test-coverage/S99` as a dangling reference

#### Scenario: [S8] a valid tag is not reported as dangling
- **WHEN** every `@covers`/`@invariant` tag in the tests resolves to an existing spec id
- **THEN** `check` reports no dangling references

### Requirement: Waivers satisfy the gate
The checker SHALL treat a scenario or invariant marked `[waived: <reason>]` as satisfying the coverage gate, and SHALL reject a waiver whose reason is empty so that waiving is always deliberate and reviewable.

#### Scenario: [S10] a waived scenario passes the gate
- **WHEN** a touched scenario carries `[waived: rendered copy, no logic to test]` and has no covering test
- **THEN** `check` treats it as satisfied and does not fail on it

#### Scenario: [S11] a waiver with an empty reason is rejected
- **WHEN** a touched scenario carries `[waived: ]` with no reason text
- **THEN** `check` fails and names that scenario as an invalid waiver

### Requirement: Deterministic exit status and reporting
The `check` command SHALL exit non-zero when any violation is found and exit zero when the gate is fully satisfied, and it SHALL list every offending id (uncovered, dangling, or invalid waiver) so a CI log identifies exactly what to fix.

#### Scenario: [S12] a clean change exits zero
- **WHEN** every touched scenario and invariant is covered or waived and no tag is dangling
- **THEN** `check` exits with status zero

#### Scenario: [S13] any violation exits non-zero and is itemised
- **WHEN** the change has two uncovered scenarios and one dangling tag
- **THEN** `check` exits non-zero and its output names all three offending ids

### Requirement: Global spec↔test map generation
The checker SHALL provide a `map` command that emits, over all living specs under `openspec/specs/`, a mapping from each scenario and invariant id to the tests that cover it, marking any id with no covering test as uncovered. The `map` command SHALL be reporting-only and SHALL NOT fail on uncovered items.

#### Scenario: [S14] the map lists covering tests per id
- **WHEN** `map` runs against the living specs and tagged tests
- **THEN** its output associates each scenario and invariant id with the test tags that cover it

#### Scenario: [S15] uncovered ids appear in the map without failing
- **WHEN** a living-spec scenario has no covering test
- **THEN** `map` lists that scenario as uncovered and still exits zero
