# Brandista native application

Expo React Native/TypeScript customer application. Native screens use existing Spring APIs; the root Vite source remains preserved and the active web repository is `brandista-frontend`.

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
