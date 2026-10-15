# Brandista Mobile

Customer-facing storefront for Brandista, a multi-brand shopping destination for independent Pakistani labels. No SRS file is available in the local repositories. The app follows the documented B0.14 backend contract where routes exist and labels unimplemented surfaces clearly.

## Stack

React, TypeScript, Vite, React Router, ESLint, Prettier and Vitest. Direct dependency versions are pinned and locked. Use Node.js `^22.22.2`, `^24.15.0`, or `>=26.0.0`; these ranges satisfy the current Vite, Vitest and jsdom engine requirements.

## Run locally

```powershell
npm ci
Copy-Item .env.example .env.local # optional; the default API URL is localhost:8080
npm run dev -- --host 127.0.0.1
```

Start MySQL and the backend from the sibling `brandista-mvp` repository first. Open the exact URL printed by Vite. Set `VITE_API_BASE_URL` to the versioned API root, for example `http://localhost:8080/api/v1`. Set backend `CORS_ALLOWED_ORIGINS` to the exact frontend origin (scheme, host and port); `localhost` and `127.0.0.1` are different origins. Never put credentials or tokens in frontend build-time variables. See [the brand demo runbook](./docs/release/BRAND-DEMO-RUNBOOK.md) for the full local sequence.

## Quality checks

```sh
npm run lint
npm run format:check
npm test
npm run build
```

## Routes

- `/` home and API-backed featured discovery
- `/products` public catalogue with keyword, category and price sorting
- `/products/:slug` public product detail
- `/brands` active brand discovery; `/brands/:slug` resolves an active brand and its paginated API-backed catalogue
- `/sign-in`, `/register` call the real email/password API
- `/cart` uses authenticated customer cart endpoints
- `/account` shows identity; `/account/addresses` manages saved addresses, default selection and delivery instructions
- `/checkout` reviews a saved address, current stock and server prices, then places an unpaid COD order
- `/orders` and `/orders/:id` show customer-owned order history and immutable delivery/item snapshots
- `/about` and unmatched paths use explicit informational/not-found content

COD checkout is implemented against the real Spring backend when explicitly enabled by its environment. No online payment or cash collection occurs when placing an order. Product illustrations are CSS artwork, not product photos or actual inventory. Product names/prices come from API responses. Loading, empty and failure states are included.

## API and authentication

`src/api/client.ts` centralizes JSON requests, base URL, bearer header, no-content responses and normalized errors. Endpoint wrappers and DTOs are in `src/api/brandista.ts` and `src/types.ts`. Access tokens are held in application memory only; reload/close clears the token and requires signing in again. Passwords are submitted to the configured API and are not stored. Do not add localStorage token persistence without an explicit security decision. Configure backend `CORS_ALLOWED_ORIGINS` to include the frontend origin.

## Release status

The application uses real API calls for catalogue, identity, addresses and cart paths present in the backend contract. It has no live-data fallback; connection errors remain visible when the API is unavailable. Product artwork is CSS illustration. COD orders, address management and stock revalidation are implemented. Payment gateways and fulfilment/status changes are not implemented. See the [F0.6 integration report](./docs/integration/F0.6-end-to-end-report.md) and [F0.7 readiness report](./docs/release/F0.7-release-readiness-report.md) for verified status.

## F0.1 notes

The visual system uses warm paper, botanical green and clay accents, editorial serif headings, responsive layouts and visible keyboard focus. Google Fonts are progressive enhancement with system fallbacks. Routes reflect implemented backend capabilities; SRS conformance cannot be claimed until the SRS is available.

## Implementation report

See [F0.1-implementation-report.md](./F0.1-implementation-report.md) for verified scope, commands, test results and remaining blockers.

See [QA-01 frontend verification](./docs/qa/QA-01-frontend-verification.md) for route, browser, accessibility and runtime checks.

## Address and COD acceptance

The owner-approved SRS addendum, checkout contract, verification report and manual guide are in the sibling backend repository under docs/requirements, docs/api/CHECKOUT-CONTRACT.md, docs/testing/ADDRESS-CHECKOUT-ACCEPTANCE.md and docs/testing/MANUAL-CHECKOUT-GUIDE.md. Pending submissions retain only their UUID, address ID and review token in sessionStorage; access tokens remain in memory. This supports safe retries after a response is lost. The verified local app is http://127.0.0.1:5176/ backed by MySQL on the dedicated acceptance stack.
