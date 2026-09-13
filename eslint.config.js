import antfu from '@antfu/eslint-config'

// https://github.com/antfu/eslint-config
// Formatting is handled by ESLint Stylistic (built in) — no Prettier.
// `formatters` is intentionally left off so no Prettier/dprint pass is added.
export default antfu({
  stylistic: true,
  typescript: true,
  // React rules for the web app. Only apps/web contains JSX/hooks, so the
  // preset is effectively scoped there; the Express server triggers none of it.
  react: true,
  // CDK synth output is a generated build artifact.
  ignores: ['**/cdk.out/**'],
}).override('antfu/pnpm/pnpm-workspace-yaml', {
  rules: {
    // antfu's default here also enforces `trustPolicy: no-downgrade`, which
    // this repo cannot satisfy: the pinned @types/node pulls undici-types with
    // no provenance, so pnpm refuses to install under that policy. Enforce only
    // the two settings that are compatible with our dependency tree.
    'pnpm/yaml-enforce-settings': ['error', {
      settings: {
        minimumReleaseAgeExcludePrune: true,
        shellEmulator: true,
      },
    }],
  },
}).append({
  // CDK constructs register with their scope as a side effect of `new`, so the
  // no-new rule (which assumes `new` without assignment is a mistake) does not apply.
  files: ['infra/**/*.ts'],
  rules: {
    'no-new': 'off',
  },
})
