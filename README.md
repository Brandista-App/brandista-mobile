# Brandista Mobile

Customer-facing web foundation for Brandista, a multi-brand shopping destination for independent Pakistani labels. The designated `brandista-mobile` repository was empty at F0.1 start; no SRS or prior frontend implementation was available. This app uses the real B0.14 backend contract where routes exist and labels unimplemented surfaces clearly.

## Stack

React, TypeScript, Vite, React Router, ESLint, Prettier and Vitest. React and TypeScript provide a compact component model with checked API data shapes; Vite keeps local setup and production builds simple. Node.js 20.19+ or 22.12+ is recommended.

## Run locally

```sh
npm install
Copy-Item .env.example .env.local # PowerShell; optional with the local backend default
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`). Set `VITE_API_BASE_URL` to the API root including version, e.g. `http://localhost:8080/api/v1`. The backend CORS allow-list must include the exact frontend origin, e.g. `http://localhost:5173`. Never put credentials or tokens in frontend build-time variables.

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
- `/brands` active brand discovery; `/brands/:slug` is temporary because the backend has no brand detail endpoint
- `/sign-in`, `/register` call the real email/password API
- `/cart` uses authenticated customer cart endpoints
- `/account`, `/account/addresses` show identity and saved addresses; profile/address editing is a later milestone
- `/about` and unmatched paths use explicit informational/not-found content

Checkout is intentionally unavailable because no backend checkout contract exists. Product illustrations are CSS artwork, not product photos or actual inventory. Product names/prices come from API responses. Loading, empty and failure states are included.

## API and authentication

`src/api/client.ts` centralizes JSON requests, base URL, bearer header, no-content responses and normalized errors. Endpoint wrappers and DTOs are in `src/api/brandista.ts` and `src/types.ts`. Access tokens are held in application memory only; reload/close clears the token and requires signing in again. Passwords are submitted to the configured API and are not stored. Do not add localStorage token persistence without an explicit security decision. Configure backend `CORS_ALLOWED_ORIGINS` to include the frontend origin.

## F0.1 notes

The visual system uses warm paper, botanical green and clay accents, editorial serif headings, responsive layouts and visible keyboard focus. Google Fonts are progressive enhancement with system fallbacks. No SRS was present, so routes reflect implemented backend capabilities rather than claiming SRS conformance. Live integration depends on the MySQL credential issue recorded in B0.14.

## Implementation report

See [F0.1-implementation-report.md](./F0.1-implementation-report.md) for verified scope, commands, test results and remaining blockers.

See [QA-01 frontend verification](./docs/qa/QA-01-frontend-verification.md) for route, browser, accessibility and runtime checks.
