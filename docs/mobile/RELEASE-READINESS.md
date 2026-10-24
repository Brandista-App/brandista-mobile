# FINAL-001 release readiness

2026-10-24 · Brand-presentation candidate, not a commercial launch.

## Current implementation

The default journey is a bundled offline showcase. It includes three fictional brands, six illustrative products, PKR prices, options, local search/category and brand filtering, a device-local demo bag and a two-step explicitly simulated COD checkout. No demo HTTP mutation exists. Demo storage uses its own key and is never read by live adapters. Every fresh process starts in showcase mode, including after closing the app. Saved real customer sessions remain in their existing endpoint-scoped SecureStore namespace.

Original ImageGen illustrations are bundled alongside the unchanged approved logo. Tab icons are native shapes without downloadable fonts. Live screens retain the existing API adapters, secure session handling, checkout quote and persisted idempotency key protections. A live catalogue reachability check gates the switch; failed live checkout cannot become simulated checkout. A persistent live banner returns to the showcase.

## Audit of four repositories

Audited mobile main e55c75d, backend 4c7d09c (V1–V14), admin contracts and merchant/order screens, customer frontend contracts and checkout, SRS addendum, CI workflows and historical acceptance reports. Earlier B0.14/F0.8 reports predate checkout and must not describe current capabilities. Status **IMPLEMENTED** means code and contract exist, **VERIFIED** requires specified test evidence, **INCOMPLETE** means a material capability is absent, **BLOCKED** means deployment/device/operational evidence is missing.

| Capability | Classification | Evidence / limit |
| --- | --- | --- |
| Registration, login | IMPLEMENTED | Mobile auth forms/adapters; backend registration/login integration tests |
| Profile | INCOMPLETE | Account identity and addresses exist; general profile editing is absent |
| Brands, categories, listing, detail, search/filter | IMPLEMENTED | Existing mobile routes, ProductDiscoveryIntegrationTests; bundled showcase equivalent |
| Product variants | INCOMPLETE live | Showcase options exist; live contract has no SKU/variant order model |
| Cart, addresses, COD, confirmation, history | IMPLEMENTED | Existing adapters and CheckoutIntegrationTests; historical TEST-002 real isolated MySQL acceptance |
| Session persistence | IMPLEMENTED | Endpoint-scoped SecureStore and expiry handling; native-device acceptance outstanding |
| Super administrator, onboarding, brand management | IMPLEMENTED | Platform grants, invitation and membership APIs; admin UI contracts |
| Brand administrator/catalogue/inventory | IMPLEMENTED | Assigned-brand endpoints and MerchantIsolationIntegrationTests |
| Merchant orders/RBAC | IMPLEMENTED | Brand-scoped fulfillment APIs, MerchantOrderIntegrationTests; separate immutable financial order |
| Migrations | IMPLEMENTED | V1–V14, historical TEST-002 MySQL migration PASS |
| Auth/authorization | IMPLEMENTED | Current DB grant/membership checks; owner-only customer resources |
| Cross-brand order/inventory/idempotency | IMPLEMENTED | Atomic placement and stock decrement; checkout regression tests |
| Error handling/health/Docker | IMPLEMENTED | Existing API error contract, readiness/liveness and loopback-bound Compose |
| Public backend availability/live device checkout | BLOCKED | No approved reachable public environment established by repository evidence |
| Physical device acceptance of this APK | BLOCKED | No current device test evidence; AND-021 is historical only |
| Production launch | BLOCKED | Hosting, operational acceptance, dependency risk decision, approved production signing |

Current-run validation and build links are recorded below after execution. Historical TEST-002 reports 190 backend tests, 65 mobile tests and real host-adapter/MySQL customer journeys; those are prior evidence, not a new physical-device PASS.

## FINAL-001 validation

| Check | Result |
| --- | --- |
| Mobile Jest | VERIFIED: 72 tests, 14 suites; offline startup, option/cart persistence, simulated checkout, unavailable/unconfigured live service and existing session/idempotency regression |
| Mobile TypeScript and ESLint | VERIFIED: pass |
| Expo SDK compatibility | VERIFIED: dependencies aligned; SDK58/RN0.88 retained |
| Expo Doctor | VERIFIED: 20/20 |
| Clean mobile installation / Android export | VERIFIED in hosted quality workflow; final build evidence follows |
| Backend automated HTTP/integration tests | VERIFIED: 190 tests, no failures/errors/skips, Java21 |
| Admin clean installation, typecheck, lint, tests, production build | VERIFIED: 148 tests, 5 suites; passes |
| Customer web clean installation, lint, tests, production build | VERIFIED: 69 tests, 7 suites; passes |
| Full / production npm security audit | Both fail: 5 high package entries, 0 critical; see FINAL-001-SECURITY.md |
| Current public-backend end-to-end | BLOCKED: approved reachable environment absent |
| Current physical Android / emulator startup and UI | NOT RUN: no connected device or installed Android SDK/emulator established on this host |

Current backend tests verify customer auth, catalogue, cart, addresses/COD/history, ownership, privileged grant and brand-member boundaries, stock and fulfillment rules. This establishes automated integration coverage, not operational or real-device certification. General profile editing, live product variants and live product photography remain INCOMPLETE as described above.

Local raw evidence is retained at `D:\Brandista Workplace\FINAL-001-evidence`; secrets and generated dependency/build directories are not committed. Backend application source, migrations, admin and customer web source remain unchanged. A separate undeployed production-like deployment template is prepared in backend PR #27; all working checkouts are clean after commits.

Browser layout QA exercised the actual showcase React components with temporary React Native Web, router, image and storage adapters outside the repository. Search → option selection → bag → two-step simulated checkout → explicit no-purchase confirmation, fictional brand storefront filtering and unavailable-service messaging were observed. It caught and corrected retained scroll offsets and oversized quantity controls. Screenshots are retained in the evidence directory. This does **not** test the native Router, SecureStore, Android lifecycle or physical device.

## Artifact provenance

Final runtime source: `ab3c266` on `codex/final-001-showcase`. [Signed universal build, verification and downloadable artifact](https://github.com/Brandista-App/brandista-mobile/actions/runs/40027697735). The artifact is uploaded only after release compilation, native ELF ABI inspection, embedded bundle, certificate, non-debuggable manifest, network security and bundled image checks pass. It includes `apk-sha256.txt`, `apk-metadata.txt`, `signing-report.txt`, `native-libraries.json` and `build-evidence.txt`. Check the actual run conclusion and checksum when downloading; this document alone does not establish a successful build or device launch. Later documentation-only commits do not change that APK source.

GitHub repository variables and deployment-environment listings for mobile and backend were empty during FINAL-001 inspection; no approved public backend was established. Do not interpret the internally configured reserved `.invalid` sentinel as a service deployment. Existing deployment templates remain preparation only.

## Security and deployment gates

Existing internal signing only; no production key, privileged account creation, public tunnel, paid deployment or Play publishing. Android permissions remain restricted; production HTTPS policy is preserved. No secrets are embedded. Backend deployment remains explicitly unavailable in the presentation build; the reserved `.invalid` sentinel is inherited build configuration and never contacted by the showcase/live availability gate.

Reassess npm advisories before broader distribution. PR19's exception expires **2026-11-05**; it is not extended by this milestone. A dependency audit exit failure is not a clean security pass. Existing tooling-path analysis does not certify native security.

Use the backend's existing Dockerfile, compose.yaml, .env.staging.example, deploy files and deployment runbooks as the starting point. Provision an approved HTTPS host/certificate and ingress, isolated MySQL with private networking/TLS, injected JWT/database secrets, exact CORS origins, readiness checks, log retention, encrypted backups and a demonstrated restore. Keep COD disabled until stock, address and checkout acceptance pass in that environment. Validate certificate chain and actual catalogue contract, then rebuild with the approved API URL and rerun device purchase/idempotency acceptance. No URL is invented here.


## Verified candidate package

- File: `Brandista-Showcase-Universal.apk`, **56,084,827 bytes**.
- SHA256: `f57068708d662c01ba23d0e759445121618659f36b52450bca93225a1f56de5d`.
- Package: `com.brandista.mobile.internal`, version **0.2.0**, version code **2**, label **Brandista Internal**.
- Minimum SDK **24 (Android 7.0)**; target SDK **36**; non-debuggable release manifest.
- **26 matching native libraries per ARM ABI**, actual ELF class/machine checked; ZIP integrity PASS.
- Embedded Hermes bytecode: **2,237,392 bytes**, magic `c61fbc03c103191f`.
- APK v2 signing verified; internal certificate SHA256 `d75128ac92091d2b837368071d41f3a36c2036ecfa42409d06cdda0b7be4fa44`.
- All three original catalogue images verified by **exact decoded RGBA pixel hashes** after Android resource renaming/lossless recompression. Showcase catalogue/cart/confirmation markers are embedded.

The APK was compiled by source run **40025213783** from `ab3c266`. The initial raw image-resource matching check rejected Android's transformed resource names/bytes after compilation and signing had passed. The corrected verifier compares actual decoded pixels using existing locked Expo image tooling. Recovery run **40027697735** verifies and uploads the **same signed APK**, recording both the original APK source and newer verification source. No native/application change or re-signing is implied by verification recovery. Check the recovery run's final conclusion when downloading.

Current device startup remains NOT RUN; package inspection and browser layout checks do not establish a physical-device PASS. No real public-backend purchase is claimed. [Mobile PR #24](https://github.com/Brandista-App/brandista-mobile/pull/24) and [deployment preparation PR #27](https://github.com/Brandista-App/brandista-mvp/pull/27) remain open for review, without automatic merge. Deployment Compose interpolation passed using non-secret parse-only placeholders; Docker/TLS/MySQL/backup runtime acceptance is not claimed.


Final hosted result: **PASS** — recovery run 40027697735 completed quality and standalone verification successfully. [Download the verified universal artifact ZIP](https://github.com/Brandista-App/brandista-mobile/actions/runs/40027697735/artifacts/12534045575). Local APK checksum is recorded above and in the artifact. The GitHub artifact includes signing, network, metadata, native-library and original-source evidence; retain a copy before its 14-day artifact retention expires.
