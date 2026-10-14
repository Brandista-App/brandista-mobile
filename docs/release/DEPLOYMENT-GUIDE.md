# Deployment Guide (Preparatory)

No staging or production deployment target is configured in the repositories. Deployment is **BLOCKED / NOT RUN** until an environment, operator, secrets, network policy, database, HTTPS endpoints and recovery ownership are selected. This guide does not authorize public deployment.

## Frontend build

The frontend is React/TypeScript/Vite. Build-time `VITE_API_BASE_URL` is public configuration embedded in static assets; it must not contain a secret. Use the environment's HTTPS API root ending in `/api/v1`, then run `npm ci` and `npm run build`. Publish `dist/` to a static host configured to serve `index.html` for client-side routes. Verify nested route refresh and asset paths on the chosen host. The backend CORS allowlist must contain the exact deployed frontend origin.

## Backend and database

Backend uses Java 21, Spring Boot 3.5, MySQL 8.4, Flyway V1–V7, and a Dockerfile. Supply datasource URL/user/password, server port, JWT issuer/audience/TTL/key, and allowed CORS origins through a managed secret/config system. JWT key material must meet application validation and rotate through an approved process. Do not use the development Compose port mappings or example credentials as production configuration. Compose is for local development; it publishes MySQL only on loopback and is not a production orchestration design.

Flyway migrations run on app startup. Review the pending schema migration and take a database backup before production upgrade. There are no destructive automatic rollback migrations; recovery requires a tested database restore and compatible application rollback plan. Prove backup restore before launch and assign an owner/retention policy.

## Runtime operations

- Terminate TLS at the approved ingress; use HTTPS for browser/API traffic and encrypted DB connections where supported by the selected provider.
- Monitor `GET /actuator/health/liveness` for process health and `/actuator/health/readiness` for DB readiness. Both expose status only. Configure external monitoring and alert ownership; none is provisioned here.
- Collect application, ingress and database logs with access controls and retention; never log passwords, tokens or request credentials.
- Restrict database network access to backend workloads and keep backups separate from the service account.
- Set exact frontend CORS origin(s). No wildcard is appropriate for deployment.

## Required environment values

Backend requires database URL, database username/password, signing key, JWT issuer/audience and allowed frontend origins; server port may be set per platform. Use the exact names and validation in `application.yml` / `.env.example`. Frontend requires `VITE_API_BASE_URL` at build time. `.env.example` is a local template only; actual values belong in the environment's secret store.

## External work still required

Choose hosting, domain/DNS, TLS certificates, managed MySQL, network/security controls, secret management, logging/monitoring, backups and restore ownership. Product requirements also need decisions for payment, order processing, inventory, email verification and support operations before the application can be a production marketplace. None were provisioned or tested in F0.7.
