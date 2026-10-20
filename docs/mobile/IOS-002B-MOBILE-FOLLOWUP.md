# IOS-002B native follow-up

The zero-cost physical iPhone route is the canonical web storefront in Safari,
documented in sibling `C:\Brandista\brandista-frontend\docs\IOS-002B-SAFARI-GUIDE.md`
and `IOS-002B-VERIFICATION.md`. No Apple service, signing, device registration,
EAS project/build, Mac, tunnel, or public backend is required or created here.
The Expo SDK 58 app remains intact under `apps/mobile` for future native work.

## Verified ancestry and scope

Remote default is main at `ebc6145c65792e9fca186d981b40928a4589ecdb` when fetched.
IOS-001 PR #15 is merged. IOS-002 commit
`a54685bfa151647785413e3224c1d2f0f585f72e` is pushed and merged through PR #16.
The clean checkout was preserved; branch `codex/ios-002b-mobile-followup` starts
from fetched main. No existing source or historical reports were overwritten.

## Focused test isolation fix

With `EXPO_PUBLIC_API_BASE_URL=https://api.example.invalid/api/v1` in the shell
(as in iOS CI/export configuration), Jest's Expo Babel transform inlined that
value into app config. The test deleting the environment variable could no
longer test a missing URL and failed: 35/36 passed. This was reproduced before
the change.

`apps/mobile/jest.config.js` now preserves Expo's transformer and sets its Babel
caller option `preserveEnvVars: true` only for Jest. This is test-process-only;
it retains all configuration/HTTPS
guard assertions and permits their environment changes to take effect. It
changes no application logic, dependencies, app.config, native Android config,
EAS profiles, plugins, or Metro configuration. Export commands run separately
with the normal inlining behavior. No test or advisory is suppressed.

Official behavior: [Expo environment variables](https://docs.expo.dev/guides/environment-variables/).
The caller option was verified against installed SDK 58
`babel-preset-expo/build/common.js` (`getInlineEnvVarsEnabled`) and
`jest-expo/src/resolveBabelOptions.js`; the existing transformer/preset is reused.

## Validation on Windows

- Expo Doctor: PASS, 20/20.
- TypeScript: PASS.
- ESLint: PASS after final test-configuration fix.
- Jest under the same supplied export URL, fresh transform cache: PASS; 36 tests / 10 suites.
- iOS JavaScript export with normal inlining: PASS; Hermes bundle exported to ignored dist/ios.
- Native compilation/signing/iPhone runtime: NOT TESTED; deferred by cost and
  authorization constraints, not represented by JavaScript export success.

Raw local evidence is under ignored `.expo/ios-002b-*`.

## Continued work without Apple signing

Continue shared React Native UI, accessibility and safe-area tests, Router flows,
mocked API/session/expiry/authorization tests, error/retry behavior and compatible
dependency security review. Existing registration, login/logout, discovery,
catalogue/details, cart, addresses, COD checkout and customer orders already
exist; do not duplicate them. SecureStore persists only valid customer sessions.

Native iOS still requires the approved HTTPS API and existing identity/signing
gates. Safari HTTP access must not weaken them. Safari cannot validate native
SecureStore, plugins, provisioning or actual iPhone native behavior. The prior
48 production-graph dependency findings remain unresolved as documented in
IOS-002; no forced SDK change or new Expo project is introduced.

All existing Expo app source, Android profiles/source, Uzair's unpublished
Android work, root legacy web, backend, and original logo remain untouched.
The frontend has its own separate branch for LAN/Safari improvements. Draft PRs
only; no automatic merge or next milestone starts here.
