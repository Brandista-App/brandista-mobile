# IOS-001: Windows, Expo and the first iPhone build

## Verified starting point and ownership

REPO-003 is merged through [mobile PR #14](https://github.com/Brandista-App/brandista-mobile/pull/14).
IOS-001 starts from main `2f6e77409622141fd6d7775aef71ad60e7d088b0` on
`codex/ios-001-foundation`. The application stays at `apps/mobile`; no root `ios/`
or replacement Android application is created. Both platforms share the existing
source and package lock, while separate EAS profiles select iOS build settings.
Uzair's unpublished Android source is not available here and is not replaced.
Existing Android profiles, application IDs, plugins and CI remain preserved.
Backend and web repositories are read-only for this milestone.

## Current readiness and blockers

The owner has no Expo/Apple accounts, approved bundle identifier, EAS project,
or reachable HTTPS API prepared. No credentials, accounts, certificates,
provisioning profiles or cloud builds are created by this change. There is no
physical-device pass or backend connectivity claim.

The existing SDK 58 native libraries used by customer screens (including
SecureStore, Crypto and Image) are included in the corresponding Expo Go runtime.
The installed `expo-dev-client` does not force a development build when explicitly
using `--go`. Android signing/LAN plugins do not run inside Expo Go.
**However, physical iPhone App Store Expo Go stops at SDK 54 according to the
current Expo compatibility guidance; SDK 58 is not available there.** Do not
downgrade this working shared app just to use the store client. Custom Expo Go
distribution via TestFlight is outside this milestone and is not proposed here.
Use the prepared EAS development build for an actual SDK 58 iPhone installation.

From Windows without a Mac, an iPhone development build through EAS needs an
Expo account, paid Apple Developer Program membership, a registered device and
authorized signing. The free Apple-account/Xcode development route requires a
Mac and does not apply to this workspace. An EAS simulator build cannot install
on a physical iPhone. No enrollment cost or build entitlement has been authorized.

## First visible screen

The approved original logo is reused without altering its bytes; it is displayed
in full with `contentFit="contain"`, not turned into a new launcher icon.
Without a valid iPhone API URL, a local welcome screen offers Connection help
and Back to welcome. It does not create fake catalogue data or send requests.
Once the environment is configured and Metro restarted, the existing customer
navigation, catalogue, cart, addresses, checkout and order flows are reused.
Network failures retain the existing retry/error states. A standalone signed app
still needs native icon/splash derivatives and device acceptance before release.

## Windows prerequisites and local preparation

Use Node 24 LTS/npm (Node >=22.13 is required by this Expo SDK), Git, and
PowerShell, and an iPhone meeting SDK 58's iOS 16.4+ minimum. The actual iPhone
model/OS has not been verified. `npm.cmd` and `npx.cmd` avoid execution-policy blocks on npm.ps1.
Run package commands inside `C:\Brandista\brandista-mobile\apps\mobile`, never
from the retained root web package. No Xcode or new Expo initialization is needed
for static checks or cloud builds. Do not run `expo run:ios` on Windows.

```powershell
Set-Location C:\Brandista\brandista-mobile\apps\mobile
npm.cmd ci --ignore-scripts --no-audit --no-fund
# Only create when absent; preserve any existing local configuration.
if (!(Test-Path .env.local)) { Copy-Item .env.ios.example .env.local }
npm.cmd run dependencies:check
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
```

`.env.local` is ignored. Editing it and restarting Metro is necessary after an
endpoint change. No environment file containing actual account or API settings
should be committed. Stop the specific Metro instance with Ctrl+C; do not stop
unrelated Android or web development processes.

## Environment configuration

| Variable                   | Meaning and boundary                                                                                                              |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `APP_VARIANT`              | `development` for local development; `production` for staging/release configuration; existing Android `internal-lan` is preserved |
| `EXPO_PUBLIC_APP_ENV`      | `development`, `staging`, or `production`; staging/production prohibit development HTTP/LAN overrides                             |
| `EXPO_PUBLIC_API_BASE_URL` | Public API root, HTTPS, ending exactly in `/api/v1`; no credentials, query or fragment                                            |
| `IOS_BUNDLE_IDENTIFIER`    | Owner-approved reverse-DNS identifier; absent until approved                                                                      |
| `EAS_PROJECT_ID`           | UUID of the owner-approved linked Expo project; absent until approved                                                             |
| `IOS_BUILD`                | Set to `1` by iOS EAS profiles to require identity/project/API before build                                                       |

Start with `.env.ios.example`. Staging and production examples are provided
separately and intentionally have empty required URLs. No placeholder is a real
backend. `EXPO_PUBLIC_*` values are embedded in the JavaScript bundle: never put
passwords, JWTs, Apple credentials, Expo tokens or private keys there.

iPhone configuration always requires an explicit HTTPS API, even for a
development client. It rejects localhost, emulator and bind addresses and the
Android internal-LAN override. Android's existing development default and LAN
build behavior remain available when no new environment override is selected.
No global App Transport Security bypass is added.

When switching from iOS setup back to Android, preserve your files but explicitly
select Android's existing `.env.example` values and restart Metro. `.env.local`
is a shared local file; do not assume per-platform scripts silently select it.

An HTTPS endpoint must be reachable from the iPhone with a certificate it trusts.
Do not open router ports, disable firewalls/TLS, tunnel the backend publicly, or
bind it to public interfaces as an automatic workaround. Provision an authorized
private HTTPS/VPN endpoint with proper access controls in a separate deployment
task. A Metro tunnel serves JavaScript, not the backend API; it does not fix API
reachability and is not automatically enabled here.

## EAS profiles and account setup (owner actions)

Existing Android profiles are untouched. Added profiles:

- `ios-development`: internal physical-device development client; EAS development environment.
- `ios-staging`: internal physical-device build; EAS preview environment, runtime staging policy.
- `ios-production`: production build configuration only; no submission command or automatic deployment.

Before any cloud build, the owner must create/login to the approved Expo
account, enroll in the Apple Developer Program, approve the bundle ID, authorize
linking the correct EAS project and approve signing credential creation/upload.
Supply the approved identifier, project UUID and API URL to the corresponding
EAS environment as well as local config evaluation; they must exist on the build
worker. These non-secret build configuration values should not use EAS secret
visibility because dynamic app config may need them before the remote build.
Keep true secrets out of app configuration and public variables. Existing native
dependency lockfile remains the single source of compatible versions.

After these approvals, owner-run commands are:

```powershell
Set-Location C:\Brandista\brandista-mobile\apps\mobile
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest whoami
# Owner links/initializes only the approved EAS project, then records its UUID.
# Set approved IOS_BUNDLE_IDENTIFIER, EAS_PROJECT_ID and API variables in .env.local
# and in the EAS development environment before continuing.
npx.cmd eas-cli@latest device:create
# Open the registration URL on the iPhone and complete the UDID registration.
# This next command may create/use signing credentials: run only after authorization.
npx.cmd eas-cli@latest build --platform ios --profile ios-development
```

Only devices included in the provisioning profile can install the internal build.
Adding a device can require a rebuild/re-sign. Download/install using the EAS
build's installation page on that registered iPhone. For a development build,
enable Settings > Privacy & Security > Developer Mode when prompted, restart
and confirm. Follow Expo/Apple's actual prompts; do not install unknown profiles.
No TestFlight or App Store submission is part of IOS-001.

## Launching the installed development client

After installing the signed development build on the registered iPhone:

```powershell
Set-Location C:\Brandista\brandista-mobile\apps\mobile
# .env.local must contain the approved reachable HTTPS API and development values.
npm.cmd run ios:dev
```

Keep Windows and iPhone on the same trusted network. Scan the displayed QR code
and open it in the Brandista development client. Grant local-network permission
if requested. A development client uses Metro; the internal staging build embeds
its JavaScript and does not require Metro. Account/profile/config plugins and
native dependency changes require rebuilding the development client.

For an already-installed, SDK-compatible Expo Go runtime only:

```powershell
npx.cmd expo login
npx.cmd expo whoami
# Sign in to the SAME Expo account inside Expo Go on the physical iPhone.
npm.cmd run ios:go
```

This command forces `--go` despite `expo-dev-client` being installed. It is **not
a working App Store Expo Go route for this SDK 58 iPhone project**. Do not use it
as evidence of installation or device acceptance. A free Expo account alone
does not remove the SDK mismatch or the Apple signing requirement.

## Backend contracts inspected and reused

Base paths below are relative to `/api/v1`. Source of truth is the existing
Spring controllers, DTOs, SecurityConfiguration and CHECKOUT-CONTRACT.md,
inspected read-only for IOS-001. No endpoint is invented.

| Capability         | Existing contract                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Registration/login | `POST /registrations` and `/auth/login`; email/password only; login returns bearer token, expiresIn and account id/email/role |
| Customer profile   | Login identity is displayed; no customer profile GET/edit endpoint is present, so none is added                               |
| Catalogue          | `GET /brands`, `/categories`, `/products`, `/products/{slug}`; public availability and stockQuantity come from server DTOs    |
| Cart               | `/customers/me/cart`, POST/PATCH/DELETE item operations; no client price authority                                            |
| Addresses          | Owned CRUD/default under `/customers/me/addresses`                                                                            |
| Checkout           | GET `/customers/me/checkout/config`; POST `/customers/me/checkout/preview` with addressId; server quote and totals            |
| COD order          | POST `/customers/me/orders` with addressId/quoteToken and stable Idempotency-Key; enabled only by backend configuration       |
| History            | GET `/customers/me/orders` and `/{id}`, scoped to authenticated customer                                                      |
| Authorization      | Public discovery/login/registration; CUSTOMER required for customer endpoints; privileged administration is separate          |

The mobile session layer already rejects administrator login identities, expiry
and invalid restored sessions. JWTs stay in SecureStore (device-only accessibility
on iOS); passwords are not persisted. Administrators cannot register through a
customer role field. There are no mobile admin routes. Client route gates are
UX boundaries; server authorization remains authoritative.

## Checks, CI and acceptance boundary

```powershell
npm.cmd run dependencies:check
npx.cmd expo-doctor@latest
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
$env:APP_VARIANT='development'
$env:EXPO_PUBLIC_APP_ENV='development'
# Deliberately non-routable; only for config/export checks, never runtime acceptance.
$env:EXPO_PUBLIC_API_BASE_URL='https://api.example.invalid/api/v1'
npm.cmd run config:check
npm.cmd run bundle:ios
npm.cmd run bundle:android -- --output-dir dist/android
```

The new `ios-quality.yml` runs from `apps/mobile` without EAS secrets, build
credentials or cloud builds. Android's existing workflow is unchanged. Both may
run for shared-source changes. The static `.invalid` CI URL prevents a false live
backend claim. All build/cache outputs remain ignored.

On the physical iPhone, record device/OS/build/API provenance, launch and welcome,
setup navigation, network error/retry, login/registration, secure-session restart,
expiry/logout, keyboard/safe areas, catalogue/brand/product navigation, cart,
address defaults, backend-enabled COD retry behavior and customer-owned orders.
Use approved disposable test accounts; do not place real orders for a smoke test.
Until recorded, these remain NOT TESTED. A Metro/Hermes export is not a native
build or a physical iPhone test.

## Troubleshooting

- SDK mismatch in Expo Go: use the development build route; do not downgrade shared dependencies.
- Sign-in error in physical iOS Expo Go: CLI and Go must use the same Expo account.
- Setup screen: URL is absent/invalid; supply the approved HTTPS API and restart Metro.
- Reachability: check Wi-Fi isolation, local-network permission, correct Metro QR, API DNS/TLS and VPN access; do not weaken backend security.
- PowerShell execution policy: use npm.cmd/npx.cmd, not policy changes.
- Missing bundle/project: build guards intentionally stop before provisioning; obtain approved values.
- Native module mismatch: rebuild the development client after native dependency/config changes.
- Dependency diagnostics: preserve all tests and report failures; never suppress warnings just to pass CI.

## IOS-002 recommendation

Only after owner account/signing/network prerequisites are ready: produce the
first authorized SDK 58 development build, install it on the registered iPhone,
run and record the acceptance scenarios above against the approved HTTPS
backend, then resolve device-specific defects. No IOS-002 work starts here.

## Official references checked for this SDK

- [SDK 58](https://docs.expo.dev/versions/v58.0.0/)
- [Expo Go version mismatch](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/)
- [Physical iOS Expo Go sign-in](https://docs.expo.dev/troubleshooting/expo-go-sign-in-required/)
- [Development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Internal distribution](https://docs.expo.dev/build/internal-distribution/)
- [Developer Mode](https://docs.expo.dev/guides/ios-developer-mode/)
- [EAS environment variables](https://docs.expo.dev/eas/environment-variables/)
- [SecureStore SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/)
