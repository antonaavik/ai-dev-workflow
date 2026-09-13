---
status: accepted
date: 2026-09-13
---

# Continuous deployment to production, all-at-once, health-check rollback only

On merge to `main` the pipeline builds one image, deploys it to staging, runs a smoke test against the staging URL, and — if green — **automatically promotes the same image digest to production with no human approval**. Rollout safety rests on the **ECS deployment circuit breaker** (auto-rollback to the last good task definition when new tasks fail ALB health checks) plus a **post-deploy smoke test** against the prod URL. This is deliberately the simplest automated form: no canary, no traffic-shifting, no alarm-based rollback.

## Considered options

- **Manual prod approval** (GitHub Environment reviewers) — rejected: the team wants a fully automated flow now.
- **Canary / blue-green with alarm-based auto-rollback** — deferred: more scope, and only worthwhile once a real e2e suite and prod alarms exist ([[0003]] strength tier).

## Consequences

- Prod confidence equals the staging signal, which is currently thin (health-level smoke; server code not yet tested) — an **accepted risk**. Strengthening the signal raises the value of auto-deploy.
- **Hard precondition once RDS lands:** migrations MUST be **expand/contract (backward-compatible)**, or an auto-rollback will hit a schema the previous image cannot read. Non-backward-compatible migrations are incompatible with this posture.
- The **same image digest** is promoted staging→prod (never rebuilt), so prod runs exactly what staging validated; a one-command redeploy of the previous digest is the manual break-glass.
- Graduating to canary + alarm-based rollback is the recommended next step, and is a pipeline enhancement rather than a redesign.
