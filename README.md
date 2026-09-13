# AI Dev Workflow

How we drive work with AI in this repo. The spine is: **understand before building, capture decisions as we go, then implement against a spec.**

## The flow

```
ticket URL ──▶ start-ticket ──▶ grill-with-docs ──▶ /opsx:propose ──▶ /opsx:apply
                  (fetch)      (grilling + domain-      (spec +          (implement
                               modeling)                tasks)           the tasks)
```

1. **start-ticket** — Drop a Jira/GitHub/Linear issue URL. It fetches the ticket (comments included), distills it to a one-paragraph proposal, and confirms that reading with you.
2. **grill-with-docs** — Relentless interview to sharpen the plan. Runs two skills together:
   - **grilling** — maps the plan as a design tree, works it in rounds of high-leverage questions (each with a recommendation + reasoning), until nothing is silently assumed.
   - **domain-modeling** — as decisions settle, captures glossary terms in `CONTEXT.md` and records hard-to-reverse trade-offs as ADRs in `docs/adr/`.
3. **/opsx:propose** — Turns the settled understanding into an OpenSpec change: proposal, delta specs, design, task checklist (in `openspec/`). Skip for trivial work.
4. **/opsx:apply** — Implements the change step by step against the task checklist. **/opsx:archive** records it when done.

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

## Rule of thumb

Don't write code until the plan is shared and (for non-trivial work) a spec exists. Grilling is the thinking; OpenSpec is the committed artifact.
