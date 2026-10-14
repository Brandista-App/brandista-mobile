# Brandista Local Brand Demo Runbook

This is a repeatable local-only procedure. The repository has no committed seed data, so a product catalogue must be prepared by an operator using the existing admin API on a disposable isolated database. There is no checkout or payment demo.

## Prerequisites

- Java 21, Docker Desktop with Linux containers/Compose, Node.js in the supported package engine range (`^22.22.2`, `^24.15.0`, or `>=26.0.0`).
- Both sibling repositories: `brandista-mvp` backend and `brandista-mobile` frontend.
- Confirm the demo data is disposable. Do not point this procedure at a shared, staging, or production database.

## Start an isolated local backend

In the backend repository, copy `.env.example` to `.env.demo` (ignored by Git) and edit it locally. Use unique local-only DB credentials, a fresh random Base64 JWT key (at least 32 decoded bytes), demo database/user names, and ports not used elsewhere, for example MySQL host port `3310`, backend host port `8082`. Keep Compose's internal database URL at `mysql:3306`. Set `CORS_ALLOWED_ORIGINS=http://127.0.0.1:5173` after verifying the actual Vite origin.

Start and verify:

```powershell
docker compose --env-file .env.demo -p brandista-demo up --build -d
docker compose --env-file .env.demo -p brandista-demo ps
Invoke-RestMethod http://localhost:8082/actuator/health/liveness
Invoke-RestMethod http://localhost:8082/actuator/health/readiness
```

Expect `UP` for both; readiness includes DB connectivity. Compose project name `brandista-demo` creates its own named volume, separate from the default project. The procedure is not yet runtime-verified on this workstation because Docker Desktop's engine was unavailable.

### Prepare demo catalogue

No seed mechanism exists. On this disposable database only, have an authorized operator create a dedicated admin identity via the supported registration flow, then grant the admin role using a MySQL client connected explicitly to this isolated Compose database. Verify `SELECT DATABASE()` is the demo database before any role change. Do not run this SQL against any other database. Product/brand/category management uses the existing `/api/v1/admin/**` API; consult the backend README for current request schemas and use fictional brands/products with clearly labeled sample content and PKR prices. There is no packaged or verified seed loader. If the operator cannot verify the database identity and admin API setup, stop and demo only the empty/error states.

Create a customer demo account through the app's registration page with a disposable email and locally chosen password; do not write the credentials into this document or source control. Registration supports customer accounts, not admin accounts.

## Start the frontend

In `brandista-mobile`, create `.env.local` from `.env.example` if needed and set:

```dotenv
VITE_API_BASE_URL=http://localhost:8082/api/v1
```

Install and run:

```powershell
npm ci
npm run dev -- --host 127.0.0.1
```

Use the exact origin Vite prints. If it chooses another port because 5173 is occupied, update backend `CORS_ALLOWED_ORIGINS` and restart backend/frontend. `127.0.0.1` and `localhost` do not share CORS origin. Do not put credentials or JWTs in Vite environment values.

## 5–10 minute sequence

1. **Welcome (1 min):** open homepage, describe one discovery surface for multiple independent brands.
2. **Discover (2 min):** browse brands and published products; try implemented keyword, category and price sorting controls. If catalogue is empty, explain there are no seeded records and show the clear empty state.
3. **Product (1 min):** open a product detail and describe the API-provided brand/name/PKR price. CSS artwork is illustrative, not a product photo.
4. **Account (1 min):** register/sign in with the disposable demo customer account. Access tokens live in memory; after reload, sign in again.
5. **Cart (2 min):** add a currently available product; change quantity and remove it. Point out totals are server-calculated display amounts, not a locked checkout quote.
6. **Wrap (1 min):** mention saved address API support if available for the account. State plainly that checkout, order creation/history, payment, stock reservation and real brand partnerships are not implemented.

Talking point: the implemented MVP connects discovery across brands with a single customer identity and persistent multi-brand cart. It is not yet a transactional marketplace; no real payment or order completion should be demonstrated.

## Stop and reset

Stop while preserving the demo DB:

```powershell
docker compose --env-file .env.demo -p brandista-demo down
```

Only when the operator has confirmed this project contains disposable demo data and has rechecked the project name/database, reset it with:

```powershell
docker compose --env-file .env.demo -p brandista-demo down -v
```

That removes the `brandista-demo` volume. Never substitute the default project or run against shared/production data. This reset command is documented, not executed during F0.7.

## Troubleshooting / pre-demo

- Docker pipe missing: start Docker Desktop and verify `docker info`; do not claim service health until both health requests return `UP`.
- Backend not ready: inspect `docker compose ... ps` and redacted `docker compose ... logs --tail 150 mysql backend`; verify DB names/user/password match the fresh demo volume. Do not delete volumes to fix a credential mismatch.
- CORS error: compare the browser origin exactly to `CORS_ALLOWED_ORIGINS`; restart backend after config change.
- API unreachable: check backend URL, published port, and readiness before launching the frontend.
- Empty catalogue: publish demo items via authorized admin setup; no automatic fixtures are included.
- Final check: verify demo project/database; backend liveness/readiness UP; frontend opens; catalogue has clearly fictional records; customer login and cart operations work; no real account/data; explain no checkout or payment.
