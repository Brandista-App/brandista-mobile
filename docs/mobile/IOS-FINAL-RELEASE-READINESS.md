# IOS-FINAL-001 — recovered shared iOS customer application

Audit started 2026-10-24; resumed 2026-10-25, Asia/Karachi. Continue the existing Expo SDK58 / React Native0.88 / React19.3 application. No new application, backend, merchant portal or Android redesign is introduced. The deliverable is an offline-capable iOS customer build path plus accurately separated source, automation, Simulator and personal-device evidence. Live shopping and commercial release are not certified.

## Platform repository audit

All four remote refs were fetched before work. Initial working trees were clean; historical local branches and existing containers were preserved. Only the mobile repository is changed. Its new `codex/ios-final-001` branch starts at the actual merged main below, rather than recreating PR24 or assuming its previous open state persists.

| Repository | Verified main | Current integration and review status |
| --- | --- | --- |
| brandista-mobile | b9c448cc9bfdd7d888be2cf309adc46ef72585bc | PR24 **MERGED**, 2026-10-24T15:06:56Z; includes offline showcase and SDK58 CI repair28309d8. No other open mobile PR before this milestone. |
| brandista-mvp | 302d8690c478a2dad15bb7c7def7b93a937b251f | PR28 **MERGED** at13:38:51Z, PR27 **MERGED** at13:39:20Z. No open backend PR at audit. Test and deployment-template additions coexist; application `src/main` tree is byte-identical to prior4c7d09c. |
| brandista-admin | a175bee5c26acb1884f3cc38570f25eb40027bdf | PR5 **MERGED** at13:40:29Z. Shared super-admin/merchant portal, invitation acceptance and illustrative presentation retained. Latest verification155 tests/build/audit passed. |
| brandista-frontend | 3c6432e4326f9d658892b0985e238c22bac3b651 | PR3 remains **OPEN**: responsive public onboarding explanation/artifact CI. Existing main has customer web/auth/cart/address/COD/history; the new explanatory journey needs owner review separately. PR3 is not a mobile API dependency. |

Backend migrations V1–V14 remain present, covering users, brands, categories, products, addresses/cart, applications, orders/inventory, grants/bootstrap/audit, memberships, invitations and merchant fulfillment. No migration is added or modified. Their applied state in the existing running database is **UNVERIFIED**; repository presence is not database acceptance.

The existing backend container reports running, but its loopback health request timed out after10 seconds during this audit. The earlier HTTP503 is historical evidence, not assumed current success. No approved phone-reachable HTTPS backend is verified. No database credential, account, grant, password, volume or bootstrap marker was reset. No public route or service was created. Existing isolated backend evidence includes191 tests plus18 invitation/onboarding and20 fulfillment MySQL tests; it is not proof that the current container or phone integration is healthy.

Links: [mobile24](https://github.com/Brandista-App/brandista-mobile/pull/24), [admin5](https://github.com/Brandista-App/brandista-admin/pull/5), [backend27](https://github.com/Brandista-App/brandista-mvp/pull/27), [backend28](https://github.com/Brandista-App/brandista-mvp/pull/28), [public web3](https://github.com/Brandista-App/brandista-frontend/pull/3).

## Existing iOS work recovery

Read and retained [TEST-001-VERIFICATION.md](TEST-001-VERIFICATION.md) and [TEST-001-DEFECTS.md](TEST-001-DEFECTS.md), plus existing IOS-001/IOS-002 build/configuration and device-readiness files. The TEST-001 implementation31d42c6 is an ancestor of current main, merged through PR22/88b7c66. Remote IOS-001, IOS-002, IOS-002B and TEST-001 branches still exist; their valid work is already integrated, not lost or awaiting a parallel rewrite.

Both confirmed TEST-001 fixes remain in source and regression coverage:

- `uncertain()` retains the saved checkout request/key for HTTP408/429, as well as other uncertain outcomes.
- UUID attempt creation remains inside checkout's guarded cleanup, so crypto failure shows a recoverable error without placing an order or leaving the screen locked.

The historical65 tests/13 suites were superseded by72 tests/14 suites after showcase coverage and the reviewed SDK patch alignment. This milestone adds focused offline-build and no-live-transport regressions. Historical audit vulnerability counts are not reused as current counts. Native iPhone acceptance was never established by TEST-001 and is not retroactively claimed.

## Targeted implementation

The existing design, original approved logo, three fictional brands, six option-bearing products, bundled editorial imagery, search/filtering, local bag and simulated checkout remain shared. Native geometric tab icons require no remote font. The deliberate light theme, dark status-bar content, SafeAreaProvider/SafeAreaView, keyboard avoidance, scroll resets, accessible labels and minimum button heights remain. iOS headings now use the documented native `ui-serif` family; Android keeps `serif`. System-provided typography works offline without remote font fetching.

The original build guard coupled every signed iOS build to an EAS project and configured HTTPS service. An explicit `IOS_OFFLINE_SHOWCASE=1` path now permits a local Personal Team/Simulator build with an owner-selected bundle identifier and `EXPO_PUBLIC_OFFLINE_SHOWCASE=1`, but rejects an API endpoint or Android LAN override. It does not require an EAS project for local Xcode. Normal live iOS identity/EAS/HTTPS guards are retained. Offline-only builds refuse live transport; existing live source is preserved for a separately configured and accepted environment.

No tokens, Apple credentials, signing assets, admin functionality or real customer data are bundled. Demo/live storage, API adapters and checkout idempotency remain separate. Customer administration continues through the existing web portal.

## Functionality and evidence boundaries

See the scenario-by-scenario [IOS-DEVICE-ACCEPTANCE.md](IOS-DEVICE-ACCEPTANCE.md). Automated component tests use synthetic fixtures and mocked native boundaries; they are not UIKit, Keychain, gesture or physical-phone evidence. The existing API adapters match current backend routes for registration/login, public brands/products/categories, customer cart, owned addresses, COD quote/order and history. Totals, stock and order ownership remain server-controlled. No image/SKU/payment/courier contract is invented.

The release Simulator job extends the existing iOS workflow and runs only by explicit manual input. One standard `macos-26` job is bounded to45 minutes, depends on successful static quality, uses Node24, CNG and CocoaPods, then Xcode Release with signing disabled **for Simulator only**. It verifies an embedded Hermes bundle, Simulator Mach-O platform, original runtime-logo hash, bundled imagery, transport policy and no device profile. It attempts boot/install/launch/relaunch and captures screenshots; those must be visually reviewed before assigning a render PASS. Actual toolchain, minimum OS, permissions, checksums and source SHA are artifact evidence rather than guessed compatibility values.

No EAS build, paid enrollment, App Store upload, production signing, privileged runtime account or public backend deployment is performed. The existing signed Android showcase APK is unchanged. Existing Android CI provides regression verification; no new standalone Android candidate is requested.

## Current security assessment

The existing [FINAL-001-SECURITY.md](FINAL-001-SECURITY.md) describes five high affected package entries and zero critical findings, on node-forge/Zod and inherited Expo tooling paths. Dependencies are unchanged by this iOS milestone; fresh audit output is retained in the evidence directory and final verification below. No forced downgrade, unsupported major override, advisory suppression or relaxed ATS/certificate check is used. The previous internal-testing exception ends **2026-11-05** and is not extended or expanded into commercial approval.

Real sessions and pending order retries use endpoint-scoped SecureStore with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`; passwords are not persisted. Restored customer sessions validate expiry and role. Matching401 clears the current session; stale requests cannot clear a replacement session. Logout clears storage/cache/memory. These mechanisms have automated coverage; actual iOS Keychain, reinstall behavior, device lock, biometrics and background expiry need device acceptance. Demo storage contains only fictional product/option quantities. Client error handling is bounded and sanitized; no runtime console logging or privileged customer routes are introduced.

Simulator signing-disabled output is a `.app` for Simulator, not a device IPA. There are no approved signing/provisioning assets available to this run for a physical iPhone. No fake IPA is produced. The owner uses Xcode Personal Team locally for legitimate personal testing; see the exact [installation handoff](IOS-PERSONAL-IPHONE-INSTALLATION.md).

## Verification record

Runtime implementation begins at f9af4af on the reviewed merged baseline. Raw local/hosted logs and artifacts are retained outside Git under `D:\brandista workplace\IOS-FINAL-001-evidence`. The final verified results, run links, artifact provenance and remaining native/device gates are appended here after verification. Until a result is recorded, it is not claimed PASS.

## Owner action and remaining gates

Use an authorized Mac with Xcode and the personal iPhone; choose an owner-controlled test identifier, set the offline flags, select **Personal Team**, and run the scheme in **Release**. The owner signs in and approves trust/Developer Mode locally. Free provisioning expires after seven days and requires rebuild/reinstall. No Apple password or certificate needs to be shared. [Apple's Personal Team limits](https://developer.apple.com/help/account/basics/about-your-developer-account).

Physical-device installation/first-launch-airplane-mode, several iPhone sizes, VoiceOver/Dynamic Type, keyboard/safe areas, native navigation and Keychain remain acceptance gates. Live shopping additionally requires an approved reachable trusted-HTTPS backend and isolated customer/COD acceptance. Public deployment is not required for offline presentation, and this report does not authorize public exposure. Commercial production readiness remains blocked by security, signing, live operational and device gates.

## Resumed verification — 2026-10-25

All four remote main refs were fetched again and remain at the audited commits above. Backend/admin/mobile had no open PR before this handoff; frontend PR3 remains open. The resumed loopback backend health check was refused at 127.0.0.1:8080, so no live backend or phone shopping acceptance is claimed.

[Initial native run 40106403061](https://github.com/Brandista-App/brandista-mobile/actions/runs/40106403061) passed the complete quality job (74 tests/14 suites, TypeScript, ESLint, dependency/config validation and iOS export). CNG and CocoaPods passed, and Xcode26.6 / build17F113 completed a genuine Release Simulator native compile for arm64 and x86_64, deployment target16.4. The overall job failed afterwards because the artifact verifier searched only UTF-8 for a mode label containing a Unicode middle dot; Hermes can store that string as UTF-16. No install/launch was reached in that attempt, and its logs-only artifact must not be presented as a downloadable application.

Commit d17f939 corrects the verifier to recognize UTF-8 or UTF-16LE strings while retaining Hermes magic, platform, assets, logo and ATS checks. A single bounded corrected run is [40184802838](https://github.com/Brandista-App/brandista-mobile/actions/runs/40184802838). Its final results will be recorded after completion. Fresh production audit retained five high package entries and zero critical findings. Local resumed typecheck passed; remaining checks are being recorded from their actual results.
Resumed local verification: strict TypeScript **PASS**, ESLint **PASS**, Expo Doctor **20/20 PASS**, Android Hermes export **PASS**. The fresh 2026-10-25 production audit again reports five high affected package entries and zero critical; nonzero audit exit reflects these findings. The PR25 iOS and Android quality jobs at documentation commit93431de both pass, including current test/config/dependency/export checks. No app/dependency code changed after d17f939; subsequent changes are handoff documentation only.

The Personal Team guide also preserves offline flags in ignored `.env.local` for Xcode-initiated bundling, rather than relying on the macOS GUI process inheriting terminal exports. The owner must inspect higher-priority development/production local dotenv files for conflicts. Apple Personal Team limits and Expo SDK58 environment loading were rechecked against their official documentation on 2026-10-25.
Android native regression: [run40184950873](https://github.com/Brandista-App/brandista-mobile/actions/runs/40184950873) **PASS** for quality and both debug APK native architectures (`arm64-v8a`, `armeabi-v7a`). These are development regression artifacts, not a new signed standalone showcase release. iOS PR quality [run40184950853](https://github.com/Brandista-App/brandista-mobile/actions/runs/40184950853) also **PASS**; its Simulator job is intentionally skipped because native Simulator builds require explicit manual dispatch. The separate manual native run is recorded independently above.
## Final native result and download

**PASS:** [corrected manual run40184802838](https://github.com/Brandista-App/brandista-mobile/actions/runs/40184802838), quality plus actual Simulator native job. Source `d17f939473683b782005ba7754315e74dfe218da`; subsequent commits change documentation only. Xcode26.6 / build17F113; iPhone17 Pro Simulator running iOS26.4; compiled minimum iOS16.4. The Release application installed, launched, terminated and relaunched without Metro. Both screenshots were downloaded and visually reviewed: original logo, bundled image, native serif headings, demo banner, tab icons and initial-screen status/cutout spacing render correctly. No interactive checkout, changed-cart persistence, airplane mode, other-size or physical-device PASS is inferred.

[Download Brandista-iOS-Simulator artifact](https://github.com/Brandista-App/brandista-mobile/actions/runs/40184802838/artifacts/12595594386), retained by GitHub for14 days from the build. This is a Simulator application, **not an installable iPhone IPA**. Extract the outer workflow archive, then the inner `Brandista-Simulator.app.zip` using the Mac procedure. The inner ZIP's independently checked SHA256 is `9e1e9abaae5e4ac9e54c56aba45a5b5e9f26c2042c7e06eaeae82a5da6cd9025`.

Compiled verification confirms Simulator platform, embedded Hermes bundle2,785,863 bytes,26 bundled image files, exact approved-logo hash and no device provisioning profile. ATS has arbitrary loads disabled; Expo's generated local-networking allowance remains present and is not proof of a configured/reachable API. The generated Face ID purpose string is from SecureStore configuration; this application does not claim biometric-login acceptance. No signing credential or live backend URL is bundled.

Local artifact, screenshots and logs: `D:\brandista workplace\IOS-FINAL-001-evidence\simulator-verified`. [PR25](https://github.com/Brandista-App/brandista-mobile/pull/25) contains this milestone; no merge is performed. The owner's remaining action is the documented Mac/Xcode Personal Team Release installation and actual device acceptance. Live shopping remains blocked by the unavailable verified phone-reachable backend; the five high dependency entries still block commercial clearance.