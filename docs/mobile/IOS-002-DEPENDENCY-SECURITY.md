# IOS-002 dependency security review

Review date: 2026-10-18. Scope: `apps/mobile/package-lock.json`, Expo SDK 58.

## Findings and compatibility decision

`npm audit --json` reports **56 affected packages: 30 high, 26 moderate**.
`npm audit --omit=dev --json` reproduces IOS-001's **48 affected packages:
21 high, 27 moderate**, with no critical findings. These are package counts,
including inherited metavulnerabilities, not 48 independent root advisories.
The two graphs are evaluated separately; severity counts need not subtract.

All four root advisory packages are transitive; none is a direct application
dependency. Direct packages such as Expo are flagged through their dependency
chains. The production dependency graph includes development and build tooling
shipped inside Expo packages, so `--omit=dev` does not establish device runtime
exploitability.

Affected direct runtime-declared dependencies (through transitive findings):
`expo`, `expo-router`, `react-native` (high), and `expo-splash-screen` (moderate).
Affected direct development dependencies: `@testing-library/react-native` and
`jest-expo` (high), and `jest` (moderate). These inherited flags do not establish
that application shopping routes invoke the vulnerable functions.

| Package installed | Advisory / severity                                                                | Observed dependency path and exposure                                                                                                      | Compatible fix assessment                                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| braces 3.0.3      | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), high     | Metro/tooling → micromatch → braces; malicious glob input can exhaust the Node stack                                                       | Registry latest is 3.0.3; advisory lists no patched version                                                                    |
| node-forge 1.4.0  | [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv), high     | Expo CLI and @expo/code-signing-certificates → node-forge; development/build signing verification surface                                  | Registry latest is 1.4.0; advisory lists no patched version                                                                    |
| sprintf-js 1.0.3  | [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c), moderate | Test/coverage tooling → @istanbuljs/load-nyc-config → argparse (~1.0.2) → sprintf-js; untrusted format strings can cause denial of service | Registry latest is 1.1.3; advisory lists no patched version, including that version                                            |
| uuid 7.0.3        | [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq), moderate | Native project tooling → xcode → uuid (^7.0.3); advisory affects v3/v5/v6 APIs with caller-provided buffers                                | Patched 11.1.1 is outside ^7.0.3; latest 14.0.3 also requires a major jump. Do not force an unsupported transitive replacement |

Application source does not directly import these four packages. This is a
tooling-focused exposure assessment, not proof of non-exploitability or a clean
security approval. No signed native artifact was available for a complete device
runtime dependency/reachability assessment. Dependency risks remain open.

## Changes and risk controls

No safe compatible security update was identified. Package manifests and lockfile
remain unchanged. No override, advisory suppression, forced audit fix, or Expo
major change was applied. npm's proposed Expo 44 / older Jest resolutions are
incompatible downgrades, not acceptable SDK 58 remediation.

Keep Metro and development servers private; do not process untrusted glob patterns,
format strings, certificates, or signing material in build tooling. Use trusted
checkout/dependencies and restricted CI inputs. These controls reduce exposure;
they do not resolve the advisories. Recheck upstream braces, node-forge,
sprintf-js, xcode, and Expo releases before a release build; validate compatible
upstream fixes with clean installation, Doctor, dependency check, tests, and both
platform exports. Native build acceptance remains a separate gate.

## Reproduce

From `C:\Brandista\brandista-mobile\apps\mobile`:

```powershell
npm.cmd audit --json
npm.cmd audit --omit=dev --json
npm.cmd explain braces
npm.cmd explain node-forge
npm.cmd explain sprintf-js
npm.cmd explain uuid
npm.cmd view braces version
npm.cmd view node-forge version
npm.cmd view sprintf-js version
npm.cmd view uuid version
```

Audit exits nonzero while these findings remain. Raw audit evidence is retained
locally under ignored `.expo/ios-002-audit-before.json` and
`.expo/ios-002-audit-prod-before.json`. Counts are dated observations, not a
promise about future registry results.
