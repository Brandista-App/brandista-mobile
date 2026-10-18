# Brandista native application

Expo React Native/TypeScript customer application. Native screens use existing Spring APIs; the root Vite source remains preserved and the active web repository is `brandista-frontend`.

This existing package is also the iOS foundation. See [REPO-003 and IOS-001](../../docs/mobile/REPO-003-MOBILE-ARCHITECTURE.md) before creating platform folders or changing build configuration. iOS is declared in app configuration; native build/device readiness remains unverified. The default `10.0.2.2` API host is for Android emulators; iOS needs an explicitly configured reachable endpoint.

For the prepared Windows/iPhone workflow, environment examples, EAS profiles and current account/signing blockers, follow [IOS-001 iPhone guide](../../docs/mobile/IOS-001-IPHONE-GUIDE.md). SDK 58 needs a compatible runtime; the App Store Expo Go client does not support it. No iOS identifier or EAS project has been invented.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run typecheck
npm run lint
npm test
npm run android
```

See [architecture](../../docs/mobile/ANDROID-ARCHITECTURE.md), [API mapping](../../docs/mobile/ANDROID-API-MAPPING.md), [test evidence and limitations](../../docs/mobile/ANDROID-TEST-REPORT.md), [build/device setup](../../docs/mobile/ANDROID-BUILD-GUIDE.md) and [manual acceptance](../../docs/mobile/ANDROID-MANUAL-ACCEPTANCE.md).

Local Android emulator API: `http://10.0.2.2:8082/api/v1`. Physical phones require their own development configuration. Release requires a real HTTPS API, approved icon/splash assets, signing and device acceptance. No APK or device verification is implied by a JavaScript bundle export.
