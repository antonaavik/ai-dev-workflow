## 1. CDK app scaffold

- [x] 1.1 Create an `infra/` CDK app (TypeScript) and add `infra` to `pnpm-workspace.yaml` packages; verify `pnpm --filter infra typecheck` passes
- [x] 1.2 Add `aws-cdk-lib`, `constructs`, and the CDK CLI + Vitest to the `catalog:` and reference as `catalog:`; verify `pnpm install` succeeds under the age-gate
- [x] 1.3 Define an env config map (account, region us-east-1, hostnames, task size, desired count) and instantiate `AppStack` for `Staging` and `Prod`; verify `cdk synth` produces two stacks

## 2. Server containerization

- [x] 2.1 Add a multi-stage arm64 `Dockerfile` to `apps/server` (pnpm build → slim Node 24 runtime); verify the image builds and `GET /api/health` returns ok in a local container run — _Dockerfile written; `/api/health` verified against the local server. `docker build` NOT run (no Docker in this environment) — validate on first CI build._

## 3. Networking

- [x] 3.1 Add VPC across 2 AZs, public subnets only, IGW, no NAT (ADR-0008); ALB SG (ingress from CloudFront prefix list) and task SG (ingress only from ALB SG)
- [x] 3.2 Write CDK assertion tests tagged `@covers deployment/S5` and `@covers deployment/S6` for the SG rules and health-check wiring; run red, then implement until green

## 4. Server service (ECR + Fargate + ALB)

- [x] 4.1 Add an ECR repository and a Fargate service (arm64) whose task def references the image by digest, env from SSM, with the ECS deployment circuit breaker + rollback enabled
- [x] 4.2 Add the ALB (HTTPS listener, target group health check `GET /api/health`) and a listener rule requiring the secret origin header (403 without it)
- [x] 4.3 Write CDK assertion tests tagged `@covers deployment/S6` (health check), `@covers deployment/S10` (circuit breaker + rollback), and `@covers deployment/S5` (listener rule); run red, then implement until green

## 5. Edge (S3 + CloudFront)

- [x] 5.1 Add a private S3 bucket (OAC) and a CloudFront distribution: default behaviour → S3, `/api/*` → ALB origin over HTTPS, HTTP→HTTPS redirect, and 403/404 → `/index.html` (200)
- [x] 5.2 Write CDK assertion tests tagged `@covers deployment/S1`, `@covers deployment/S2`, `@covers deployment/S3`, `@covers deployment/S4` for the two origins, same-origin routing, SPA fallback, and HTTPS redirect; run red, then implement until green

## 6. DNS / TLS

- [x] 6.1 Add the Route 53 hosted zone for `good-io.com`, an us-east-1 ACM cert for CloudFront and a regional cert for the ALB origin, and alias records for the env hostnames; verify `cdk synth` includes them
- [x] 6.2 Document the one-time manual NS delegation at the registrar in `infra/README.md`; verify the doc names the exact NS records to copy

## 7. Web deploy

- [x] 7.1 Add a step/script that builds `apps/web`, syncs `dist/` to the env S3 bucket, and issues a CloudFront invalidation; verify it uploads to the correct bucket in a dry run — _`scripts/deploy-web.sh` written; `bash -n` clean. `aws s3 sync --dryrun` NOT run (no AWS CLI here) — validate on first deploy._

## 8. Environment isolation

- [x] 8.1 Write a CDK assertion test tagged `@covers deployment/S12` asserting staging and prod produce separate resources/hostnames; run red, then implement until green

## 9. CI/CD pipeline (OIDC, auto-deploy)

- [x] 9.1 Add the GitHub OIDC provider and two least-privilege deploy roles (staging, prod) in CDK, trust scoped to this repo; verify `cdk synth` includes the role trust policy
- [x] 9.2 Extend `.github/workflows` so merge to `main` builds the server image once, pushes to ECR by git-sha digest, deploys staging, smoke-tests staging, then deploys the SAME digest to prod and smoke-tests prod — no manual approval (ADR-0009) — _`deploy.yml` written; wiring verified by the parse test (9.3). The live pipeline runs on first merge to main._
- [x] 9.3 Add a repo test that parses the deploy workflow and asserts the ordering and promotion rules — staging before prod, same digest to both, no approval gate — tagged `@covers deployment/S7`, `@covers deployment/S8`, `@covers deployment/S9`, `@invariant deployment/INV1`; run red, then implement until green

## 10. Smoke test

- [x] 10.1 Add a smoke script that checks the env's HTTPS root and `GET /api/health`, used by both staging and prod deploy jobs; verify it exits non-zero on a bad URL and zero against a healthy one

## 11. Coverage gate

- [x] 11.1 Run `openspec-coverage check --change deploy-aws-cicd` and verify it exits zero — every scenario S1–S12 and INV1 covered by a tagged test or a reviewed `[waived: ...]`; add coverage or a justified waiver for any gap
