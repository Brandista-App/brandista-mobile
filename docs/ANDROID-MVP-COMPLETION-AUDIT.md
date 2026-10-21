# Android MVP completion audit

Audit date: 2026-10-22 (Asia/Karachi). Workspace: `D:\Brandista Workplace`.
Audited official `brandista-mobile/main` at `39384d1a6e980bcaebebb832dd40dab9111c2caa`, synchronized with origin/main. App: `apps/mobile`, Expo SDK58 / React Native0.88 / React19.3, Expo Router. The repository root still contains historical Vite web code; it is not the Android application. The canonical customer website is the separate `brandista-frontend` repository.

Reference backend: merged PR7A26, main `4c7d09cd58337d3cc5c3a5a29b270e33a3b02354`. Reference admin: merged PR7B4, main `5abd0b5261c5c358b8949bb60b7dbc98595e05e7`. Backend PR7 adds merchant fulfillment without changing the customer purchase/financial DTO. No Android or iOS application code, dependencies, signing credentials or global settings were changed for this audit. This new audit document is the only intended tracked mobile change.

## Decision and status definitions

**Android MVP implementation is substantially present; release/device acceptance is NOT COMPLETE.** Do not rewrite the app or add another checkout/order implementation.

COMPLETE below means the customer capability exists in production source with the inspected supported API adapter; it does not claim a physical-device pass. PARTIAL means implementation or acceptance evidence has a stated gap. BLOCKED means an external prerequisite prevents the check. MISSING would mean no implementation was found. No missing core customer route was found.

The requested feature list and backend `docs/requirements/ADDRESS-CHECKOUT-SRS.md` / `docs/api/CHECKOUT-CONTRACT.md` are the available baseline. The historical full original SRS is absent, so this does not certify requirements not supplied here. Existing old reports are dated evidence, not current verification.

## Feature inventory

Paths in this table are relative to `apps/mobile`.

| Feature                               | Status   | Actual implementation and remaining evidence                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Registration/login                 | COMPLETE | `src/app/sign-in.tsx`, `src/lib/api.ts`, validation and auth provider: customer registration, normalized email, password rules, masked input, separate successful-registration/login flow and duplicate-submit lock. Auth-form/adapter tests exist. Real new-database/phone login remains pending.                                                                                                                                                   |
| 2. Brand browsing                     | COMPLETE | `(tabs)/brands.tsx`, `brands/[id].tsx`, `ui/catalogue.tsx`; active brands and brand-filtered product requests. No invented brand catalogue.                                                                                                                                                                                                                                                                                                          |
| 3. Catalogue/details                  | COMPLETE | `(tabs)/catalogue.tsx`, `products/[slug].tsx`, `ui/products.tsx`; API-backed list/detail, PKR decimal prices, availability, stock and add-to-cart. Product images/variants are not supplied by the current backend; UI explicitly shows absent photography instead of claiming uploads/variants. This is a product-content limitation if photos are required for launch.                                                                             |
| 4. Search/filtering                   | COMPLETE | `ui/catalogue.tsx`; keyword, category, brand, price sorting, server pagination and category pagination. Filter changes reset the product page.                                                                                                                                                                                                                                                                                                       |
| 5. Cart                               | COMPLETE | `(tabs)/cart.tsx`, tabs badge and cart adapters; server-owned lines, quantities, remove/clear, provisional subtotal, unavailable-item warnings and pending controls. Cart screen test exists.                                                                                                                                                                                                                                                        |
| 6. Delivery addresses                 | COMPLETE | `src/app/addresses.tsx`; owner-scoped create/list/edit/delete/default, field/phone validation, retry/pending handling. Native form/device CRUD acceptance and dedicated complete screen integration tests remain gaps.                                                                                                                                                                                                                               |
| 7. COD checkout                       | COMPLETE | `src/app/checkout.tsx`, `lib/checkout.ts`; backend COD configuration, selected/default address, authoritative review, quote token, persisted customer-scoped UUID/request before placement, same-key uncertain retry, 409 re-review, duplicate-submit guard. Model/adapter tests do not exercise the entire rendered checkout flow on Android.                                                                                                       |
| 8. Order confirmation                 | COMPLETE | Successful checkout replaces route with `/orders/[id]?placed=1`; detail screen announces order placement and renders immutable lines/address/financial summary. No fake payment-success claim.                                                                                                                                                                                                                                                       |
| 9. Order history/details              | COMPLETE | `src/app/orders/index.tsx`, `orders/[id].tsx`, `ui/order.tsx`; customer-scoped pagination/details, retry, delivery snapshots and COD/UNPAID amounts. Customer PLACED records remain financial purchase status; merchant fulfillment is not exposed by the customer API and should not be fabricated in mobile.                                                                                                                                       |
| 10. Authentication/session            | COMPLETE | `state/auth.tsx`, `lib/session.ts`, `lib/runtime.ts`; SecureStore endpoint namespace, customer-only usable session checks, expiry timer/AppState checks, token-aware401 invalidation, clear query cache on identity change/logout, serialized secure writes, restoration-error recovery. Android Keystore/restart/backup behavior still requires device validation. Restore after server account suspension does not imply permanent JWT revocation. |
| 11. Loading/errors                    | COMPLETE | Shared ActivityIndicator, explicit empty/retry states, connection/configuration feedback, field errors, disabled pending controls. Network/5xx/401 uncertain-order request is retained; no production mock fallback. Host tests cover a subset; full network-loss Android acceptance remains pending.                                                                                                                                                |
| 12. Android navigation/responsiveness | PARTIAL  | Expo Router stack/tabs, SafeAreaProvider, scroll/keyboard handling, max-width720, wrapping rows, accessible labels/buttons and 48px controls exist. Hardware back/predictive back, font scaling, keyboard, rotation, safe areas, small phones and repeated navigation have not been verified on a device in this audit.                                                                                                                              |
| 13. Backend API compatibility         | PARTIAL  | Actual `lib/api.ts` and DTOs match inspected current registration/auth/catalogue/cart/address/review/UUID-order/history contracts. PR7 financial/customer boundary is preserved. No authenticated native-adapter run against the new PR7 database yet. The existing `scripts/verify-backend.ts` defaults to old port8082 and selects `demo-m01-*` fixtures; do not run it blindly against an existing database.                                      |
| 14. Android build configuration       | PARTIAL  | `app.config.ts`, `eas.json`, CNG plugins, local helper and Android workflow exist. Development/internal/production packages differ; HTTPS required for production, selected private IPv4 cleartext only for internal LAN. Current config pins compile/target36 and build-tools37; hosted debug APK evidence exists. Local SDK/adb missing; signed standalone and production release verification remain gates. No signing change made.               |
| 15. Physical-device readiness         | BLOCKED  | No attached phone/adb/SDK established on this computer. A compatible hosted ARM64 debug artifact is available, but install/launch, reachable approved backend, secure auth/storage and real customer journey are unverified here. The old LAN document hardcodes another workspace, IP and port; do not reuse those values without fresh environment verification.                                                                                   |

## Executed checks and evidence

Raw current-run evidence is outside Git at `D:\Brandista Workplace\PR7-live-acceptance\android-*`. Node24.21.0/npm11.19.0 were used. These are executed current results, not inherited report claims.

| Check                         | Result                                                                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typecheck                     | PASS                                                                                                                                                    |
| Expo ESLint                   | PASS                                                                                                                                                    |
| Jest                          | PASS:36 tests /10 suites, normal exit,278.29 seconds                                                                                                    |
| Android JavaScript export     | PASS:1,231 modules; Hermes bundle2.7MB and27 assets exported to ignored dist; not an APK/device test                                                    |
| Expo dependency compatibility | FAIL:8 recommended SDK58 patch updates, listed below; no update applied                                                                                 |
| Local debug APK helper        | BLOCKED:exit1 with Android SDK unavailable; ANDROID_HOME/ANDROID_SDK_ROOT unset, no standard SDK or adb on PATH; helper stopped before prebuild/signing |
| Full npm audit                | FAIL:51 affected package entries,30 high /21 moderate /0 critical                                                                                       |
| Production-graph npm audit    | FAIL:43 affected package entries,21 high /22 moderate /0 critical                                                                                       |

`expo install --check` recommended: expo58.0.14→~58.0.17; expo-constants58.0.12→~58.0.13; expo-image58.0.15→~58.0.16; expo-linking58.0.13→~58.0.14; expo-router58.0.23→~58.0.25; expo-splash-screen58.0.10→~58.0.11; expo-status-bar58.0.3→~58.0.4; jest-expo58.0.11→~58.0.12. Reassess compatible registry guidance when implementing; this is the observed check output, not authorization to upgrade.

Current `npm audit --omit=dev --json`: **43 affected package entries, 21 high / 22 moderate / zero critical**; audit exits nonzero. This is a current package-graph finding, not43 independent advisories or a claim of exploitable APK code. No dependencies were changed. Production readiness remains blocked pending compatible remediation or explicit security review.

Commands from `D:\Brandista Workplace\brandista-mobile\apps\mobile`:

```powershell
$env:APP_VARIANT = 'development'
$env:EXPO_PUBLIC_API_BASE_URL = 'http://10.0.2.2:8086/api/v1'
npm run typecheck
npm run lint
npm test
npm run bundle:android
npm run dependencies:check
npm run build:debug
npm audit --json
npm audit --omit=dev --json
```

The emulator URL here is a configuration for a future local emulator, not a claim that an emulator ran. Backend8086 is loopback-only; physical-device access needs a separately approved reachable HTTPS endpoint or the existing constrained internal-LAN proxy procedure with freshly detected settings. No proxy, firewall rule, tunnel or public service was created by this audit.

Read-only GitHub verification found [Android workflow39348234063](https://github.com/Brandista-App/brandista-mobile/actions/runs/39348234063) at ancestor commit `a28ad412e019b4910d127d8c79ecdd51c6db8527`: quality and debug-apk SUCCESS; standalone-apk SKIPPED. Its non-expired `brandista-android-debug-arm64` artifact is 42,123,602 bytes. This confirms hosted debug build capability and supersedes the early Android report's historical no-APK blocker. It is not a signed standalone release, current-main native rebuild or device test. A workflow/run title mentioning standalone does not establish that the standalone job ran; another inspected successful run38972279593 also skipped that job. No workflow was dispatched and no remote signing credential accessed.

## Acceptance and security gaps

1. Part A PR7 live acceptance is waiting for private supported operator bootstrap in a new isolated database; no authenticated customer/merchant acceptance has been claimed. See `D:\Brandista Workplace\PR7-live-acceptance\FINAL-REPORT.md`. The retained PR5/PR6 database was not used.
2. Actual Android checkout, addresses and order-screen integration coverage is thinner than adapter/model coverage. Test named `checkout.test.ts` covers pending-request logic, not the complete rendered checkout. Do not equate mocked unit tests or JavaScript export with native E2E.
3. Current audits report51 full-graph and43 production-graph affected entries, and Expo's compatibility check fails with8 patch recommendations. `--omit=dev` still includes Expo tooling through runtime-declared packages; package findings do not alone prove APK runtime exploitability. Do not assume the recommended patch updates resolve all security findings. Do not force incompatible SDK downgrades, suppress findings or replace signing material to make a check green.
4. Existing approved logo asset is already used by `ui/brand.tsx`; do not repeat older claims that the app has no approved logo. Product photography is separately absent from the API.
5. Old operational guides reference `D:\uzair-brandista`, `C:\Brandista`, private IP192.168.100.66 and ports8082/8083. Those are historical values, not verified instructions for this workspace. Update the device handoff with actual current values as part of acceptance; preserve iOS HTTPS/identity gates and the canonical web separation.
6. Public release still needs owner-approved reachable HTTPS API, appropriate signing/identity/versioning, dependency decision and real-device approval. Existing internal signing plugin reads environment at build time and fails on missing required variables when selected. No EAS build, credential creation, account login or store submission occurred here.

## Shortest practical mobile PR sequence

### Android PR1 — compatibility and real customer-flow/device acceptance

First review/apply only supported SDK58 patch alignment and compatible security remediation; rerun native checks and iOS regressions without weakening its gates. Reuse the current app and hosted debug build capability. Make the existing host verification harness accept explicit disposable fixture IDs/URL and write evidence outside tracked historical reports, with an isolation gate; add rendered checkout/address/order integration coverage for uncertainty/retry/expiry. Install a verified artifact on an owner-supplied ARM64 device, point it only at a freshly verified synthetic environment, and run registration→discovery/search→mixed-brand cart→addresses→COD review/place→confirmation→history. Include process restart/SecureStore, expired/disabled auth, offline/resume same-key retry, stock conflict and no duplicate order. Exercise back/keyboard/rotation/font scaling and record screenshots without credentials. Fix only defects actually reproduced, preserving theme and iOS. Acceptance: compatibility check resolved, API/database order and stock evidence plus successful phone journey; zero claim of payment collection. If no flow defects are found, deliver evidence/runbook changes rather than inventing new features.

### Android PR2 — release candidate readiness

Resolve or explicitly review remaining compatible dependency/security blockers; establish the owner-approved stable HTTPS API and existing signing path without rotating keys; verify package/version, non-debuggable native artifact, embedded JS/API endpoint, permissions/network/backup policy and certificate. Update this workspace's device/build guide, rerun quality/build checks and the same physical-device journey on the candidate. Reuse existing product assets and supported backend contracts. Acceptance: reproducible installable candidate and owner device sign-off. No public deployment/store upload is implied.

If dependency findings prevent even internal testing safely, move the compatible dependency fix to the front of PR1; do not add a third speculative feature milestone. Customer shipment tracking would require a separately approved backend/customer contract and is not necessary to recreate the already implemented MVP purchase journey.
