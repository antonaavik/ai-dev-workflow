---
status: accepted
date: 2026-09-13
---

# Fargate tasks in public subnets with no NAT gateway

To minimise cost, ECS tasks run in **public subnets with public IPs** and egress through the Internet Gateway (for ECR pulls and SSM), rather than in private subnets behind a **NAT gateway** (~$32/mo per AZ plus data). Isolation is preserved by security groups: the task SG accepts inbound **only from the ALB SG**, and the ALB SG accepts inbound **only from CloudFront** (its managed origin-facing prefix list plus a secret origin header CloudFront injects). So the tasks are not internet-reachable despite having public IPs, and the ALB cannot be bypassed. This is part of [[0007]].

## Considered options

- **Private subnets + NAT** — rejected for now on cost; it is the hardening path if the isolation posture needs to improve.

## Consequences

- Tasks are publicly addressable (SG-restricted, not internet-reachable) — an accepted trade of isolation for cost, and the reason this is worth recording.
- A future RDS instance goes in a **private/isolated subnet** and is reached intra-VPC, so it needs no NAT — the no-NAT choice does not block the database.
- If this later moves to private subnets, VPC endpoints (ECR, S3, SSM, logs) replace IGW egress.
