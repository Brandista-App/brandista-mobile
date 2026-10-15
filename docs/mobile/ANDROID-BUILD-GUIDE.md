# Android development and build guide

From the `Brandista-App/brandista-mobile` native branch, use `apps/mobile`. The historical root npm package is still the preserved web application. Node 24 is recommended; install the exact native lockfile with `npm ci`.

```powershell
cd apps/mobile
npm ci
Copy-Item .env.example .env.local
# .env.local contains public development configuration only.
npm run typecheck
npm run lint
npm test
npm run android
```

## Emulator

Install Android Studio, the platform/build tools matching the Expo SDK, and an emulator system image; set `ANDROID_HOME` and add its `platform-tools`/`emulator` folders to PATH. Create an AVD using Device Manager, then start it. The Gradle workflow requires Java and accepts Android SDK licenses as part of normal SDK setup.

```powershell
emulator -list-avds
emulator -avd YOUR_AVD_NAME
adb devices
$env:APP_VARIANT='development'
$env:EXPO_PUBLIC_API_BASE_URL='http://10.0.2.2:8082/api/v1'
npm run android
```

The standard emulator maps `10.0.2.2` to the development host. The existing local backend was verified on port 8082; use its actual port if different. Device localhost refers to the device. `npm start` starts Metro for the development client; `npm run android:go` is an optional Expo Go route for bundled modules, not proof of development-build compatibility. The custom development build is preferred.

## Physical phone

For the same Wi-Fi network, set the public API root to `http://YOUR_HOST_LAN_IP:8082/api/v1` in ignored `.env.local`. The host backend must listen on an interface reachable from the phone and its firewall must permit only the trusted development network; the current loopback-only backend cannot be reached over LAN as-is. Do not change the production network policy or expose MySQL. Start Metro with `npx expo start --dev-client --lan` and open the installed development client.

Alternatively, a USB-connected authorized phone can use `adb reverse tcp:8082 tcp:8082` and the development API root `http://127.0.0.1:8082/api/v1`, without opening backend LAN access. Device authorization/installation is a manual prerequisite. Never commit phone addresses, credentials or tokens.

## Builds

```powershell
# Local development/debug APK (requires Android SDK):
npm run build:debug
# Expected output ONLY after successful Gradle build:
# apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk

# Remote EAS workflow (requires authorized Expo account/project/signing):
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile development
# Preview uses HTTPS and produces an installable APK:
npx eas-cli@latest build --platform android --profile preview
# Production builds AAB, without submission:
npx eas-cli@latest build --platform android --profile production
```

Set `EXPO_PUBLIC_API_BASE_URL` through the selected EAS environment to a real HTTPS backend for preview/production. Do not use a placeholder for an actual release build. These profiles do not include an EAS project ID or signing credential; the owner must link the correct Expo project and authorize credential provisioning. No signing credentials were invented, no cloud build was submitted, and nothing was published. EAS local builds require a supported Unix environment; the provided Windows debug script uses native Gradle instead.

`app.config.ts` uses `com.brandista.mobile.dev` for development and `com.brandista.mobile` for release. This identifier is a provisional project convention, not a claim of Play Store registration. Version is 0.1.0; Android versionCode is 1. Increment both appropriately before distributing subsequent builds. Production configuration and runtime require HTTPS. Cleartext traffic is enabled only for the development variant. SecureStore backup rules are configured. Camera/microphone/external-storage permissions are explicitly blocked.

No approved icon/splash artwork was found. Add approved owner-provided artwork and configure icon/adaptiveIcon/splash before release. Check the generated Android manifest and permissions during device QA. No native directories are hand-written; Expo prebuild/config plugins generate them.

## GitHub Actions development artifact

The `Android native quality` workflow runs quality checks and then uses GitHub's hosted Android SDK to build an ARM64 debug APK. When the build succeeds, download the `brandista-android-debug-arm64` artifact from that workflow run; it contains `app-debug.apk`. It uses the standard development signing configuration and requires Metro for application JavaScript. This is an internal development artifact, not a release-signed store build, and does not prove device acceptance. Configure the API in the Metro environment for emulator versus phone as described above.
