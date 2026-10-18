# REPO-003: mobile architecture and iOS preparation

## Verified baseline

On 2026-10-17, remote default branch `main` and local HEAD both resolved to
`a3d63679def6df154c826374d8e081c989144292`, with a clean working tree and zero
ahead/behind commits after fetching. Preparation branch:
`codex/repo-003-mobile-architecture`.

[Backend PR #23](https://github.com/Brandista-App/brandista-mvp/pull/23) is merged
into backend main at `ad1198d9993669f987c2499d0d2848529b9b7824`. It switches backend
web tooling to the sibling `brandista-frontend`. This milestone does not modify
the backend, the canonical web repository, or retained root web source.

## Existing application

`apps/mobile` is an independent npm package with its own lockfile: Expo SDK 58,
React Native 0.88, React 19.3, TypeScript, and Expo Router. `app.config.ts`
declares Android and iOS. No tracked Java/Kotlin, Swift/Objective-C, Gradle, or
Xcode project files were found. Generated native directories are absent and
ignored under this package. Android customization exists in config plugins,
build settings, scripts, and CI; absence of committed native projects does not
mean absence of Android-specific behavior.

| Layer                | Preserved implementation                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app`            | Stack, five tabs, home, catalogue, brands, product details, customer sign-in/registration, addresses, cart, checkout, orders                |
| `src/lib`            | Typed API/client/DTOs, URL validation, bounded requests, errors, session serialization, checkout validation and pending submission handling |
| `src/state/auth.tsx` | SecureStore sessions, restoration, expiry/401 handling, identity-scoped query cache                                                         |
| `src/ui`             | Native controls, shared visual tokens, safe areas, accessibility and iOS keyboard avoidance                                                 |
| TanStack Query       | Server state and explicit mutation retry policy                                                                                             |

Implemented customer scope includes registration/login, brand and category
discovery, filtered/sorted product catalogue, persistent cart, address CRUD and
default selection, stock/price review, backend-enabled COD checkout with
idempotency, and customer order history/details. No new feature implementation
is implied by this document. Online payments, password recovery, fulfilment and
tracking, product photos/variants, and refresh-token flows remain outside the
implemented scope.

## Platform assessment

Android configuration includes application IDs by variant, permissions,
keyboard/back settings, SDK/build tools, internal signing and LAN-network
plugins, APK scripts, EAS profiles, and Android CI. Preserve these exactly until
Uzair's unpublished source can be reviewed. Existing Expo Android code is a
preserved implementation, not a replacement for his source.

iOS is a reusable foundation, not a verified shippable application. Shared
screens and adapters already avoid dependencies on root web files. SecureStore
options and keyboard handling include iOS behavior. Still missing are an
approved bundle identifier, Apple signing/team and provisioning decisions,
iOS-specific build profiles/CI, native simulator/device acceptance, and approved
launcher/splash derivatives. Existing Android internal-LAN configuration is not
an iOS network-security configuration. Do not disable transport security to
make an Android LAN setup work on iOS.

The default development API `10.0.2.2` is Android-emulator-specific. iOS must
explicitly supply a reachable endpoint; prefer an authorized HTTPS development
API ending in `/api/v1`. A placeholder URL used to validate or export the app is
not evidence of backend connectivity. Native iOS compilation/simulator testing
requires macOS/Xcode, or an authorized EAS build on macOS workers; Windows can
run static checks and Metro exports.

## Repository layout decision

Retain this layout now:

```text
brandista-mobile/
  apps/mobile/          # existing shared Expo package; iOS foundation
  apps/brand-assets/    # approved original artwork and manifest
  docs/mobile/          # architecture, contracts, tests and platform runbooks
  .github/workflows/    # preserve existing Android CI
  src/ and root files  # retained legacy web application
```

Do not create root `android/` or `ios/` applications in REPO-003. Do not copy or
move `apps/mobile`. Expo generates `apps/mobile/android` and `apps/mobile/ios`
as platform build projects; these are distinct from owner-maintained root app
directories. They must never be confused with Uzair's source.

Recommended eventual ownership, conditional on reviewing Uzair's actual source:

- `apps/mobile/` remains the single maintained Expo source and iOS app root;
  Android/iOS builds select their platform from this same package.
- Root `android/` can hold Uzair's independent app only after he publishes it
  and its project root, build system, identifiers, assets, signing boundaries,
  and history are verified. Reserve the name in this document only.
- Do not introduce root `ios/` as a second Expo source copy. If that exact
  source-root name is later required, plan one explicit move from `apps/mobile`
  with script/CI/path updates and preservation review in a separate milestone.
- If Uzair's app is itself compatible React Native, evaluate convergence before
  establishing two implementations. If it is native Android, share backend
  contracts, acceptance scenarios and brand assets; do not force TypeScript UI
  code into it. Extract shared packages only after a second real consumer exists.

Independent platform builds do not require duplicate screens or repositories.
Use separate build profiles/jobs and signing credentials; never run Expo
prebuild against Uzair's maintained Android project.

## Preservation inventory

Preserve all `apps/mobile/src/**`, `tests/**` (seven test suites plus setup),
`package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.js`,
`jest.config.js`, `app.config.ts`, `eas.json`, both `plugins-*.cjs`, `scripts/**`,
`.env.example`, ignore rules, `AGENTS.md`, `THIRD-PARTY-NOTICES.md`, and README.
Retain `.github/workflows/android-quality.yml` and `docs/mobile/**` evidence.
Verification scripts also write evidence outside the package into `docs/mobile`.
Do not execute live API scripts merely to check this architecture: they may
create customer or order data.

Preserve `apps/brand-assets/brandista-approved-logo.jpeg.jpeg` byte-for-byte:
SHA-256 `8ef9793e563c0f5cc28e508bb359c85fc53f5cba6d471eea7d4d926c38d5bfae`.
Its manifest approves the original artwork; simplified icon/splash derivatives
remain a separate asset task. The older Android architecture report predates
this asset registration.

## IOS-001: reuse and validate the existing Expo application

Scope: prepare the first iOS development build from `apps/mobile`; do not
initialize another app and do not rewrite customer features.

1. Confirm owner-approved iOS bundle ID, Apple team/signing route, and access to
   a Mac with SDK-compatible Xcode or an authorized EAS project. Do not invent
   identifiers or upload signing credentials in repository files.
2. Configure a reachable HTTPS development API and document its provenance.
   Preserve existing release validation and Android defaults. Review both custom
   plugins for safe iOS execution; Android-only modifiers must remain scoped.
3. Add explicit iOS simulator/development build profiles and platform commands
   without changing current Android profiles. Apply config through the existing
   Expo app, not manually authored generated Xcode files.
4. Run locked installation, TypeScript, lint, Jest, Expo config and dependency
   diagnostics; export iOS JavaScript. Resolve or document dependency warnings
   before treating that as native build readiness.
5. Compile on macOS or authorized EAS, then verify navigation/back gestures,
   keyboard/safe areas, deep links, secure-session cold start/expiry/logout,
   catalogue, cart, addresses, COD retries and orders on simulator and device.
6. Verify Android regression checks. Do not modify Uzair's unpublished source.

Acceptance requires a native iOS build and recorded simulator/device results
against the configured backend. Metro export, config resolution, or Jest tests
alone do not satisfy IOS-001. No App Store submission or release is included.

## Verification commands

Run from `apps/mobile` with the locked dependencies and supported Node:

```powershell
npm ci --ignore-scripts --no-audit --no-fund
npm run typecheck
npm run lint
npm test
$env:APP_VARIANT = 'development'
$env:EXPO_PUBLIC_API_BASE_URL = 'https://api.example.invalid/api/v1'
npx --no-install expo config --type public --json
npx --no-install expo export --platform ios --output-dir dist/repo-003-ios
npm run bundle:android -- --output-dir dist/repo-003-android
```

The `.invalid` endpoint is intentionally non-routable and suitable only for
static configuration/export checks. It must be replaced for IOS-001 runtime
acceptance. No prebuild, signing, EAS provisioning or native compilation is
performed in REPO-003.

## REPO-003 validation results

Executed on Windows on 2026-10-17 using the existing lockfile:

| Check                                                            | Result                                   |
| ---------------------------------------------------------------- | ---------------------------------------- |
| `npm ci --ignore-scripts --no-audit --no-fund`                   | Passed; 1,146 packages installed         |
| TypeScript                                                       | Passed                                   |
| Expo lint                                                        | Passed                                   |
| Jest                                                             | Passed: 26 tests across seven suites     |
| Expo public config                                               | Passed: SDK 58, Android and iOS declared |
| iOS Metro/Hermes export                                          | Passed: 1,234 modules                    |
| Android Metro/Hermes export                                      | Passed: 1,227 modules                    |
| Approved logo hash                                               | Matches preservation inventory           |
| Relative source imports outside `apps/mobile`                    | None found                               |
| Native compilation, signing, simulator/device and live API tests | Not run                                  |

The first sandboxed lint/config/test attempts could not access Expo/Jest cache
directories; reruns outside the sandbox passed. Installation reported existing
deprecations and a peer warning: locked Jest 29 versus the Jest 30 peer requested
by `jest-watch-typeahead`. No dependency or lockfile changes were made; resolve
that compatibility question as part of IOS-001 dependency diagnostics rather
than silently upgrading this preserved app. Color-environment warnings during
Metro export did not prevent either export.

All tracked changes in this milestone are documentation. No generated native
project, new application, platform identifier, signing setting or release was
created. Local dependency, cache and export outputs remain ignored. Exports used
the intentionally unreachable validation URL; backend connectivity is untested.

## References

- [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/)
- [Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/)
- [iOS build process](https://docs.expo.dev/build-reference/ios-builds/)
- [Expo CLI config and export](https://docs.expo.dev/more/expo-cli/)
