# infra

AWS CDK app that deploys `apps/web` and `apps/server` per ADRs [0007](../docs/adr/0007-aws-deployment-architecture.md)–[0009](../docs/adr/0009-continuous-deployment-to-prod.md).

Stacks (single account, region `eu-north-1`; the CloudFront cert is provisioned in `us-east-1` and referenced cross-region):

- **Core** — the shared Route 53 hosted zone for `good-io.com`, the ECR image repository, and the GitHub OIDC provider + staging/prod deploy roles.
- **Staging**, **Prod** — one CloudFront distribution each (S3 default behaviour + `/api/*` → ALB), a Fargate service, networking, and DNS/TLS records.

## Commands

```bash
pnpm --filter infra synth           # synthesize all stacks
pnpm --filter infra test            # CDK assertion tests
pnpm --filter infra exec cdk deploy Core
pnpm --filter infra exec cdk deploy Staging -c imageTag=<git-sha> -c originSecret=<secret>
```

## One-time manual step: delegate DNS

`good-io.com` is registered outside AWS, so after deploying **Core** you must point the domain at the Route 53 hosted zone it created — this is the single step the pipeline cannot automate:

1. Deploy Core: `pnpm --filter infra exec cdk deploy Core`.
2. Read the zone's four name servers: `aws route53 get-hosted-zone --id <zone-id>` (the `DelegationSet.NameServers`), e.g.
   - `ns-123.awsdns-12.com`
   - `ns-456.awsdns-45.net`
   - `ns-789.awsdns-78.org`
   - `ns-012.awsdns-01.co.uk`
3. At the current registrar for `good-io.com`, replace the domain's NS records with those four values.
4. Wait for propagation, then deploy `Staging`/`Prod`; ACM DNS validation and the alias records resolve automatically thereafter.

Until delegation completes, ACM certificate validation (and therefore the CloudFront/ALB deploys) will not finish.
