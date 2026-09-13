# Agent instructions

## Working discipline

Understand before building. Don't jump to code:

- A ticket/issue URL → run **start-ticket**.
- An idea to stress-test → **grilling** (or **grill-with-docs** to also capture glossary/ADRs).
- Non-trivial work → turn the settled plan into an OpenSpec change (`/opsx:propose`) before implementing (`/opsx:apply`). Skip specs only for trivial fixes.

Read `CONTEXT.md` for canonical terms; use them. Check `docs/adr/` before reversing a past decision.

## Dependencies (pnpm workspace, strict catalog)

- pnpm only. Never use npm/yarn.
- `catalogMode: strict` — every dependency version lives in the `catalog:` block of `pnpm-workspace.yaml`. Add/bump versions there, then reference as `"catalog:"` in the package's `package.json`. Don't inline versions.
- `saveExact` + `minimumReleaseAge: 1440` (strict): pins are exact and a version must be ≥1 day old to install. If an install is rejected for age, pick an older version — don't disable the guard.

## Layout

- Apps in `apps/*`, shared libraries in `packages/*`.
- `openspec/` — change proposals, specs, tasks (OpenSpec-managed).
