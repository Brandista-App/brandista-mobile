# Android test report

Implementation date: 2026-10-16 (Asia/Karachi). Repository `Brandista-App/brandista-mobile`, branch `codex/android-native-foundation`, native package `apps/mobile`.

Results are recorded after execution below. Historical backend/web test results in the discovery report are not Android evidence.

## Coverage and limits

Native source includes home, brand discovery/storefront, categories/search/sorting/pagination, product details, customer registration/login/session restoration/logout/profile, cart/badge/quantity/remove/clear, address CRUD/default, COD review/placement/recovery, confirmation and order history/details. API-dependent unsupported variants, photos, profile editing and online payments are not fabricated.

Jest uses normal isolated transport/storage/native-module mocks. Host backend verification executes the same native endpoint adapters against the real local Spring/MySQL stack and writes `ANDROID-API-EVIDENCE.json` with no passwords or tokens. Its storage-restoration check uses a memory adapter, not Android Keystore. Synthetic customer/order records remain in the test database and purchased demo quantities reduce stock; no real payment is made.

Android emulator/device testing and Gradle APK generation are not established by a JS export or typecheck. Initial discovery found no adb/emulator on PATH, ANDROID_HOME, or SDK installation at the standard locations. No physical device was provided. Expo account/project/signing access was not provisioned for this task. See the build guide and manual acceptance checklist.

Approved native icon/splash image assets, full SRS baseline, live HTTPS release backend, signing/project setup and device acceptance remain prerequisites to release. No public deployment or store submission is authorized or performed.

## Executed evidence

| Check                    | Result and scope                                                                                                                                                                                                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript               | Passed after declaring native/Jest/Node type environments                                                                                                                                                                                                                                     |
| Native lint              | Passed, Expo ESLint                                                                                                                                                                                                                                                                           |
| Native tests             | Initial complete normal run: 25 passed across 7 files. A subsequent open-handle diagnostic run hit the default 5-second render timeout in one test; test timeout was raised to 15 seconds and the mock QueryClient GC timer was removed. GitHub CI subsequently passed all 25 tests on Linux. |
| Native Android JS export | Passed: Metro/Hermes bundle, 1,227 modules; this is not an APK                                                                                                                                                                                                                                |
| Expo dependency check    | Passed; dependencies reported up to date                                                                                                                                                                                                                                                      |
| Expo Doctor              | 20/20 checks passed                                                                                                                                                                                                                                                                           |
| Live native API client   | 14 checks passed against Spring/MySQL on loopback 8082. Synthetic customer #9, order #5, PKR 6,000 across DEMO Lahore Loom and DEMO Karachi Craft. Same-key replay returned the same order; cart emptied; deletion retained delivery snapshot. See ANDROID-API-EVIDENCE.json.                 |
| Retained web lint/build  | Passed; no web application source or backend contracts changed                                                                                                                                                                                                                                |
| Retained web tests       | 30 passed, 1 failed in a cart-request assertion after navigation. An earlier unrestricted worker run also hit worker-start timeouts under concurrent installation/build load. These runs are not reported as 31 passing tests.                                                                |
| Debug APK                | Blocked: Android SDK/ANDROID_HOME unavailable. The cross-platform build helper exits with a precise prerequisite message. No APK generated.                                                                                                                                                   |
| Emulator/phone           | Not run; no emulator/adb/SDK or attached device available in this session                                                                                                                                                                                                                     |
| Signing/EAS              | No authenticated Expo session found, no EAS cloud build submitted and no production signing credentials created                                                                                                                                                                               |

The Jest preset resolves `expo-modules-core` from the installed Expo package, including subpaths, because npm nests that dependency with this SDK. Tests use React Native Testing Library 14's asynchronous render/event APIs. An initial synchronous-render test setup was corrected; there is no production mock authentication.

## Dependency audit and release blocker

`npm audit --json` found 62 affected package entries: 49 high and 13 moderate, zero critical. Four underlying advisory families propagate through the Expo/Jest toolchain:

- [braces stack exhaustion](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), installed/latest registry version 3.0.3 affected.
- [node-forge signature verification](https://github.com/advisories/GHSA-86w9-cpqp-85rv), installed/latest registry version 1.4.0 affected.
- [sprintf-js precision denial of service](https://github.com/advisories/GHSA-hp3w-g68c-fv3c), installed/latest registry version 1.1.3 affected.
- [uuid buffer bounds](https://github.com/advisories/GHSA-w5hq-g745-h8pq), old transitive xcode dependency affected.

Do not force the audit tool's suggested incompatible Expo 44 / React Native 0.72 downgrades into this SDK 58 application. Resolve these advisories with reviewed upstream patches/compatible tooling updates before release; no claim is made that a JS export establishes runtime exploitability or absence of risk. npm also warns that the transitive Jest watch-typeahead plugin expects Jest 30 while Expo recommends Jest 29; this app uses non-watch CI tests. Release remains blocked pending dependency review, signing, approved assets and native device acceptance.

Expo prebuild generated an ignored Android development project for manifest inspection. Its standard template debug keystore, if present, is for development only; it is not release signing material. No APK compilation occurred.

## CI and additional verification

Draft PR: https://github.com/Brandista-App/brandista-mobile/pull/11.
Initial CI run: https://github.com/Brandista-App/brandista-mobile/actions/runs/38822862292.
The quality job passed clean install, TypeScript, lint, 25 native tests and Android JS export. The APK job failed before compilation because the runner did not have sdkmanager on PATH. Explicit Android SDK setup is added for the retry; APK success is not claimed until an artifact exists.

The clean local `npm ci --no-audit --no-fund` passed (1,146 packages). A separate real API cart-only run passed nine checks with synthetic customer #10, including multi-brand quantity persistence through sign-out/re-login and cleanup. It placed no order and changed no inventory; see `ANDROID-CART-EVIDENCE.json`.

Production and development Android manifests were generated and inspected. Release sets `usesCleartextTraffic=false`, removes overlay/vibration/camera/audio/external-storage permissions, and references SecureStore backup exclusions. Development permits cleartext for the emulator API and retains the development overlay permission. The release configuration inspection used an intentionally non-resolving example HTTPS URL, not a provisioned backend or release build. The generated project was then restored to development configuration. No device encryption/backup behavior is claimed from manifest inspection alone.

## Final handoff

Code and CI configuration are pushed on `codex/android-native-foundation`; review is open in draft PR #11. Final local verification after a clean install passed TypeScript, lint, all 25 native tests (7 suites, normal exit), and the Android Metro/Hermes export. Two CI quality jobs also passed those checks.

The second hosted APK attempt failed at SDK provisioning: `platforms;android-37` was not found. SDK setup itself succeeded. React Native 0.88 declares compileSdk 37; the inspected Google repository metadata listed Android platform 36 but no platform 37. No unsupported compile-SDK downgrade was applied to hide this incompatibility. A compatible framework/platform combination must be established before APK generation can pass. **No APK was generated.** Failure evidence: https://github.com/Brandista-App/brandista-mobile/actions/runs/38823207398.

The retained web suite is not green: one complete run passed 30/31 tests with a cart-request assertion failure; later retries also encountered worker-start timeouts. The root web production build and lint passed, and its application source, package manifest and lockfile are unchanged. These limitations, dependency advisories, approved artwork, signing and emulator/phone acceptance remain open for review. No public deployment or app-store submission occurred.
