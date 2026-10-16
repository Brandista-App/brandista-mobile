# Standalone Android internal APK

Manually dispatch `Android native quality` with `standalone=true` and `api_base_url` set to the actual reachable HTTPS backend ending in `/api/v1`. The job checks the public catalogue before building. No endpoint was discovered; a distributable APK has not yet been generated.

Expo CNG generates the native project. Gradle `assembleRelease` embeds production Hermes JavaScript/assets and builds ARM64. The signing plugin selects a dedicated internal key from environment variables and fails if the native template changes. No Google Play publication occurs.

GitHub Actions secrets: `ANDROID_INTERNAL_KEYSTORE_BASE64`, `ANDROID_INTERNAL_STORE_PASSWORD`, `ANDROID_INTERNAL_KEY_PASSWORD`; alias `brandista-internal`. The key is written to runner temporary storage with restricted permissions and removed on exit. Owner-machine backup: `%USERPROFILE%\.brandista-signing`, outside Git, restricted to the owner. The password backup uses Windows DPAPI: recovery requires the same Windows account. Securely back up the key and password before moving machines; retain this key for updates.

The workflow verifies the APK exists, contains `assets/index.android.bundle`, embeds the API URL, is non-debuggable and passes `apksigner verify`. It uploads the APK, certificate fingerprint, SHA-256, package metadata and source/API evidence as `brandista-android-internal-signed-arm64`.

Install after a successful build: download/extract the artifact ZIP, transfer `app-release.apk` to an ARM64 Android phone, permit installation from the selected browser/file manager and install. Alternatively: `adb install -r app-release.apk`. Package `com.brandista.mobile` installs separately from the development package. Stop Metro and verify launch, authentication, catalogue, cart, addresses and COD checkout. Do not uninstall an app to bypass a signature conflict without protecting its local data.

Base: merged PR #11, `489809e76c44f7d282c918c5edcab458f9186c8e`. No hosted backend URL/hosting credentials or running local backend was discovered. No emulator/device is available; device launch is unverified. The URL is public configuration, never put secrets in it. Do not substitute a placeholder in a distributable APK.

Supported release build reference: https://docs.expo.dev/guides/local-app-production/
