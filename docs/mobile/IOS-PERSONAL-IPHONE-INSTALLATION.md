# IOS-FINAL-001 — personal iPhone installation without paid enrollment

Use the existing Expo/React Native application. No Apple Developer Program purchase, EAS subscription, enterprise certificate or third-party sideload service is needed for the Xcode Personal Team route below. A compatible **Mac with Xcode and the owner's iPhone** is required. Windows cannot run Xcode or perform this native installation. The owner signs in directly in Xcode; never send Apple passwords, authentication codes, certificates, private keys or provisioning profiles to this repository, CI or chat.

## Which artifact works where

| Route | Purpose and limitations |
| --- | --- |
| Release iOS Simulator `.app.zip` | Native testing on a Mac's matching Simulator architecture/runtime. No paid membership or device provisioning. **Not an iPhone IPA**; cannot install it on a physical iPhone. |
| Xcode Personal Team + Release build | Legitimate personal-device testing using a free Apple Account. Xcode handles device-specific signing and provisioning. Rebuild/reinstall before provisioning expiry. |
| Expo Go or development client | Existing quick development route. Requires compatible tooling and Metro to initially load app code; does not meet standalone first-launch acceptance. |
| Arbitrary downloaded IPA | Not provided. An iPhone requires a compatible device build and authorized signing/provisioning. Renaming a Simulator ZIP or unsigned application into `.ipa` does not make it installable. |

Apple documents Personal Team limits of ten App IDs, three devices and three installed apps per device, with seven-day provisioning expiry. The account must remain eligible and the device must meet the generated app's minimum iOS version. [Apple account and Personal Team rules](https://developer.apple.com/help/account/basics/about-your-developer-account).

## Shortest legitimate standalone route

1. On an authorized Mac, install Xcode from Apple, complete its first-run setup locally and install an iOS Simulator/device-support runtime compatible with the target phone. Use a current stable Xcode supported by the installed SDK58/RN0.88 toolchain. Do not accept a paid enrollment prompt as a prerequisite for Personal Team testing.
2. Clone `Brandista-App/brandista-mobile` and check out the reviewed `codex/ios-final-001` commit/PR. Enter `apps/mobile`. Install Node24 and CocoaPods using their official tooling, then run `npm ci`. There must be no unreviewed native changes. If `ios/` already exists, inspect it first; do not delete it or use `prebuild --clean` blindly.
3. Select a unique owner-controlled reverse-DNS identifier for **personal testing**, distinct from any production installation. In a normal, non-recorded terminal set the following public configuration. Replace the identifier placeholder; it is not a backend URL or signing credential:

```bash
export APP_VARIANT=production
export EXPO_PUBLIC_APP_ENV=development
export IOS_BUILD=1
export IOS_OFFLINE_SHOWCASE=1
export EXPO_PUBLIC_OFFLINE_SHOWCASE=1
export IOS_BUNDLE_IDENTIFIER='<owner-selected-personal-test-identifier>'
unset EXPO_PUBLIC_API_BASE_URL EXPO_PUBLIC_APP_VARIANT EAS_PROJECT_ID
npx expo config --type public
npx expo prebuild --platform ios --no-install
cd ios && pod install && cd ..
open ios/Brandista.xcworkspace
```

This explicit offline configuration rejects any API endpoint or Android LAN override. It requires a bundle identifier but no EAS project because Xcode owns this local signing flow. Normal live-build guards are unchanged. Essential imagery and catalogue data are bundled; typography uses iOS system fonts, so no remote font download is needed.

4. In Xcode Settings → Accounts, the owner adds their free Apple Account. Select the **Brandista application target → Signing & Capabilities → Automatically manage signing**, then choose the owner's **Personal Team**. Use the same bundle identifier supplied above. Let Xcode create an Apple Development certificate and device-specific provisioning profile locally. Do not upload these materials to GitHub. If Xcode requests a paid-only capability, stop and review the capability instead of enrolling or purchasing automatically.
5. Connect and unlock the iPhone over USB, approve trust on the phone, and select it as the run destination. Enable Developer Mode on the phone when Xcode/iOS requires it; follow Apple's on-device restart/confirmation instructions. Any account terms, password entry, certificate trust or device-setting confirmation is performed by the owner.
6. Edit the **Brandista scheme → Run → Build Configuration → Release**. This is essential: Debug/development-client builds can depend on Metro. Check that the target uses development signing with the Personal Team for this Release configuration, then Product → Run. Xcode must report successful installation and the app must visibly launch on the phone before recording a device PASS. No Archive/App Store export is necessary.
7. Stop Metro and disconnect the USB cable. Close the app, enable airplane mode, reopen it, browse fictional brands/products, change a demo option/quantity, complete simulated checkout, close/reopen and verify local bag persistence. Record results in [IOS-DEVICE-ACCEPTANCE.md](IOS-DEVICE-ACCEPTANCE.md). A successful Simulator run does not satisfy these physical checks.
8. Reconnect and rebuild/reinstall with Xcode before the seven-day profile expires. This periodic owner action is a limitation of free Personal Team provisioning, not a backend outage or app defect.

For later local rebuilds with the same reviewed generated project and signing selection, retain the same offline environment and use Xcode Release again. Expo also documents `npx expo run:ios --device --configuration Release`; ensure the correct Personal Team/destination and an embedded JS bundle before relying on it. [Expo local builds](https://docs.expo.dev/guides/local-app-development/), [Apple device/Simulator instructions](https://developer.apple.com/documentation/xcode/running-your-app-on-simulated-or-physical-devices).

## Simulator artifact installation on a Mac

Download and extract the actual successful CI `Brandista-iOS-Simulator` artifact. Read `app-verification.json`, `source-sha.txt` and `xcode-version.txt`; confirm the intended source, Simulator platform, minimum iOS version and architecture. Verify the ZIP SHA256 against `simulator-sha256.txt`. Extract `Brandista-Simulator.app.zip` using `ditto -x -k` to preserve the bundle. Boot a compatible Simulator and run:

```bash
xcrun simctl install booted /absolute/path/Brandista.app
xcrun simctl launch booted invalid.example.brandista.simulator
```

The reserved `invalid.example.brandista.simulator` identifier is for the unsigned CI Simulator build only. It is not an owner-approved production identity or an Apple-registered application. A Simulator `.app` is not physical-device signing evidence.

## Live shopping without public backend deployment

The offline build deliberately cannot connect to a live API. To evaluate live shopping, use a separate reviewed build with an owner-approved phone-reachable HTTPS `/api/v1` endpoint and the existing live-build configuration. A private network/VPN and trusted HTTPS hostname/certificate may be sufficient; public deployment is not intrinsically necessary. Verify route reachability, certificate trust, backend readiness, customer-only accounts and synthetic stock/COD acceptance first. Never disable ATS, certificate validation or authorization to make a local test work. No phone-reachable environment is currently verified.

## Current handoff

No physical phone, approved Personal Team session, device provisioning or signed device artifact has been verified in this Windows workspace. No installable IPA is supplied or implied. **Owner's next action:** use an authorized Mac and personal iPhone, sign in to Xcode locally, select Personal Team and run the reviewed app in Release with the offline flags above. No Apple credentials need to be shared.
