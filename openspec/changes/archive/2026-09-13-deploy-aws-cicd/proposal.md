## Why

The workflow prescribes a testing regime (ADRs 0001–0006) but has no delivery: `apps/web` and `apps/server` are not deployed anywhere and CI has no CD half. This change deploys both to AWS behind a fully automated pipeline so a merge reaches users, closing the "D" gap. The architecture and its trade-offs are fixed in ADRs 0007 (Fargate + ALB + one CloudFront, CDK), 0008 (public subnets, no NAT), and 0009 (simple auto-deploy to prod).

## What Changes

- New `deployment` capability: the observable contracts for how the apps are **served** and **delivered**.
- Serve the SPA and the API from a **single origin over HTTPS** on `good-io.com` (staging and prod hostnames) — same-origin, no CORS.
- The API server is reachable **only through the CDN**, never directly.
- Automated pipeline: merge to `main` → deploy **staging** → smoke → **auto-promote the same build artifact to prod** → smoke, with **no manual approval** (ADR-0009).
- Rollout safety: a deploy whose new instances fail health checks is **automatically rolled back**, and prod never receives a build that failed its staging smoke test.
- Infrastructure as AWS CDK (TypeScript), single account, per-environment stacks; GitHub Actions authenticates via OIDC (design detail, ADR-0007/0008).
- RDS Postgres and a migration step are a **designed slot, not built here**; the expand/contract precondition (ADR-0009) is recorded for when it lands.

## Capabilities

### New Capabilities
- `deployment`: how the web and server apps are served (single-origin HTTPS, CDN-only reachability, health-gated) and delivered (automated staging→prod promotion with rollback).

### Modified Capabilities
<!-- None. -->

## Impact

- New `infra/` CDK app (TypeScript) and a multi-stage `Dockerfile` for the server; AWS resources: Route 53 hosted zone, ACM certs, CloudFront, S3, ALB, ECS Fargate, ECR.
- `.github/workflows/` gains deploy jobs that extend the existing pre-merge CI.
- New catalog dependencies: `aws-cdk-lib`, `constructs`, and the CDK CLI.
- One manual, one-time step: delegate `good-io.com` NS records at the registrar to the Route 53 hosted zone.
- No `apps/*` behavior changes required; `GET /api/health` already exists for the health check. A `Dockerfile` and container-friendly config are added to `apps/server`.
