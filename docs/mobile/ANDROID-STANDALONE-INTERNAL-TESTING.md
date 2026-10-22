# AND-021 — Standalone Android internal testing

This supersedes the historical LAN runbook for AND-021. No backend, proxy, firewall or database setup is authorized by this task.

## Compatibility and existing state

Expo 58.0.17 / React Native 0.88.0 / React 19.3 and Hermes are retained with New Architecture and Expo native source builds. AND-020 commit 96e2161 (open PR20, not merged) successfully built both ARM ABIs in run 39770843797; all 28 debug native-library names matched and ELF headers were verified. Its debug APK requires Metro. Report commit 202e6b6 is preserved in Git and is not assumed merged; its device acceptance report is absent from this branch. Evidence remains in D:\Brandista Workplace\AND-020-evidence and AND-020-armv7-evidence.

Android minimum: API24 (Android 7.0), target API36. Recorded Samsung SM-A115F: Android11/API30, armeabi-v7a userspace; meets minimum. No device is currently connected. Legacy armeabi is not supported. Standalone packaging is separately gated on both ABIs, identical native-library names and ELF32 ARM / ELF64 AArch64 headers, including Hermes, React Native and Expo core. Build success alone is not physical-device acceptance.

## Build and download

Use the existing Android native quality workflow, manually dispatched on codex/and-021-standalone-internal-apk:

```powershell
gh workflow run android-quality.yml --repo Brandista-App/brandista-mobile --ref codex/and-021-standalone-internal-apk -f standalone=true -f backend_mode=placeholder
```

The placeholder is exactly https://backend-not-configured.invalid/api/v1. It is deliberately nonfunctional; login, catalogue and checkout require backend configuration before shopping tests. No loopback endpoint is embedded. For an explicitly owner-approved nonproduction HTTPS backend, dispatch backend_mode=https and api_base_url=https://APPROVED-HOST/api/v1; the workflow checks the catalogue contract before building. URLs are compiled in; rebuild to change them. Never supply production credentials or a production endpoint.

CI runs npm ci, TypeScript, ESLint, Jest, Expo compatibility, Expo Doctor and Android JS export; CNG generates native configuration. assembleRelease packages both armeabi-v7a and arm64-v8a into one APK with bundled JS/Hermes, no Metro. App identity: com.brandista.mobile.internal, Brandista Internal (HTTPS/placeholder). Existing LAN mode retains Brandista LAN and its restricted policy. Development/iOS profiles remain intact.

Download artifact brandista-android-internal-signed-universal from the successful workflow run (repository access required), retained 14 days. Extract app-release.apk and verification reports. Compare apk-sha256.txt before installation. CI verifies package, non-debuggable manifest, embedded endpoint/bundle, ELF libraries, network policy and the existing internal certificate using apksigner. Failed verification must not be treated as a usable release; diagnostic artifacts last 3 days.

## Wireless installation and acceptance

Open the artifact link in the phone browser, download/extract the ZIP, then open app-release.apk. Allow installation from that browser/file manager when Android requests it. Respect Play Protect prompts; do not disable security controls. No USB or Metro is required. Preserve existing app data on signature conflicts; do not uninstall automatically.

Launch Brandista Internal with Metro stopped. Placeholder builds can test installation/startup/error handling only. Once rebuilt with the approved backend, use synthetic data for registration, login, session restoration, catalogue/brand/search, cart changes, addresses, COD checkout, order confirmation/history, logout/login and network recovery. AND-020 host API smoke tests do not satisfy these phone gates. Device installation and shopping acceptance remain NOT TESTED until observed on the actual APK.

## Security and signing

Only existing ANDROID_INTERNAL_* secrets and alias brandista-internal are used in the manually dispatched release job; no production signing or store publication. Certificate SHA256: d75128ac92091d2b837368071d41f3a36c2036ecfa42409d06cdda0b7be4fa44. PR jobs cannot access release signing. The dedicated branch includes the unmerged ARMv7 prerequisite from PR20; preserve/review that dependency. No automatic merge.

PR19 exception is restricted to development/internal testing and expires November 5, 2026; it does not authorize production release. Do not suppress advisories. Use synthetic data only; no privileged accounts, persistent database modifications, backend deployment, public tunnels or firewall changes.

References: https://docs.expo.dev/versions/v58.0.0/ and https://docs.expo.dev/guides/local-app-production/
