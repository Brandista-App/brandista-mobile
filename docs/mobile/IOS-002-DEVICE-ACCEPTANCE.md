# IOS-002 iPhone build and customer acceptance

Review date: 2026-10-18. **Physical iPhone acceptance is BLOCKED.** No signed
build, device registration, backend deployment, or live customer test occurred.

## Foundation and scope

IOS-001 [PR #15](https://github.com/Brandista-App/brandista-mobile/pull/15) is
merged. Remote default branch is `main`, verified and fetched at
`b5edfc9387210533fb5a2b4d3c1e44e91d524b8e`. The checkout was clean before creating
`codex/ios-002-device-acceptance` from `origin/main`.

Reviewed [IOS-001 verification](IOS-001-VERIFICATION.md) and
[iPhone guide](IOS-001-IPHONE-GUIDE.md). Existing `apps/mobile` remains the app:
Expo 58.0.14, React 19.3.0, React Native 0.88.0, Expo Router 58.0.23.
`eas.json` already defines `ios-development` (development client/internal,
physical device), `ios-staging`, and `ios-production`. Existing configuration
requires approved identity, project UUID, and HTTPS `/api/v1` endpoint for
`IOS_BUILD=1`. Nothing was recreated or moved.

## Account, signing, and backend readiness

| Requirement                                        | Verified state                                                                                                               |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Expo CLI authentication                            | `expo whoami`: Not logged in                                                                                                 |
| EAS project                                        | EAS CLI: Not logged in; no configured project UUID; remote ownership/readiness unverified                                    |
| Approved iOS bundle identifier                     | Not supplied/configured; no official identifier invented                                                                     |
| Apple Developer enrollment and signing permissions | Unverified; no authenticated Apple session or evidence supplied                                                              |
| Registered iPhone and Developer Mode               | Unverified; no device registration attempted                                                                                 |
| Signed development build                           | BLOCKED; no cloud build/signing executed                                                                                     |
| Authorized HTTPS test backend                      | Not supplied/configured; no reachability or TLS test possible                                                                |
| GitHub publication                                 | Public HTTPS fetch works; SSH authentication initially failed (publickey); publication result recorded in milestone delivery |

Checked configuration presence without printing secrets. `IOS_BUNDLE_IDENTIFIER`,
`EAS_PROJECT_ID`, and `EXPO_PUBLIC_API_BASE_URL` were unset; `.env.local`,
`.env.development.local`, `.env.production.local`, and `credentials.json` absent.
No account was created, subscription purchased, device registered, or signing
material collected. The developer must authenticate interactively, never by
sending passwords, keys, tokens, or recovery codes in chat.

## HTTPS backend decision requiring approval

Read-only review of the sibling backend found:

- `compose.yaml`: MySQL defaults to loopback `127.0.0.1:3307`; API defaults to
  loopback `127.0.0.1:8080`. Keep MySQL internal and use a separate test database.
- `compose.demo.yaml` and `deploy/nginx.conf`: HTTP storefront on loopback 8090,
  broad `/api/` proxy, actuator blocked. This is not an approved public TLS ingress:
  the broad proxy also reaches privileged API paths.
- Spring Security permits registration/login and public catalogue reads, requires
  CUSTOMER for `/api/v1/customers/**`, and retains administrative/merchant rules.
  Preserve these rules. JWT lifetime defaults to 15 minutes; COD defaults off.
- Existing customer APIs cover registration, login, brands/categories/products,
  cart, addresses, checkout preview/config, and orders. Order placement requires
  an `Idempotency-Key` UUID and returns 201 for creation / 200 for replay. This is
  source inspection, not evidence of deployed behavior.

Approve one infrastructure option before implementation:

1. A private VPN-reachable test host with a DNS hostname and publicly trusted TLS
   certificate. The iPhone must have authorized VPN access. Bind the API behind
   an HTTPS reverse proxy; keep database and management traffic private.
2. An isolated staging host with trusted HTTPS, test-only database/accounts,
   restricted ingress, and an explicit customer API allowlist. Deny
   `/api/v1/admin/**`, `/api/v1/super-admin/**`, `/api/v1/merchant/**`, actuator,
   and every unneeded route at ingress in addition to backend authorization.

Required customer ingress routes: POST `/api/v1/registrations` and
`/api/v1/auth/login`; GET `/api/v1/brands`, `/api/v1/categories`,
`/api/v1/products` and product details; authenticated customer cart, addresses,
checkout, and order endpoints under `/api/v1/customers/me/**`. Preserve HTTP
methods, Authorization, Idempotency-Key, and API error responses. Review the
allowlist against the deployed revision before exposure. Do not publish the
existing broad demo proxy unchanged or expose database ports. No tunnel, DNS,
firewall, hosting, backend configuration, or backend code was changed.

The owner must approve host/cost/access policy, TLS/domain, test-data lifecycle,
and whether COD may be enabled in that isolated environment. Store backend
secrets outside Git; `EXPO_PUBLIC_*` values are embedded in client bundles and
must contain no secrets. Configure the approved URL ending `/api/v1` in the
ignored local environment and corresponding EAS environment. Never use localhost
as the iPhone API hostname. Static export placeholders do not establish backend
readiness.

## Commands prepared; execution gates

In `C:\Brandista\brandista-mobile\apps\mobile`, the developer can authenticate:

```powershell
npx.cmd expo login
npx.cmd expo whoami
npx.cmd eas-cli@latest whoami
```

After an owner approves the bundle identifier, existing/new Expo project, and
HTTPS environment, configure `IOS_BUNDLE_IDENTIFIER`, `EAS_PROJECT_ID`, and
`EXPO_PUBLIC_API_BASE_URL` using the IOS-001 guide. Check project ownership with
`npx.cmd eas-cli@latest project:info`. If no project exists, request explicit
authorization before `npx.cmd eas-cli@latest init`; never let a build implicitly
create one without approval. Verify active Apple Developer Program membership
and team signing permissions directly in the owner's Apple developer account.

**The following commands are prepared only. They require explicit authorization
for device registration, signing, and cloud compilation before execution:**

```powershell
npx.cmd eas-cli@latest device:create
npx.cmd eas-cli@latest build --platform ios --profile ios-development
```

Confirm the same approved EAS project/environment and Apple team, register only
the approved physical iPhone, then install the resulting development build and
enable Developer Mode as required. Start Metro on an approved private network
with `npm.cmd run ios:dev`. Do not submit to TestFlight or the App Store.
Cloud compilation, installation, and launch are separate checks; record each.

Official references: [internal distribution](https://docs.expo.dev/build/internal-distribution/),
[EAS environment variables](https://docs.expo.dev/eas/environment-variables/),
[iOS Developer Mode](https://docs.expo.dev/guides/ios-developer-mode/).

## Physical iPhone acceptance ledger

All rows are **BLOCKED** by the absent authorized signed iPhone build and HTTPS
test backend. Automated unit tests and JavaScript exports cannot pass these rows.
No sample account, product ID, address, token, or order was invented.

| #   | Scenario                                | Status  | Required execution/evidence                                                                    |
| --- | --------------------------------------- | ------- | ---------------------------------------------------------------------------------------------- |
| 1   | Application launch                      | BLOCKED | Install/launch on approved iPhone; record model, iOS, build ID                                 |
| 2   | Customer registration                   | BLOCKED | Register authorized test customer; verify response and UI                                      |
| 3   | Login and logout                        | BLOCKED | Test valid/invalid login and cleared session after logout                                      |
| 4   | Session restoration and expiration      | BLOCKED | Relaunch with valid session; verify actual expired-session behavior                            |
| 5   | Brand discovery                         | BLOCKED | Verify authorized test catalogue brands                                                        |
| 6   | Product catalogue and details           | BLOCKED | Verify catalogue/details against actual seeded products                                        |
| 7   | Add to cart                             | BLOCKED | Add real test product; verify server cart                                                      |
| 8   | Quantity update and removal             | BLOCKED | Update/remove test item; verify totals and server state                                        |
| 9   | Customer address management             | BLOCKED | Create/edit/default/delete authorized test address                                             |
| 10  | Cash-on-delivery checkout               | BLOCKED | Confirm approved test COD enabled and checkout totals                                          |
| 11  | Order creation and duplicate protection | BLOCKED | Repeat same authorized order request/key; verify one order and replay response                 |
| 12  | Order history and details               | BLOCKED | Verify created test order and customer ownership                                               |
| 13  | Network failure and retry               | BLOCKED | Interrupt approved network; verify recovery without duplicate order                            |
| 14  | Unauthorized access                     | BLOCKED | Verify unauthenticated/expired credentials denied; second test customer's records inaccessible |

Record timestamp, sanitized request/result, build/backend revision, and observed
UI for each eventual run; exclude credentials and personal data. If a row fails,
record FAIL and reproduction. Never replace a blocked row with PASS based solely
on code inspection.

## Dependency security and local validation

See [dependency security review](IOS-002-DEPENDENCY-SECURITY.md). No safe compatible
advisory fixes were available; no dependencies or application behavior changed.
Validation results are recorded below after execution. Hosted CI and physical
device acceptance must be reported separately from local checks.

Local commands use Node 24 and the existing SDK 58 lockfile. Export/config checks
use `https://api.example.invalid/api/v1` solely as a non-routable static
placeholder, never as an approved backend or evidence of reachability.

| Check                                                 | Result                                                           |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| `npm ci --ignore-scripts --no-audit --no-fund`        | PASS; 1,368 packages installed                                   |
| `npm run dependencies:check`                          | PASS; dependencies up to date                                    |
| `npx expo-doctor`                                     | PASS; 20/20 checks                                               |
| `npm run typecheck`                                   | PASS                                                             |
| `npm run lint`                                        | PASS                                                             |
| `npm test`                                            | PASS; 36 tests / 10 suites                                       |
| `expo config --type public --json`                    | PASS with static development configuration                       |
| `IOS_BUILD=1` without approved identity/project       | PASS; expected configuration rejection, no signing invoked       |
| `npm run bundle:ios`                                  | PASS; Hermes JavaScript export to ignored `dist/ios`             |
| `npm run bundle:android -- --output-dir dist/android` | PASS; Hermes JavaScript export to ignored `dist/android`         |
| iOS/Android workflow YAML parse                       | PASS; both have trigger and jobs definitions                     |
| Git whitespace/diff review                            | PASS; only IOS-002 documentation and iOS CI path trigger changed |
| Hosted GitHub CI / native compilation                 | NOT TESTED locally; no hosted result claimed                     |
| iPhone runtime / HTTPS integration                    | BLOCKED; prerequisites absent                                    |

Raw local command logs live under ignored `apps/mobile/.expo/ios-002-*`.
No backend tests were run because the backend was inspected read-only and not
changed. JavaScript exports are not native IPA/APK builds or device acceptance.

The only CI change adds `docs/mobile/IOS-002*` to the existing iOS quality
workflow path filter. The existing Android workflow and all Android build
profiles are unchanged.

## Publication result

Local feature branch committed; working tree clean after commit. Push to the
canonical HTTPS origin failed with HTTP 403: the stored account
`wajahatsyed1257` lacks write permission. The Brandista SSH alias also returned
`Permission denied (publickey)`. No credentials or account settings were changed.
The feature branch is not published, so no draft PR or hosted CI run was created.

To publish after restoring the authorized Brandista SSH identity, the developer
can run these commands interactively (enter the key passphrase only in the local
terminal, never in chat):

```powershell
ssh-add C:\Users\lenovo\.ssh\id_ed25519_brandista
ssh -T github-brandista
git -C C:\Brandista\brandista-mobile push git@github-brandista:Brandista-App/brandista-mobile.git codex/ios-002-device-acceptance
```

Then open a draft PR targeting `main` for that branch using an authorized GitHub
account. Do not merge automatically. No remote branch or PR URL is claimed until
publication succeeds.

## Developer next actions

1. Authenticate Expo interactively; provide only approved non-secret identifiers
   and confirm Apple team enrollment/signing permission.
2. Approve a backend option above and its test-data/COD policy. Provisioning and
   network exposure remain paused until explicit approval.
3. Configure approved bundle ID, EAS project UUID, and trusted HTTPS URL; verify
   project ownership and API reachability from the actual phone.
4. Explicitly authorize device registration, signing, and EAS development build.
5. Install on the approved iPhone and execute all 14 ledger rows using authorized
   test records. Resolve security advisories through supported upstream fixes
   before any release decision.

Backend code, Android source/profiles, Uzair's unpublished Android work, legacy
root web source, existing Expo source, and original logo are preserved.
