---
status: accepted
date: 2026-09-13
---

# AWS deployment architecture: Fargate + ALB behind one CloudFront, provisioned with CDK

The static Vite SPA (`apps/web`) and the Express server (`apps/server`) deploy to a **single AWS account** with per-environment CDK stacks (staging, prod). Compute is **ECS Fargate (arm64)** behind an internet-facing **ALB**; a **single CloudFront distribution** per environment fronts both — a private S3 bucket (OAC) for the SPA on the default behaviour, and the ALB on the `/api/*` behaviour — so the app is **same-origin (no CORS)**. Infrastructure is **AWS CDK in TypeScript**, fitting the monorepo. Regional resources run in **`eu-north-1` (Stockholm)** — closest to our Estonian users (~10–20ms vs ~100ms for us-east-1) and keeping data in the EU. TLS/DNS use **Route 53 + ACM** for `good-io.com`. GitHub Actions authenticates to AWS via **OIDC role assumption** (two least-privilege roles, staging and prod), never long-lived keys.

## Considered options

- **App Runner / Lambda** for compute — rejected: chose Fargate for control and portability, accepting more infra to define.
- **Separate domains for web and api (CORS)** — rejected: one CloudFront with an `/api/*` behaviour keeps it same-origin.
- **Terraform / SST** for IaC — rejected: CDK-in-TypeScript matches the codebase.
- **Everything in us-east-1** (so the CloudFront cert is in-stack) — rejected: it puts the origin ~100ms from Estonian users and the data outside the EU. Instead the regional stack is `eu-north-1` and only the CloudFront cert sits in `us-east-1`, referenced cross-region.

## Consequences

- `good-io.com` is not yet in AWS: a Route 53 public hosted zone must be created and the registrar's **NS records delegated** to it — the one manual, non-automatable step. ACM certs are DNS-validated.
- CloudFront requires its viewer cert in **`us-east-1`**, so that cert lives in a dedicated us-east-1 stack and is consumed by the `eu-north-1` stack via `crossRegionReferences`. The ALB's own regional cert stays in `eu-north-1`.
- Single account keeps setup simple; prod blast-radius isolation (a separate account) is a later migration.
- Network posture and release strategy are their own decisions: [[0008]], [[0009]].
