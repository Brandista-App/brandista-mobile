# Android PR19 — security and build readiness

2026-10-22, Asia/Karachi. Baseline: clean synchronized main `b8f0eee12f74230b5f009d6e75768c909f063203`, merged PR18. Branch: `codex/android-pr19-security-readiness`. Scope: `apps/mobile` and this report. Read `docs/ANDROID-MVP-COMPLETION-AUDIT.md` before implementation; that report remains the historical baseline.

## Dependency correction

The reproduced Expo compatibility check identified the same eight SDK58 patch updates. Installed using `npx expo install`, keeping Jest tooling in devDependencies. Expo and React Native major versions are unchanged; React Native remains0.88.0 and React19.3.0. No override, forced audit fix, advisory exclusion or custom dependency fork is used.

| Package                 | Before  | After   |
| ----------------------- | ------- | ------- |
| expo                    | 58.0.14 | 58.0.17 |
| expo-constants          | 58.0.12 | 58.0.13 |
| expo-image              | 58.0.15 | 58.0.16 |
| expo-linking            | 58.0.13 | 58.0.14 |
| expo-router             | 58.0.23 | 58.0.25 |
| expo-splash-screen      | 58.0.10 | 58.0.11 |
| expo-status-bar         | 58.0.3  | 58.0.4  |
| jest-expo (development) | 58.0.11 | 58.0.12 |

The lockfile also resolves supported transitive updates, including `@expo/config-plugins`58.0.9→58.0.10, which changes its own xcode constraint to ^4.0.0. xcode3.0.1→4.0.0 removes its uuid7 dependency and uses Node crypto.randomUUID. This is an upstream-supported dependency path, not an override across the old xcode constraint. The resulting tree has no uuid package. Customer placement continues to use existing expo-crypto UUID generation.

Expo installed the dependencies but initially returned nonzero because it cannot automatically rewrite dynamic `app.config.ts`. Added its requested default `expo-image` and `expo-status-bar` config-plugin entries explicitly. Inspected installed plugin implementations: Image retains its default libdav1d configuration; StatusBar without options returns config unchanged. No custom status-bar styling, native project recreation, iOS identity, signing, permission or network-policy change is introduced. Source customer screens/adapters/session/checkout are unchanged.

References: [SDK58 packages](https://docs.expo.dev/versions/v58.0.0/), [Image](https://docs.expo.dev/versions/v58.0.0/sdk/image/), [StatusBar config](https://docs.expo.dev/versions/v58.0.0/sdk/status-bar/), [Expo CLI](https://docs.expo.dev/more/expo-cli/).

## Reproduced vulnerability counts

| Graph                | Before                            | After                             |
| -------------------- | --------------------------------- | --------------------------------- |
| Full npm audit       | 51:30 high,21 moderate,0 critical | 48:30 high,18 moderate,0 critical |
| npm audit --omit=dev | 43:21 high,22 moderate,0 critical | 40:21 high,19 moderate,0 critical |

These are affected package entries including inherited findings, not counts of independent CVEs. Three entries disappeared by removing the UUID chain; three root advisory families remain. Both audits still exit1. The production graph includes build tooling shipped as dependencies of Expo; it is not an APK runtime inventory. No advisory was suppressed to lower the counts.

## Remaining findings, paths and exposure

| Package/advisory                                                                                    | Inspected dependency paths                                                                  | Exposure and remediation                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| braces3.0.3; high, [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)         | expo→@expo/cli→@expo/metro→metro-file-map→micromatch→braces; additional Metro/Jest branches | Deep attacker-controlled brace patterns can exhaust a Node stack. Used by build/test file matching, not directly imported by customer app code. Published latest3.0.3 is affected; advisory has no patched version. Build only trusted checkout/config and restrict development servers/inputs; await compatible upstream fix.                     |
| node-forge1.4.0; high, [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv)     | expo→@expo/cli→@expo/code-signing-certificates→node-forge                                   | RSA PKCS#1 v1.5 verification weakness with crafted nested DigestAlgorithm. Build/development certificate tooling exposure; not the app's backend bearer-token validation. Latest1.4.0 remains affected with no published patch. Accept no untrusted certificates/signing inputs; do not alter signing credentials or substitute unreviewed crypto. |
| sprintf-js1.0.3; moderate, [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c) | Jest/coverage tooling→@istanbuljs/load-nyc-config→js-yaml→argparse→sprintf-js               | Attacker-controlled precision format strings can throw RangeError. Latest1.1.3 is also affected, so updating to it does not fix the advisory and exceeds argparse's ~1.0.2 requirement. Restrict tooling inputs; await compatible upstream fix.                                                                                                    |

The removed [UUID advisory GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) concerns v3/v5/v6 caller-provided buffer bounds. Patched UUID11.1.1 is outside old xcode's ^7.0.3; no UUID override was introduced. The supported new xcode dependency removes that package entirely.

Registry versions and GitHub reviewed advisory patch status were checked during this run. npm's suggested Expo44/Jest-Expo56 downgrades are incompatible with SDK58 and were rejected. A tooling exposure assessment is not proof of non-exploitability or complete native security certification. Production release requires an explicit decision on unresolved findings or compatible upstream remediation.

## Validation and build evidence

Current-run logs and audit JSON are outside Git at `D:\Brandista Workplace\PR19-verification`. Local Node24.21.0/npm11.19.0. Typecheck, lint, all 36 Jest tests across 10 suites, Expo dependency alignment, public config and Android/iOS JavaScript exports passed. Expo Doctor passed 20/20 checks. Android source-map inspection covered 1,211 sources and found no braces, node-forge, sprintf-js or uuid package sources. This supports the tooling-path assessment for this export; it does not certify native or future bundles. CI build results are linked from this PR's description/checks, rather than inferred from historical Android artifacts.

Commands (from apps/mobile):

```powershell
$env:CI = '1'
$env:APP_VARIANT = 'development'
$env:EXPO_PUBLIC_API_BASE_URL = 'http://10.0.2.2:8082/api/v1'
npm run typecheck
npm run lint
npm test
npm run dependencies:check
npm run config:check
npx expo-doctor
npm run bundle:android -- --source-maps --max-workers 1
npm audit --json
npm audit --omit=dev --json
# Shared-platform regression, static export only; no backend contacted:
$env:EXPO_PUBLIC_API_BASE_URL = 'https://api.example.invalid/api/v1'
npm run bundle:ios -- --max-workers 1
```

The existing Android workflow runs quality then `debug-apk`: Java21, Android36/build-tools37, Expo CNG and ARM64 assembleDebug. The normal pull-request path skips standalone-apk; no EAS or owner signing credential is used. Hosted debug compilation/artifact is distinct from signed standalone/production release and real-device acceptance. This machine still lacks the Android SDK/adb; no SDK was installed or global setting changed.

No persistent acceptance database, backend/admin/customer website, production infrastructure or privileged account was accessed or changed. No real API mutations or orders were made. PR7 live acceptance remains a separate workflow; this dependency PR does not close it. Physical-device purchase/session/network acceptance remains outstanding as documented in PR18.
