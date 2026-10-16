# Standalone Android internal APK

## LAN build (no permanent deployment)

The `internal-lan` mode is a signed, non-debuggable ARM64 release APK with production JavaScript/Hermes and assets embedded. It runs without Metro. Package `com.brandista.mobile.internal`, label **Brandista LAN**, separate from production and debug apps. Current actual Wi-Fi address: `192.168.100.66`; API embedded for this build: `http://192.168.100.66:8083/api/v1`. This is the detected address, not an example. DHCP changes require rebuilding with the new address (reserve this address in the router if useful).

No authorized/configured tunnel infrastructure was discovered. LAN mode avoids exposing a development API to the internet. It permits HTTP only to the selected private IPv4 host through Android network security config; all other cleartext hosts are denied. Use a trusted private network and disposable test accounts/data: LAN HTTP does not encrypt passwords or tokens in transit. Never use real customer credentials/data. Production still requires HTTPS, uses its separate package and has no LAN cleartext policy. No credentials or signing keys are embedded in the APK.

## Start the existing backend and LAN proxy

On the development computer, start **Docker Desktop** and wait until its engine is ready. In PowerShell:

```powershell
Set-Location D:\uzair-brandista\repositories\brandista-mvp
.\scripts\start-m01-backend.ps1
```

Keep that terminal open. It starts the existing dedicated MySQL database on **127.0.0.1:3308**, preserves its volume, and runs Spring Boot on **127.0.0.1:8082** with COD enabled. It creates local secrets only if `.env.m01` does not already exist; do not share that file. If the JAR is missing it builds it; Java 21/Docker are required. Do not use the older H2 catalogue-only launcher. Existing catalogue seed is needed; inspect `scripts/seed-m01-catalogue.ps1` if the catalogue is empty.

In a second PowerShell terminal:

```powershell
Set-Location D:\uzair-brandista\repositories\brandista-mobile-native
node apps/mobile/scripts/lan-backend-proxy.mjs 192.168.100.66 8083
```

The proxy binds only this computer's actual private IPv4 address and forwards `/api/v1` to the loopback backend; actuator/other paths return 404. It never forwards MySQL. Ctrl+C stops the proxy. No router forwarding/UPnP/public deployment is needed or permitted.

Connect the phone to the **same trusted Wi-Fi**. Disable guest/client isolation if it blocks local devices. Open `http://192.168.100.66:8083/api/v1/products?page=0&size=1` in its browser: expect catalogue JSON before trying the app. A 502 means Spring Boot is not running; an empty catalogue needs local demo seeding. If Windows Firewall blocks the proxy, an administrator may add a scoped rule (and remove it after testing):

```powershell
New-NetFirewallRule -DisplayName 'Brandista internal LAN API' -Direction Inbound -Action Allow -Protocol TCP -LocalAddress 192.168.100.66 -LocalPort 8083 -RemoteAddress LocalSubnet -Profile Private
# After testing:
Remove-NetFirewallRule -DisplayName 'Brandista internal LAN API'
```

Use this only on a Windows network marked Private and trusted. Do not enable a Public-profile exception or expose any database port.

## Build, signing and verification

Manually dispatch the existing workflow on PR #12's branch:

```powershell
gh workflow run android-quality.yml --repo Brandista-App/brandista-mobile --ref codex/android-standalone-internal -f standalone=true -f backend_mode=internal-lan -f api_base_url=http://192.168.100.66:8083/api/v1
```

GitHub-hosted runners cannot probe your private Wi-Fi. LAN configuration validation deliberately replaces the external reachability gate; this does not claim phone/backend connectivity. HTTPS mode still probes the actual backend catalogue before building. CI runs native tests/typecheck/lint/export, generates Android via Expo CNG, builds `assembleRelease`, verifies the embedded bundle/API URL, non-debuggable manifest, expected package/network policy and `apksigner`, computes SHA-256, and uploads the APK/evidence.

Signing uses GitHub secrets `ANDROID_INTERNAL_KEYSTORE_BASE64`, `ANDROID_INTERNAL_STORE_PASSWORD`, `ANDROID_INTERNAL_KEY_PASSWORD`, alias `brandista-internal`. Temporary key files are restricted and removed on exit. Owner-machine backup is outside Git at `%USERPROFILE%\.brandista-signing`; password backup uses Windows DPAPI and requires the same Windows account. Retain the same key for APK updates and secure backups before changing machines. No Google Play publication occurs.

## Installation and acceptance

Download the run's `brandista-android-internal-signed-arm64` artifact while signed into GitHub with repository access. Extract it and locate `app-release.apk`. Transfer it to an ARM64 Android phone, open it, permit installation from that browser/file manager and install. Alternatively `adb install -r app-release.apk`. Check the included SHA-256 before transferring if needed. Do not uninstall an existing app to work around a signing conflict without protecting its local data.

Stop Metro. Launch **Brandista LAN**, register a test account, verify sign-in/session restoration, catalogue/brands/search, cart, addresses and COD checkout/order history. Orders are real records in the local demo database; avoid real personal data. The APK can launch independently of backend/Metro, but catalogue/auth/checkout need the computer, Docker, Spring Boot, LAN proxy and Wi-Fi running. There is no offline catalogue/checkout. No physical-device/emulator launch verification has been performed in this environment; static APK checks are separate evidence.

## Public distribution

Use a stable hosted HTTPS backend, `backend_mode=https`, production package/config, and re-run endpoint/regression/device tests. Remove reliance on LAN proxy/IP and disposable data, audit backend deployment/security, branding/signing/versioning and dependency risks. LAN APKs must not be distributed publicly. Do not merge PR #12 automatically.

Supported references: https://docs.expo.dev/guides/local-app-production/ and https://developer.android.com/privacy-and-security/security-config
