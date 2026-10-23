# Installing the Brandista showcase

Download: [FINAL-001 universal APK build and artifacts](https://github.com/Brandista-App/brandista-mobile/actions/runs/40027697735). Open the **Brandista-Showcase-Universal** artifact after the workflow completes successfully; it contains the APK, checksum and package/signing evidence. GitHub repository access may be required.

This is an internally signed brand-presentation candidate. Use only the FINAL-001 artifact linked in RELEASE-READINESS.md and verify its SHA256 against apk-sha256.txt. Download the GitHub Actions artifact ZIP while signed into an authorized GitHub account, extract it, then transfer/download **Brandista-Showcase-Universal.apk** onto the phone. The Actions artifact may expire; preserve the verified file and checksum.

1. On the Android phone, open the downloaded APK in Files/Downloads.
2. If prompted, allow that browser or file manager to install unknown apps, then tap Install. Restore that permission afterward.
3. Open Brandista Internal. No USB, Metro, Expo Go or running computer is needed.
4. Turn on airplane mode and explore Home, Brands, Explore and Bag. Add products/options, review demo checkout and confirm the explicitly simulated order. No purchase is made.
5. Close/reopen the app; it starts in showcase mode and restores the saved demo bag where device storage is available.

The universal APK packages armeabi-v7a and arm64-v8a libraries and requires Android 7.0 / API 24 or later. Package metadata and minimum SDK are included in the artifact's apk-metadata.txt; actual device compatibility must be tested. It replaces the prior internally signed package when Android accepts the matching identity/signature. Do not uninstall a prior app with data you need merely to bypass a signature error.

Tap Shop live to check online shopping availability. This candidate has no approved public backend; it explains that limitation and retains the complete offline experience. Live accounts, addresses and real COD orders require a rebuilt APK configured for the verified service. Demo carts/orders are never synced into live accounts.
