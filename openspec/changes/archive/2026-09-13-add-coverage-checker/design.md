## Context

See proposal.md — Why. The checker is the executable teeth for the coverage gate defined in ADR-0002 and ADR-0004, run pre-merge per ADR-0003. It consumes conventions those ADRs establish: stable per-capability ids (`<capability>/S<n>`, `<capability>/INV<n>`) written as `[S<n>]` / `[INV<n>]` markers in scenario and invariant headers, `@covers`/`@invariant` tags in tests, and `[waived: reason]` markers on spec items. `openspec/specs/` is currently empty; the checker is the first workspace package.

## Goals / Non-Goals

**Goals:**
- A single CLI with two commands — `check` (delta-scoped gate, non-zero on violation) and `map` (global, reporting-only) — that satisfy the spec-test-coverage requirements.
- A parser that is the one place coupled to OpenSpec's markdown shape and our conventions.

**Non-Goals:**
- Enforcing test *level* — provenance is orthogonal to level (ADR-0005); the gate only checks a covering test exists.
- Running tests or measuring their strength — that is the test runner and mutation (ADR-0003), out of scope here.

## Decisions

- **Parse the markdown directly, not `openspec show --json`.** The CLI does not model our `#### Invariant:` construct, `[S<n>]` id markers, or `[waived:]` markers, and MODIFIED-scenario diffing needs the raw scenario text. We parse `openspec/changes/<name>/specs/**` (the delta) against `openspec/specs/**` (main). *Alternative:* consume the CLI's JSON — rejected: it discards exactly the tokens the gate depends on.
- **"Touched" is read from the delta's operation headers.** `## ADDED` → every scenario/invariant gated; `## MODIFIED` → gate only items whose text differs from the main spec (whitespace-normalised comparison, matching OpenSpec's own header-match rule); `## REMOVED`/`## RENAMED` → not gated for coverage but their old ids must no longer be referenced (feeds dangling detection). *Alternative:* git-diff the files — rejected: the operation headers are the authoritative statement of intent.
- **Every gated item must carry an id.** A touched scenario/invariant with no `[S<n>]`/`[INV<n>]` marker is a violation, so the gate cannot be dodged by omitting the id. Ids must be unique within a capability. *(Assumption recorded — reflected as scenario [S16].)*
- **Tag scanning is a line/regex scan of test files, not an AST parse.** `@covers <id>` / `@invariant <id>` anywhere in a test file counts. Test files are discovered by a configurable glob (default `**/*.{test,spec}.{ts,tsx}`, excluding build output). *Alternative:* TypeScript AST — rejected as overkill and language-locked; a regex scan stays cheap and works for any test syntax.
- **Packaging:** a TS/ESM workspace package `packages/spec-test-coverage` exposing an `openspec-coverage` bin, tested with Vitest (ADR-0005). Runtime deps kept minimal — a Markdown/CommonMark parser and a glob matcher — pinned in the strict `catalog:`.
- **`check` is delta-scoped and blocking; `map` is global and advisory.** `check --change <name>` exits non-zero and itemises every uncovered id, dangling reference, and invalid waiver. `map` walks all living specs and exits zero even when items are uncovered.

## Risks / Trade-offs

- Coupling to OpenSpec's markdown format → centralise all parsing in one module and test it against fixtures; the rest of the checker consumes a parsed model.
- Regex tag-scanning can match a tag written in an unexpected place (e.g. a string literal) → accept rare false positives; document that a tag is a covering claim wherever it appears.
- Whitespace-normalised scenario diff will re-gate a genuine reword → this is intended (reworded behaviour deserves a fresh look); only cosmetic whitespace is ignored.
- Ids are author-assigned → the checker enforces uniqueness-within-capability and presence-on-gated-items so drift surfaces as a failure, not a silent gap.
