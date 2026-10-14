# Known Limitations

## Release blockers

- No SRS file was available in checked-out or discovered documentation repository; acceptance coverage cannot be confirmed.
- Docker Desktop engine pipe was unavailable during F0.7. The local MySQL/backend stack, app DB credentials, readiness against MySQL and live customer journeys remain unverified.
- Final frontend test/build rerun was blocked after Windows `EPERM` prevented npm from changing locked `node_modules`; baseline test/build results predate final changes.
- No repeatable catalogue seed or admin UI is provided. Brand demos require a trained operator and verified disposable DB setup.
- No checkout, order creation/history, payment, inventory counts/reservation, product variants, or stock-aware cart behavior is implemented.
- No production/staging infrastructure or deployment configuration; public release is not ready.

## Product and security limitations

- Access JWT is kept in frontend memory and expires; reload clears it. No refresh/revocation workflow is implemented.
- Registration email verification and endpoint rate limiting are absent.
- Frontend account identity and saved-address reads exist, but profile and address editing are incomplete.
- Product availability is a publication/availability flag, not live stock. Cart amounts are display values and need checkout revalidation.
- Product artwork is CSS illustration; there is no product image storage/media workflow.
- Existing simple products lack variants and inventory model.
- Broad dependency/container/DAST scanning is not set up. Baseline npm audit found no known advisories, but was not rerun after final changes.
- F0.7 did not run the requested five viewport sizes, browser console/network review, keyboard/accessibility matrix, or live API browser automation.

## Operational limitations

- Local Docker Compose is a development setup, not a production deployment design.
- No domain, TLS, managed database, payment provider, transactional email, monitoring, backup or restore service is configured.
- Demo data and demo credentials are not committed; demo records must be fictional and isolated locally.
