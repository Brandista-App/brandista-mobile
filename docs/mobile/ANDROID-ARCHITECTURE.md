# Android architecture

Repository: `Brandista-App/brandista-mobile`. Branch: `codex/android-native-foundation`.
Native application: `apps/mobile`, an independent Expo/React Native/TypeScript package with its own lockfile. The historical root Vite application and its history are preserved. Root ESLint excludes `apps/**`, and a separate Vitest configuration excludes native Jest tests so the two toolchains remain independent. Active web development belongs in the private `Brandista-App/brandista-frontend` repository. The separate checkout `brandista-mobile-native` avoids disturbing the existing mobile working tree. No backend contracts are changed.

## Discovery baseline

Inspected the local backend at `c978a237fb76ff3f70ea5b595fa7ca244ea9044c`, fetched backend main `7f86979121b1f65fad4db6ef42a6ccb43ca11203`, the source mobile branches and frontend main `70fe5d5fff3f8ba71ffb34de05681116ea73cf7e`. Backend main contains the address/COD contract and V9 inventory/order migration. Mobile main at migration was `b8c54443c39175fee380767a8db3ca305bcdecc9`. The administrator repository's local main has no commits; its remote branch listing was also inspected. The backend exposes administration separately from this customer app.

The original full SRS is absent. Backend `docs/SRS.md` indexes the approved `docs/requirements/ADDRESS-CHECKOUT-SRS.md` addendum; the existing acceptance report records 79 backend tests and 31 web tests plus local MySQL/browser acceptance. Those are historical evidence, not new Android test results. See the native test report for checks actually run here.

## Layers

- `src/app`: Expo Router stack and five tabs, product/brand routes and protected address/checkout/order routes. Native stack/tab handling supplies Android back navigation; signing in replaces the account route. A protected route renders its sign-in gate before fetching customer data.
- `src/lib`: typed endpoint adapters derived from backend/web DTOs, bounded HTTP requests, normalized status/field errors, endpoint configuration, validation, session serialization and customer-scoped pending-order records.
- `src/state/auth.tsx`: SecureStore-backed customer sessions, cold-start loading, expiry checks on time/foreground, 401 invalidation and query-cache clearing on identity changes. There is no refresh token or server logout endpoint. Logout removes the local bearer token; backend-issued tokens remain valid until expiry. Passwords are never persisted.
- TanStack Query: server state, customer-keyed caches, loading/retry/refresh states. Mutations never retry automatically; checkout explicitly reuses its original key. Cart subtotals and checkout totals come from the backend.
- `src/ui`: native controls, warm paper/botanical green/clay tokens, safe areas, responsive maximum width, 48-point minimum button heights, keyboard avoidance, labelled inputs and accessible errors. Light appearance is intentional: no approved dark palette exists. Expo Image supports caching for future image URLs; current product DTOs contain none and the UI labels photo absence explicitly.

SecureStore uses Android Keystore encryption and excludes its records from Android backup via the Expo plugin. Access tokens never enter AsyncStorage, logs or committed environment files. A pending order stores only a UUID/address ID/quote token; delivery PII is kept in memory and on the server. The record is retained across sign-out for the same customer to support resolving a lost order response after signing in again. A different customer cannot load it.

## Supported scope and backend dependencies

Implemented backend: customer registration/login; active brands, paginated categories/products; keyword, brand/category and price sorting; persistent multi-brand cart; owned address CRUD/default; stock validation; COD configuration/review/atomic placement; idempotency; customer order history and immutable delivery/item snapshots.

Missing backend capabilities: refresh/revocation, profile editing/read endpoint beyond login identity, password recovery, product photos and variants/options, remote inventory reservation, online payments, delivery fee policy beyond local zeros, fulfilment transitions, cancellation/refunds, vendor suborders and shipment tracking. The app does not invent these features. COD is shown only when the configuration endpoint enables it; every placement is PLACED/COD/UNPAID.

Icons and a branded native splash image remain pending: no approved image assets were found. Unapproved Expo template images were removed; no substitute artwork is presented as an approved Brandista asset. The splash uses the approved web background color; final brand assets and their rights require owner review before release.

## Version sources

SDK-compatible dependencies are resolved with `expo install` and locked independently of the web app. References: [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/), [SecureStore](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/), [Expo Router installation](https://docs.expo.dev/router/installation/), [Image](https://docs.expo.dev/versions/v58.0.0/sdk/image/), [Build properties](https://docs.expo.dev/versions/latest/sdk/build-properties/).
