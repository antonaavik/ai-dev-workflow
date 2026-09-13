# deployment

## Purpose

Defines how the web and server apps are served to users (single-origin HTTPS, reachable only through the CDN, health-gated) and how a merge is delivered to production (automated staging→prod promotion of one artifact, with automatic rollback).

## Requirements

### Requirement: Single-origin HTTPS serving
The system SHALL serve the web SPA and the API from a single origin per environment over HTTPS on `good-io.com`, so that browser requests to the app and to `/api/*` are same-origin and require no CORS.

#### Scenario: [S1] the SPA is served over HTTPS
- **WHEN** a browser requests the environment's root URL over HTTPS
- **THEN** the web SPA is returned

#### Scenario: [S2] API requests are same-origin
- **WHEN** the SPA calls a path under `/api/` on the same host
- **THEN** the request reaches the server without any cross-origin request

#### Scenario: [S3] deep links fall back to the app shell
- **WHEN** a client requests a client-side route that is not a static file and not under `/api/`
- **THEN** the app shell (`index.html`) is returned so client-side routing can resolve it

#### Scenario: [S4] plaintext HTTP is not served
- **WHEN** a client connects over plaintext HTTP
- **THEN** it is redirected to HTTPS rather than served over HTTP

### Requirement: The API is reachable only through the CDN
The system SHALL ensure the API server is reachable only through the CDN, so that the load balancer's own address cannot be used to bypass the CDN (and any protections attached to it).

#### Scenario: [S5] direct load-balancer access is refused
- **WHEN** a request reaches the load balancer without the CDN's identifying credentials
- **THEN** it is refused rather than forwarded to the server

### Requirement: Health-gated serving
The system SHALL route user traffic only to server instances that pass a health check on `GET /api/health`.

#### Scenario: [S6] an unhealthy instance receives no traffic
- **WHEN** a server instance fails the `GET /api/health` check
- **THEN** it is not sent user traffic until it is healthy

### Requirement: Automated staging-to-production delivery
The system SHALL, on merge to `main`, deploy the built artifact to staging, run a smoke test against the staging URL, and — only if that smoke test passes — automatically promote the same artifact to production without manual approval.

#### Scenario: [S7] a merge deploys to staging
- **WHEN** a change is merged to `main`
- **THEN** its built artifact is deployed to the staging environment and smoke-tested

#### Scenario: [S8] a green staging smoke auto-promotes to prod
- **WHEN** the staging smoke test passes
- **THEN** the same artifact is deployed to production with no manual approval step

#### Scenario: [S9] a red staging smoke blocks prod
- **WHEN** the staging smoke test fails
- **THEN** production is not deployed

#### Invariant: [INV1] production only runs staging-validated artifacts
- **WHEN** any artifact is running in production
- **THEN** that exact artifact previously passed the staging smoke test (production builds are promoted, never rebuilt)

### Requirement: Automatic rollback on failed rollout
The system SHALL automatically roll a deployment back to the previously running version when the new instances fail their health checks, in either environment.

#### Scenario: [S10] a failed rollout is rolled back
- **WHEN** a deployment's new instances fail their health checks
- **THEN** the environment is automatically returned to the previously running version

### Requirement: Separate staging and production environments
The system SHALL run staging and production as separate environments with distinct URLs and isolated resources, so that staging activity cannot affect production.

#### Scenario: [S12] environments are isolated
- **WHEN** the staging environment is deployed to or fails
- **THEN** the production environment is unaffected and reachable at its own URL
