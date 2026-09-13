## Context

See proposal.md — Why, and ADRs 0007 (Fargate + ALB + one CloudFront, CDK, single account, OIDC), 0008 (public subnets, no NAT), 0009 (simple auto-deploy). `apps/web` is a Vite SPA (static build), `apps/server` is an Express app exposing `GET /api/health`. Region is **us-east-1** (also where the CloudFront ACM cert must live, avoiding a cross-region cert stack).

## Goals / Non-Goals

**Goals:**
- One CDK app defining the full path for both environments, and a GitHub Actions pipeline that delivers a merge to prod automatically.
- Make every `deployment` spec scenario coverable by a repo test (CDK assertions) or a smoke test, per the coverage gate.

**Non-Goals:**
- RDS/persistence and DB migrations (designed as a slot only).
- Canary/blue-green, alarm-based rollback, WAF rules beyond origin locking, and multi-account isolation (all deferred, ADR-0009).

## Decisions

- **CDK layout.** `infra/` app with a reusable `AppStack` construct instantiated per environment (`Staging`, `Prod`) from a config map (account, region, hostnames, task size, desired count). Env config carries `good-io.com` apex + `www` for prod and `staging.good-io.com` for staging.
- **Edge (one CloudFront per env).** Default behaviour → S3 origin (private, Origin Access Control); `/api/*` behaviour → ALB origin over HTTPS. SPA fallback via CloudFront custom error responses (403/404 → `/index.html`, 200). Route 53 alias records point the hostnames at CloudFront; ACM cert in us-east-1. *(covers S1, S2, S3)*
- **Origin locking.** ALB listener is HTTPS with a regional ACM cert on an origin hostname; the ALB security group ingress is restricted to CloudFront's managed prefix list, and a listener rule requires a secret header that CloudFront injects (stored in SSM, rotatable) — requests without it get 403. *(covers S5)*
- **Server runtime.** Fargate service (arm64) whose task definition references the server image **by digest** from ECR; env/config from SSM Parameter Store. ALB target group health check = `GET /api/health`; deployment configured with the **ECS circuit breaker + rollback**, rolling `minHealthyPercent`/`maxPercent`. *(covers S4 via HTTP→HTTPS redirect on CloudFront/ALB, S6, S10)*
- **Networking (ADR-0008).** VPC across 2 AZs, public subnets only, IGW, no NAT; tasks get public IPs; task SG ingress only from the ALB SG. *(the SG rules are asserted in CDK tests — covers S5, S6)*
- **Web deploy.** Build `apps/web`, sync `dist/` to the env S3 bucket, then a CloudFront invalidation.
- **Pipeline (GitHub Actions, OIDC).** On PR: existing pre-merge gate + `docker build` + `cdk diff` (read-only role). On merge to `main`: build the server image **once**, push to ECR tagged by immutable git-sha digest → deploy staging (update service to the new task def; `cdk deploy` only when infra changed) → **smoke staging** → deploy prod with the **same digest** → **smoke prod**. Two OIDC roles (staging/prod), trust scoped to this repo. *(covers S7, S8, S9, INV1, S12)*
- **Smoke test.** A small script hitting the env's HTTPS root and `/api/health`; reused for staging and prod. Tagged `@covers` for the delivery scenarios it exercises.
- **Coverage strategy (so the gate is satisfiable).** Topology scenarios (S1–S6, S10, S12) → `aws-cdk-lib/assertions` template tests tagged `@covers deployment/S<n>`. Delivery scenarios (S7–S9, INV1) → pipeline/smoke assertions where testable; any that cannot be asserted in-repo (e.g. the GitHub-side promotion wiring) carry a `[waived: verified by pipeline configuration review]` marker rather than a hollow test.
- **Migration slot (not built).** When RDS lands: a pre-promotion ECS **run-task** applies migrations, and migrations MUST be expand/contract (ADR-0009) so auto-rollback stays safe.

## Risks / Trade-offs

- Public-subnet tasks are publicly addressable (ADR-0008) → mitigated by SGs; a CDK assertion test guards the task SG so a regression fails CI.
- Simple auto-deploy trusts a thin staging signal (ADR-0009) → mitigated by circuit-breaker rollback + prod smoke; residual risk accepted until a real e2e suite exists.
- Secret origin header can leak → stored in SSM and rotatable; the CloudFront prefix-list restriction is the second layer.
- `cdk deploy` in the pipeline could make unintended infra changes → routine app rollouts update only the ECS service/task def; infra changes go through `cdk diff` on the PR.
- OIDC trust misconfiguration → scope the role trust policy to this repository (and protect prod role usage to the `main` ref).

## Migration Plan

1. `cdk bootstrap` the account/region; create the Route 53 hosted zone for `good-io.com`; **delegate NS at the registrar** (manual, one-time).
2. Create the GitHub OIDC provider and the two deploy roles.
3. `cdk deploy` staging, then prod; verify DNS/TLS resolve.
4. Enable the pipeline; first merge exercises the full staging→prod path.
- **Rollback:** ECS circuit breaker auto-reverts a failed rollout; manual break-glass is redeploying the previous image digest.

## Open Questions

- Task sizing and `desiredCount` per environment (does not affect the specs or task breakdown; tune after first deploy).
