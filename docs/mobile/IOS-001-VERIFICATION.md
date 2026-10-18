# IOS-001 verification report

## Outcome

The existing Expo application at `apps/mobile` is prepared for an iOS development
build from Windows. Physical iPhone installation and backend acceptance remain
blocked by owner account/signing/network prerequisites. No native build or
device pass is claimed.

REPO-003 was confirmed merged through mobile PR #14. Base main:
`2f6e77409622141fd6d7775aef71ad60e7d088b0`. Feature branch:
`codex/ios-001-foundation`. No root iOS application, Android replacement, backend
change, web frontend change or legacy web removal was made.

## Implementation

- Reused all existing Expo Router customer screens, strict TypeScript,
  TanStack Query, SecureStore, API adapters and customer-only session handling.
- Added a branded setup screen for missing/invalid iPhone API configuration,
  local setup navigation, and reusable empty/connection feedback.
- Reused the unchanged approved original logo and configured Metro to resolve
  the shared asset through this native package's dependencies.
- Added iOS-only EAS development/staging/production profiles and environment
  templates. Identity/project/API guards stop incomplete signed-build setup.
  No bundle ID or EAS project was invented.
- Added iOS quality CI and Windows/iPhone runbook. Existing Android CI, profiles,
  scripts, plugins and application IDs were preserved.
- Aligned Expo-recommended SDK 58 patches and Jest 30 using `expo install --fix`.
  React remains 19.3.0; React Native remains 0.88.0; SecureStore remains 58.0.2.

## Validation on Windows, 2026-10-17

| Check                                                                 | Result                                                                                                    |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Clean install from updated lockfile                                   | Passed; 1,368 packages                                                                                    |
| Expo dependency compatibility                                         | Passed: dependencies up to date                                                                           |
| Expo Doctor after Metro configuration                                 | Passed: 20/20 checks                                                                                      |
| TypeScript                                                            | Passed                                                                                                    |
| ESLint including Metro config                                         | Passed                                                                                                    |
| Jest                                                                  | Passed: 36 tests across 10 suites; all original 26 tests retained                                         |
| API contract/authorization checks                                     | Passed mocked adapter tests and customer-only session tests; backend controllers/DTOs inspected read-only |
| Expo public configuration                                             | Passed: SDK 58, Android and iOS; no approved iOS identity/project configured                              |
| iOS Metro/Hermes export                                               | Passed: 1,238 modules, original logo included                                                             |
| Android Metro/Hermes export                                           | Passed: 1,231 modules, original logo included                                                             |
| CI YAML and working directory                                         | Parsed and checked; `apps/mobile`; read-only repository permission                                        |
| Original logo SHA-256                                                 | Unchanged: `8ef9793e563c0f5cc28e508bb359c85fc53f5cba6d471eea7d4d926c38d5bfae`                             |
| Native compilation, signing, iPhone installation, live API acceptance | Not run                                                                                                   |

Initial dependency diagnostics failed on SDK patch/Jest compatibility and were
resolved through the Expo installer. Initial exports failed on sibling asset
resolution; the final Metro configuration fixes folder visibility and native
dependency resolution, and both exports passed. No test was removed or disabled.

### Host development-server check

Expo's loopback `localhost` listener served the iOS development bootstrap bundle
with HTTP 200; its JavaScript bootstrap structure was verified. The test server
was stopped afterward. Earlier attempts combined incompatible CLI host flags or
targeted an IPv4 listener that was not available. A subsequent assertion looking
for literal welcome-screen text in the bootstrap bundle failed; lazy loading is
present, and this is not evidence of a rendered screen. Setup navigation is
covered by component tests, while actual iPhone rendering remains unverified.
No backend call or physical-device connection was made in this host check.

## Security review and release boundaries

iPhone endpoints require explicit HTTPS, with no localhost/emulator fallback,
embedded credentials, query or fragment. Staging/production cannot enable the
Android development HTTP/LAN override. Invalid configuration refuses transport
and displays setup without creating a fake API connection. Actual environment
files, credentials, caches and exports remain ignored. Lockfile URLs were checked
for embedded credentials. No backend exposure or transport-security bypass was
introduced.

`npm audit --omit=dev` reported 48 advisories (21 high, 27 moderate, zero critical)
in the dependency tree, including transitive build tooling. This does not prove
native runtime exploitability, nor is it a clean security audit. Upstream
`braces` and `node-forge` advisories are among the causes. No forced major
upgrade/downgrade or unverified override was applied. Dependency advisory
remediation is a release blocker/follow-up even though SDK compatibility passes.
Do not publish this foundation as production-ready.

## iPhone/EAS readiness

The owner confirmed no accounts, identifiers or API endpoint are prepared;
Expo CLI reports `Not logged in`. Current official Expo guidance says physical
iPhone App Store Expo Go stops at SDK 54, so it cannot run this SDK 58 project.
Corresponding SDK 58 libraries may be included in a compatible Go runtime, but
that does not make the App Store client compatible. No TestFlight workaround is
attempted.

A physical iPhone build from Windows therefore needs an Expo account, paid
Apple Developer Program membership, an approved bundle ID/EAS project,
registered iPhone, authorized signing, and a reachable protected HTTPS backend.
EAS profiles are prepared; cloud ownership, entitlements, signing and native
build execution are not verified. No certificates or provisioning profiles were
created/uploaded and no cloud build or store submission was sent.

See [iPhone guide](IOS-001-IPHONE-GUIDE.md) for exact conditional account,
registration, build and launch commands, environment examples and troubleshooting.
After the signed development client is installed and `.env.local` is configured,
launch from `apps/mobile` with `npm.cmd run ios:dev` and scan its QR code on the
same trusted network. There is no currently installable iPhone build URL.

## Files and preservation

Changes are confined to this repository:

- Root/native READMEs, this report and `IOS-001-IPHONE-GUIDE.md`.
- Native `.gitignore` and three safe `.env.ios.*` examples.
- Native `app.config.ts`, `eas.json`, `package.json`, lockfile and `metro.config.js`.
- Expo-generated TypeScript include entries for route types and `expo-env.d.ts`, with strict mode preserved and rechecked.
- Native runtime/API configuration, root layout and home screen.
- New `src/ui/brand.tsx`, `setup.tsx`, `feedback.tsx`.
- Existing API test additions and new app-config, iOS-foundation and runtime-config tests.
- New `.github/workflows/ios-quality.yml`.

Generated native folders remain absent. Uzair's unpublished Android source was
not accessed. Shared Expo code/dependencies changed intentionally for this
foundation; an APK/native Android regression build has not been performed.

Recommended IOS-002: once the owner prepares and authorizes the missing
prerequisites, produce/install the first iPhone development build and record
customer-flow and security/session acceptance on the actual device. No IOS-002
implementation is started here.
