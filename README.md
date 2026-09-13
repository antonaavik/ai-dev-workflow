# AI Dev Workflow

How we drive work with AI in this repo. The spine is: **understand before building, capture decisions as we go, then implement against a spec.**

## The flow

```
ticket URL ─▶ start-ticket ─▶ grill-with-docs ─▶ /opsx:propose ─▶ /opsx:apply ─▶ /opsx:archive ─▶ push ─▶ PR
               (fetch,        (grilling +         (spec +          (implement     (record &                 (team
                route)         domain-modeling)    tasks)           the tasks)     sync specs)               reviews)

              └─ glossary terms & ADRs captured inline here ─┘   └─ human reads, runs, corrects in-session ─┘
```

The whole chain before the PR is advisory (skills + `AGENTS.md`); the PR review is the only enforced gate.

1. **start-ticket** — Drop a Jira/GitHub/Linear issue URL. It fetches the ticket (comments included), distills it to a one-paragraph proposal, and confirms that reading with you.
2. **grill-with-docs** — Relentless interview to sharpen the plan. Runs two skills together:
   - **grilling** — maps the plan as a design tree, works it in rounds of high-leverage questions (each with a recommendation + reasoning), until nothing is silently assumed.
   - **domain-modeling** — as decisions settle, captures glossary terms in `CONTEXT.md` and records hard-to-reverse trade-offs as ADRs in `docs/adr/`.
3. **/opsx:propose** — Turns the settled understanding into an OpenSpec change: proposal, delta specs, design, task checklist (in `openspec/`). Skip for trivial work.
4. **/opsx:apply** — Implements the change step by step against the task checklist.
5. **/opsx:archive** — When the change is done, records it and folds its delta specs into the living specs under `openspec/specs/` (moving the change into `openspec/changes/archive/`).

## When to use what

- **Have a ticket?** Start at `start-ticket` — it runs the whole chain.
- **Just want to stress-test an idea?** Use `grilling` alone (no docs) or `grill-with-docs` (with docs).
- **Already know what to build?** Jump straight to `/opsx:propose`.
- **Need to think out loud first?** `/opsx:explore`.

## Artifacts this produces

| File | What | Owner |
|------|------|-------|
| `CONTEXT.md` | Project glossary — canonical terms, nothing else | domain-modeling |
| `docs/adr/NNNN-*.md` | Decision records — what & why, for hard-to-reverse calls | domain-modeling |
| `openspec/changes/**` | Change proposals, specs, tasks | OpenSpec |
| `openspec/specs/**` | Living specs, synced from applied changes | OpenSpec |

## Testing

Testing is bound to the workflow stages, not bolted on at the end. Invariants and scenarios are surfaced while grilling; tests are written from the spec, blind, before the implementation; and the only *enforced* gate is CI at the PR.

```
grill-with-docs ─▶ /opsx:propose ────▶ /opsx:apply ──────────────▶ /opsx:archive ─▶ push ──▶ PR
      │                  │              │        │                       │              │
 invariants +       specs +        [red-first]  [implement]       global map      pre-merge CI
 scenarios         contract stubs   scenario &   domain +        regenerated      (BLOCKING):
 surfaced          (NotImplemented) invariant    integration                      unit + integration
 w/ stable ids     — planning only  tests,       code, real DB                    + smoke e2e
 (0001, 0004)      (0001)           run RED      (0005)                           + migration up/down
                                    (0001, 0004)                                  + coverage/dangling
                                         └──── assertion-red ────┘                  check (0002)
                                              for right reason                          │
                                                                                   post-merge (ADVISORY):
                                                                                   full e2e + mutation
                                                                                   (0003)
```

Load-bearing rules (full rationale in `docs/adr/`):

- **The scenario is the contract.** Each `#### Scenario:` / `#### Invariant:` carries a stable id; a test declares what it covers with `@covers`/`@invariant`. ([0001](docs/adr/0001-scenarios-are-the-test-contract.md), [0004](docs/adr/0004-invariants-first-class-and-gated.md))
- **Blind & red-first.** Acceptance and property tests are written from the spec against `NotImplemented` stubs and must fail on an *assertion* — not a compile error, not a vacuous pass — before any implementation. ([0001](docs/adr/0001-scenarios-are-the-test-contract.md))
- **Coverage gate — scenario-level, delta-scoped.** Every scenario/invariant the change touches needs a covering test or a visible `[waived: reason]`; dangling `@covers` tags fail too. ([0002](docs/adr/0002-coverage-gate-scenario-level-delta-scoped.md))
- **Two tiers.** Existence blocks pre-merge (unit + integration + smoke e2e + migration up/down + the coverage check); strength advises post-merge (full e2e + mutation). ([0003](docs/adr/0003-two-tier-test-enforcement.md))
- **Levels by boundary crossed.** unit = no I/O; integration = one owned boundary (real Postgres via testcontainers, or its own HTTP surface); e2e = the whole stack, nothing faked. Acceptance/property are *provenance*, orthogonal to level. ([0005](docs/adr/0005-test-taxonomy-by-boundary.md))

QA of the skills themselves (`claude plugin eval`) is a separate, deferred track. ([0006](docs/adr/0006-skills-qa-is-a-separate-track.md))

## Rule of thumb

Don't write code until the plan is shared and (for non-trivial work) a spec exists. Grilling is the thinking; OpenSpec is the committed artifact.
