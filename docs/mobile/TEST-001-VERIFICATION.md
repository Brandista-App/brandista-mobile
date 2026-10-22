# BRANDISTA-TEST-001: native iOS pre-device verification

Date: 2026-10-22. **JavaScript pre-device validation only. Signed iPhone,
simulator, visual/native navigation, and physical-device acceptance are NOT
TESTED.** No Apple enrollment, Mac, paid build, signing, registration, public
backend, production system, or real customer data was used.

## A. Environment and repository provenance

All three working trees were clean initially. No uncommitted/unpublished source
was discarded. Defaults were verified remotely and refs fetched. Mobile main
contains the merged IOS-001, IOS-002, IOS-002B test fix, and later approved PR19
dependency/security work. That work is preserved, not duplicated or downgraded.

| Repository         | Origin                                                    | Verified remote main                     |
| ------------------ | --------------------------------------------------------- | ---------------------------------------- |
| brandista-mobile   | https://github.com/Brandista-App/brandista-mobile.git     | ac35a14fe9137864f89062abb5ca33456e9aa4bc |
| brandista-mvp      | https://github.com/Brandista-App/brandista-mvp.git        | 4c7d09cd58337d3cc5c3a5a29b270e33a3b02354 |
| brandista-frontend | git@github-brandista:Brandista-App/brandista-frontend.git | 3c6432e4326f9d658892b0985e238c22bac3b651 |

Created `codex/test-001-ios-predevice` from the verified mobile main above.
Initial mobile checkout was `a28ad41` (IOS-002B follow-up); its changes are
ancestors of current main. Backend checkout remains on its existing clean
`codex/repo-002c-frontend-cutover` / `aeeca6b`; frontend remains on its clean
Safari branch / `0616769`. Neither sibling's source, branches, or environment was
changed. Final feature commit SHA is supplied in the milestone delivery.

| Tool                     | Observed version/state                                         |
| ------------------------ | -------------------------------------------------------------- |
| Windows                  | Windows 11, amd64                                              |
| Node / npm               | 24.22.0 / 11.19.1                                              |
| Expo package / local CLI | 58.0.17 / 58.1.14                                              |
| React / React Native     | 19.3.0 / 0.88.0                                                |
| Jest                     | 30.5.2                                                         |
| Java / Maven wrapper     | Oracle 25.0.4.1 / Apache Maven 3.9.11; project targets Java 21 |
| Docker Compose           | 5.5.1; Docker Desktop Linux engine unavailable                 |

No dependency manifest/lockfile or native/Android configuration changed in this
milestone. Existing Expo patch versions come from approved main. A clean
`npm ci --ignore-scripts --no-audit --no-fund` installed 1,368 packages.

## B. Automated validation and commands

Run from `C:\Brandista\brandista-mobile\apps\mobile`, with Node 24 on PATH.
For static config/export only, set `APP_VARIANT=development`,
`EXPO_PUBLIC_APP_ENV=development`, and
`EXPO_PUBLIC_API_BASE_URL=https://api.example.invalid/api/v1`. This non-routable
placeholder is not a test backend. No external customer API was contacted.

| Category / exact command                                          | Result                                                                                |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Clean install: `npm.cmd ci --ignore-scripts --no-audit --no-fund` | PASS; 1,368 packages                                                                  |
| `npx.cmd expo-doctor`                                             | PASS; initial and final 20/20                                                         |
| `npm.cmd run dependencies:check`                                  | PASS; SDK dependencies up to date                                                     |
| `npm.cmd run typecheck`                                           | PASS; strict tsconfig retained                                                        |
| `npm.cmd run lint`                                                | PASS after focused changes                                                            |
| Initial `npm.cmd test` before new regressions                     | PASS; 36 tests / 10 suites                                                            |
| New screen regressions before application fixes                   | FAIL; 3 failed / 15 passed, both confirmed defects documented                         |
| Focused checkout regressions after fixes                          | PASS; 21 tests / 2 suites                                                             |
| Expanded screen/auth-provider/transport checks                    | PASS; 27 tests / 3 suites                                                             |
| Final `npm.cmd test`                                              | PASS; 65 tests / 13 suites                                                            |
| `node node_modules/expo/bin/cli config --type public --json`      | PASS; Android+iOS and existing iOS build guards retained                              |
| Final `npm.cmd run bundle:ios`                                    | PASS; Hermes bundle, 24 assets verified                                               |
| Final `npm.cmd run bundle:android -- --output-dir dist/android`   | PASS; Hermes bundle, 27 assets verified                                               |
| Metro loopback readiness and iOS development module request       | PASS; /status HTTP 200, iOS development bundle HTTP 200, 6,033,782 bytes              |
| Assets                                                            | PASS; all 24 iOS metadata assets exist; approved original logo included byte-for-byte |
| Runtime Windows-path/log scan                                     | PASS; 31 src files, no Windows drive paths or console logging calls                   |
| iOS and Android workflow YAML                                     | PASS; parsed, existing jobs/trigger definitions present                               |
| Full current backend-main automated suite                         | PASS; 190 tests, 0 failures/errors/skips                                              |
| Base + demo Compose `config --quiet`                              | PASS using example interpolation, no actual secrets printed                           |
| Docker/MySQL/live mobile-adapter acceptance                       | BLOCKED; engine and approved populated test environment unavailable                   |
| macOS simulator/native compilation/physical iPhone                | NOT TESTED                                                                            |

Final Doctor, Jest, and both exports passed before publication. A new authentication-error test fixture initially failed strict TypeScript because it omitted AuthContext fields; the fixture was completed and final validation passed. No tests were
removed or weakened. Local commands mirror relevant iOS quality steps; hosted
GitHub Actions/native Android compilation are separate and not claimed passed.

Metro ran with `--dev-client --localhost --port 19085`, never LAN/tunnel. The
iOS request used `/node_modules/expo-router/entry.bundle?platform=ios&dev=true&minify=false&lazy=false`.
Only the process tree created by this check was stopped; no listener remained
on 19085. This verifies host bundling/module resolution, not rendered navigation.
There are no custom font-family/useFonts references in runtime source; the
system font's actual iOS appearance is a device check. Exported assets include
the original approved logo SHA-256
`8ef9793e563c0f5cc28e508bb359c85fc53f5cba6d471eea7d4d926c38d5bfae`.

## C. Customer feature matrix

PASS below means the specified JavaScript method passed, not native/physical
acceptance. API, storage, crypto, and Router boundaries are mocked in component
tests. React Native Testing Library exercises actual app components with test
renderers; it does not run UIKit, SecureStore/Keychain, native gestures, or a
real Expo Router navigation stack. All fixture records/tokens are synthetic.

| Customer feature                | Tested method / result                                                                                                                                   | Known defects or remaining device checks                                        |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1. Launch/initial navigation    | PASS: setup welcome/help/back component test, configuration resolution, auth initialization, route declaration inspection, Metro bundle                  | Actual app launch, splash and native stack NOT TESTED                           |
| 2. Welcome/login/registration   | PASS: existing auth-form component and adapter tests; successful registration returns to login without fake session                                      | Autofill, secure keyboard, actual API account creation on phone                 |
| 3. Login validation/auth errors | PASS: invalid fields block submit; HTTP 401/503 errors visible with retry controls                                                                       | Device keyboard/focus and authorized real login                                 |
| 4. Session persistence/logout   | PASS: session-store roundtrip/corrupt/expiry tests; actual AuthProvider restore/logout, foreground expiry, stale versus matching 401, read-failure retry | Native Keychain persistence/accessibility and app restart                       |
| 5. Brands                       | PASS: actual brands component list/empty state and emitted brand-route parameters                                                                        | Native transition and live catalogue                                            |
| 6. Categories/products          | PASS: search, category/sort adapter inputs, loading/empty/error/retry states, existing pagination source inspected                                       | Scroll performance, native navigation and real backend pagination               |
| 7. Details/prices/availability  | PASS: actual product component shows server PKR/stock, explicit photo fallback, blocks unavailable add                                                   | Actual product imagery/layout; DTO currently has no photo URL                   |
| 8. Add to cart                  | PASS: selected quantity + server product identity; adapter excludes client totals                                                                        | Live stock races/device feedback                                                |
| 9. Cart quantity/removal        | PASS: existing increase test; lower-bound guard, remove/clear, server totals in expanded screen test                                                     | Native gestures and live cart persistence                                       |
| 10. Addresses                   | PASS: required-field validation, edit/save, default identifier, delete confirmation callback; adapter and backend ownership tests                        | Native Alert interaction, keyboard, real saved test address                     |
| 11. COD checkout                | PASS: server quote, disabled-COD gate, placement, stock conflict, stable retry on 0/408/429/503, UUID failure cleanup                                    | Two confirmed defects fixed; physical repeated taps/network loss still required |
| 12. Order confirmation          | PASS: emitted replace-route params and actual detail component confirmation/snapshot                                                                     | Native transition, actual placed test order                                     |
| 13. Orders/history              | PASS: history list/detail-route event, server totals, forbidden details show no snapshot                                                                 | Real customer-owned order acceptance                                            |
| 14. Loading/empty states        | PASS: pending catalogue indicator, empty products/brands, existing empty cart/source states                                                              | Native screen-reader announcements/layout                                       |
| 15. Network/timeout/retry       | PASS: 20-second transport abort with timer cleanup, safe error, malformed success rejection, retry components and checkout key preservation              | Real phone latency/offline/interruption                                         |
| 16. Unauthorized responses      | PASS: sent-token 401 callback, stale request cannot clear current session, protected Gate, forbidden order snapshot, backend authorization suite         | Actual device expiry/background timing and server access                        |

No known confirmed code defects remain from the reproduced cases after fixes.
This is not a claim that all possible defects are absent or every permutation
has automated coverage.

## D. Defects and minimal fixes

See [before-fix evidence and severity](TEST-001-DEFECTS.md).

| Defect                                    | Root cause / severity                                                        | Files / regression                                                                         | Verification                                                           |
| ----------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| 408/429 discarded uncertain pending order | `uncertain()` omitted timeout/rate-limit outcomes; high duplicate-order risk | `src/lib/checkout.ts`; checkout unit classification and actual Checkout screen retry cases | Same persisted key/request survives and is reused; targeted tests pass |
| UUID failure left checkout locked         | Attempt generation before try/finally; medium availability defect            | `src/app/checkout.tsx`; actual Checkout component crypto-failure test                      | Error visible, controls enabled, no API placement sent                 |

Only two runtime source files changed (eight diff lines before formatting).
Additional coverage: `tests/customer-screens.test.tsx`, `auth-provider.test.tsx`,
`client-resilience.test.ts`, additions to `auth-form.test.tsx` and
`checkout.test.ts`. There are no cosmetic redesigns, rewritten customer flows,
new Expo apps, credentials, dependency upgrades, or backend business changes.

## E. Backend integration and contract compatibility

Backend main `4c7d09c` was exported from Git into ignored
`apps/mobile/.expo/test-001-backend-main` and tested there explicitly:

```powershell
Set-Location C:\Brandista\brandista-mobile\apps\mobile\.expo\test-001-backend-main
.\mvnw.cmd '-Dserver.address=127.0.0.1' test
docker compose --env-file .env.example -f compose.yaml -f compose.demo.yaml config --quiet
```

An earlier wrapper invocation selected the older backend checkout (132 passing
tests); that result is excluded from the current-main claim. The corrected
explicit export run passed **190 tests** including current lifecycle, invitation,
merchant, registration/login, public discovery, cart, addresses, COD checkout,
ownership/security, migration and health/configuration tests. Test listeners
were loopback; test fixtures used isolated H2 databases and existing test-data
mechanisms, not production/MySQL records. Java 25 warnings about agents/native
access were visible; the Maven build completed successfully targeting Java 21.

Source-level mobile contract review used that same latest export:

| Contract                   | Compatibility observation                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Registration/login         | Email/password JSON; LoginResponse accessToken/tokenType/expiresIn/account matches mobile types             |
| Brands/categories/products | Brands is an array; categories/products are pages; slug detail and filter/sort names match adapters         |
| Cart                       | POST productId/quantity; PATCH itemId quantity; DELETE item returns 204; DELETE /items returns CartResponse |
| Addresses                  | Owned CRUD/default paths and AddressResponse fields match mobile types                                      |
| Checkout                   | addressId preview; placement addressId/quoteToken + UUID Idempotency-Key; server computes prices/totals     |
| Orders                     | Page/list/detail snapshots match; backend UUID replay/ownership and stock validation tested                 |
| Authorization/errors       | CUSTOMER paths protected; fieldErrors/message DTO and 401/403 behavior inspected/tested                     |

These source comparisons, mocked adapter tests and real Spring test HTTP calls
are separate evidence. The mobile transport was **not** run against a persistent
MySQL or staging backend. No health/API URL, dedicated external test customer,
approved populated catalogue, or privileged seed token was supplied or invented.
The existing host verification script requires approved seeded demo data; it was
not pointed at arbitrary data or run as a blind mutation script. Live mobile
integration remains **BLOCKED** until the approved local test stack is available.
No administrator credentials/tokens or real product IDs were requested/created.

## F. iOS security/readiness and release limits

- SecureStore uses WHEN_UNLOCKED_THIS_DEVICE_ONLY and environment-scoped keys;
  passwords are not persisted. Tests validate adapter/state behavior, not actual
  iOS Keychain. Logout clears memory, query cache and stored session; restored
  sessions reject expiry/corruption/non-customer roles. Matching 401 clears the
  active session while stale-request 401 cannot clear a different current token.
- iPhone/runtime and signed-build configuration retain explicit HTTPS guards,
  reject localhost/emulator/bind hosts, embedded URL credentials/query/fragment,
  and Android LAN overrides. No ATS bypass or Android configuration change.
- Network errors do not expose transport details; timeout is 20 seconds. Screen
  input validation, server-owned totals, PKR formatting, placeholder photos,
  accessible labels, button/input minimum height 48, SafeAreaView and keyboard
  avoidance are present. VoiceOver, Dynamic Type, tap timing, actual keyboard,
  cutouts and native accessibility remain device requirements.
- Runtime source scan found no drive-letter paths or console logging calls.
  This is a targeted review, not a guarantee that all possible PII flows are
  absent from native libraries or future backend error payloads.
- Current npm audit: **40 production-graph affected packages: 21 high / 19 moderate;
  48 full-graph: 30 high / 18 moderate; 0 critical**. Counts include inherited
  metavulnerabilities, not independent root advisories. Root findings are
  transitive braces 3.0.3, node-forge 1.4.0, and sprintf-js 1.0.3. Latest published
  versions 3.0.3/1.4.0/1.1.3 still have no advisory patch. Build/test/tooling
  exposure is not proof of native runtime exploitability or a clean audit.
  Prior main/PR19 security work and documented temporary safeguards are retained;
  no new waiver, override, downgrade or suppression was introduced. No runtime
  dependency changes were needed for these fixes.

Advisories: [braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm),
[node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv),
[sprintf-js](https://github.com/advisories/GHSA-hp3w-g68c-fv3c).
Use trusted build inputs, private Metro and reviewed signing material; revisit
compatible upstream remediation before release. This milestone does not expand
prior temporary acceptance into production approval.

## G. Publication and preservation

Branch: `codex/test-001-ios-predevice`; base main `ac35a14`.
Final commit, push and PR/comparison status are recorded in the milestone
delivery after validation. PR creation is attempted only where permissions allow;
no automatic merge. Reports and tested source/tests only are committed. Raw logs,
audit JSON, backend export, Metro helper, bundles, and caches remain ignored.

The canonical frontend, backend checkout/business logic, existing Android
configuration/profiles/workflows, Uzair's unpublished Android source, legacy
root web application, original logo, and existing Expo structure are preserved.
Hosted CI/native compilation is not inferred from local tests.

## H. Smallest next actions before a real iPhone run

1. Review/merge this tested fix through normal review; do not merge automatically.
2. Start the approved isolated Docker/MySQL backend when its engine is available;
   provision disposable customer/catalogue through existing approved mechanisms.
   Run the host mobile adapters against it and record real IDs/results privately.
3. Establish an explicitly authorized, trusted HTTPS route to that test backend.
   No public exposure or new infrastructure is authorized implicitly.
4. When the owner can provide an authorized SDK-compatible signed iOS artifact
   and approved device, test launch/native navigation, Keychain, background/expiry,
   keyboard/VoiceOver, imagery, cart/address/COD/order flows and interrupted retry.
   Signing/paid services remain deferred, not required for TEST-001.

Until then Safari on trusted Wi-Fi remains the separately documented zero-Apple-
cost customer-flow route; it does not validate native iOS behavior. No physical
iPhone pass, signed artifact, native simulator run or full iOS acceptance is
claimed. Stop after TEST-001; no next milestone starts automatically.
