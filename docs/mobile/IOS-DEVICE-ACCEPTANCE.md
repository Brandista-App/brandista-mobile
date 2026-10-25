# IOS-FINAL-001 — customer functionality and acceptance matrix

2026-10-24. Status vocabulary: **PASS** means the stated method produced evidence; **FAIL** means a reproduced defect remains; **BLOCKED** means an external prerequisite is missing; **NOT TESTED** means no execution evidence. A source/JavaScript PASS never implies a native or physical-device PASS. All test fixtures are synthetic; demo checkout must never submit a backend order.

## Automated and source verification

Hosted iOS quality run40106403061 at implementationf9af4af passes **74 tests across14 suites**, strict TypeScript, lint, SDK compatibility, config validation and iOS Hermes export. Existing TEST-001 HTTP408/429 and UUID cleanup regressions remain. Local checks, native build and screenshot results are separately recorded in the final [release-readiness report](IOS-FINAL-RELEASE-READINESS.md).

| Scenario | Automated/source result | Scope and remaining checks |
| --- | --- | --- |
| First-launch offline welcome | PASS | Actual showcase component renders fictional content without login or fetch. Native first launch/airplane mode is separate. |
| Demo brands/products/details/options | PASS | Bundled catalogue validation and product-selection/local-storage component tests. Native transitions and imagery need rendered review. |
| Search/category/brand filtering | PASS (source and existing screen coverage) | Existing local filtering and routed brand/category inputs retained; full native interactive search is not inferred. |
| Local demo cart | PASS | Restore validation, limits/removal, add/clear and separate SecureStore key. Native Keychain/restart durability requires device testing. |
| Simulated checkout | PASS | Actual checkout component clears only demo bag; no network/order submission. |
| Offline-only build fencing | PASS | Build rejects mixed API/LAN settings; explicit offline runtime refuses even a configured service. No EAS project needed for offline local build. |
| Live registration/login/logout | PASS (mocked JavaScript) | Existing form, customer-role/session/auth-provider/adapter tests retained; no approved live account sign-in on iPhone. |
| Session persistence/expiry | PASS (mocked JavaScript) | Expiry/corruption/foreground and stale401 isolation; actual Keychain/device lock/reinstall not tested. |
| Live brands/catalogue/products | PASS (mocked JavaScript and contract inspection) | Existing adapters match backend routes; loading/empty/error/retry and availability covered. |
| Live cart | PASS (mocked JavaScript) | Server IDs/quantities/totals, quantity/removal/clear contracts; no device stock-race acceptance. |
| Delivery addresses | PASS (mocked JavaScript) | Validation, CRUD/default adapter and confirmation handling. Keyboard and native Alert interaction not tested here. |
| COD quote/place/confirmation/history | PASS (mocked JavaScript) | Server quote, persisted idempotency key, stock/COD gates, owned snapshots and history routes. No real COD transaction in this milestone. |
| Timeout/rate-limit/retry/UUID errors | PASS | Preserved TEST-001 cases; no duplicate order or permanently busy screen in tested cases. |
| API errors/loading/empty states | PASS (mocked JavaScript) | Bounded safe transport errors, session boundaries and retry/empty components. |
| Approved logo and offline resources | PASS (source/export baseline) | Original approved logo SHA2568ef9793e563c0f5cc28e508bb359c85fc53f5cba6d471eea7d4d926c38d5bfae, bundled demo images, native geometric icons and iOS system fonts. Compiled app asset verification is separate. |

These rows describe implementation and focused existing coverage, not exhaustive automation of every user interaction. No confirmed unresolved JavaScript defect was reproduced by the passing suite; that is not proof that every native permutation is defect-free.

## Native Simulator acceptance

The manual job is a genuine Xcode Release Simulator build attempt, not an Expo export renamed as a native artifact. Final build/launch/screenshot results are recorded below only after completion. A Simulator ZIP cannot install on a physical iPhone. Boot/launch screenshots alone do not prove cart, checkout, search, network loss or gesture behavior.

| Scenario | Status before final native verification | Required evidence |
| --- | --- | --- |
| CNG/Pods/native compile | NOT TESTED | Successful current Xcode build log and actual Simulator-platform Mach-O. |
| Embedded standalone code/assets | NOT TESTED | Hermes bundle, original-logo match and packaged imagery checks. |
| Initial install/launch without Metro | NOT TESTED | Actual simctl install/launch and visually reviewed screenshot. |
| Terminate/relaunch | NOT TESTED | Actual relaunch and rendered screenshot; does not certify cart changes persisted. |
| Splash/native stack/tab gestures | NOT TESTED | Native interactive run; launch screenshots cannot establish animated splash or gestures. |
| Several iPhone sizes/notch/Dynamic Island | NOT TESTED | Record actual runtime/device size, landscape, accessibility text size and cutout screenshots. |
| Keyboard/VoiceOver/modal/scroll interaction | NOT TESTED | Interactive native acceptance; component props alone are insufficient. |
| Airplane-mode launch and recovery | NOT TESTED | Disable actual connectivity, terminate/relaunch, browse and restore. An offline-only build with network available is distinct evidence. |
| Demo cart restart and simulated checkout | NOT TESTED | Add/change a line, terminate/relaunch, inspect restored bag and complete simulation with no API mutation. |

## Physical iPhone acceptance

No approved physical iPhone/Xcode Personal Team session is available to this Windows run. The physical installation prerequisite is **BLOCKED**. No row is assigned PASS based on the Simulator, automated tests, prior Android device evidence or a web preview.

| Scenario | Status | Owner procedure |
| --- | --- | --- |
| Free Personal Team signing/install | BLOCKED | Follow [personal installation](IOS-PERSONAL-IPHONE-INSTALLATION.md) on an authorized Mac; record device/model/iOS, reviewed commit and actual installation. |
| Fresh install and first launch offline | NOT TESTED | Release build, no Metro/laptop, airplane mode; approved logo and fictional catalogue visibly render. |
| Brand/product browsing and options | NOT TESTED | Browse all three fictional brands and six products; select valid options and verify prices. |
| Search/filter/empty/reset | NOT TESTED | Search by product/brand, combine categories, test empty results and reset. |
| Demo cart and restart persistence | NOT TESTED | Add/change/remove; force-close/reopen and compare lines/limits; repeat after device lock. |
| Simulated checkout | NOT TESTED | Review and confirm; explicit no-purchase notice, local bag clears, no live order/stock/payment changes. |
| Back/tab/navigation/scroll | NOT TESTED | Back/swipe behavior, tab selection, scroll resets, repeated taps and interruption. |
| Screen sizes/safe areas/status bar | NOT TESTED | Small and large iPhone profiles; notch/Dynamic Island/home indicator, portrait/landscape, consistent light theme. |
| Keyboard/accessibility/modals | NOT TESTED | Field visibility, autofill, dismissal, VoiceOver labels/focus, Dynamic Type, native confirmations and contrast. |
| Background/foreground/storage failure | NOT TESTED | Restore app, observe safe notice/retry when storage unavailable; no PII enters demo mode. |
| Provisioning expiry/reinstall | NOT TESTED | Reinstall after renewing Personal Team profile; observe platform Keychain persistence rather than assuming uninstall wipes it. |

## Live backend tests

Current health request timed out; no approved phone-reachable trusted-HTTPS endpoint or authorized isolated customer/catalogue was supplied. No existing database was seeded/reset and no real orders were placed. All following live-device scenarios are **BLOCKED** until that environment is established:

- Customer registration/login, logout, actual token persistence and expiry.
- Public brand/catalogue/details/pagination and current stock.
- Customer-owned cart and saved addresses/default/confirmation.
- COD quote/place/confirmation/history with server-owned totals and stock.
- Lost response, HTTP408/429/503 recovery with the exact persisted idempotency key.
- Foreign-account/merchant denial and stale401/session isolation on device.

Use only synthetic, disposable data in a separately approved environment. Verify readiness and phone TLS reachability first. Never post simulated checkout to a real API, use administrator credentials in the public app, disable ATS or claim a successful order from a mock response.

## Evidence to record during owner acceptance

Record reviewed source SHA, artifact hash, Xcode version, Simulator/device model and OS, free Personal Team profile expiry (no keys/IDs/passwords), backend environment label/readiness, test IDs using synthetic data and each PASS/FAIL/BLOCKED/NOT TESTED. Capture screenshots and sanitized observations; do not publish tokens, addresses, Apple credentials, provisioning profiles or real customer data. A FAIL should include reproducible steps, expected/actual behavior and the smallest safe fix.
