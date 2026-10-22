# PR19 security review — proposed temporary exception

Review date: **2026-10-22 (Asia/Karachi)**. Decision: **PENDING HUMAN REVIEW; no risk has been accepted**. Proposed expiry: **2026-11-05**, or an earlier reassessment trigger below. A named repository/security owner must record approval or rejection for each finding and confirm the safeguards before relying on this proposal. Expiry requires renewed review, not automatic extension.

## Scope and evidence

Reviewed PR [#19](https://github.com/Brandista-App/brandista-mobile/pull/19), implementation commit `c3985b1065b162064189717129998f0f1c447932`, against `b8f0eee12f74230b5f009d6e75768c909f063203`: eight SDK-compatible package patches, lockfile changes, two default config-plugin entries and the readiness report. No customer source, workflow or signing-policy changes. This follow-up changes documentation only.

Verified installed paths with `npm explain`, cross-checked the lockfile, inspected Expo certificate helpers and CI workflow definitions, and checked current npm latest versions and the linked GitHub reviewed advisories. Full path evidence is retained locally in `D:\Brandista Workplace\PR19-verification\security-review-paths.json`. Paths below are exact examples, not an exhaustive listing of repeated Metro/Jest parent branches. Peer dependency edges do not prove execution.

The previous Android export map contains 1,211 sources and none from these three packages. This supports **no identified Android application JavaScript runtime path**; it does not establish absence from all APK components, development-server interactions, native code or future builds. A development client still consumes output from its Metro host, so host integrity matters. The npm production graph includes tooling and is not a runtime inventory.

[Android quality/debug APK](https://github.com/Brandista-App/brandista-mobile/actions/runs/39756494012) and [iOS quality](https://github.com/Brandista-App/brandista-mobile/actions/runs/39756493791) passed at the reviewed implementation commit. Build success does not demonstrate security. No exploit test, device acceptance or comprehensive call-graph audit was performed. Repository settings, actual developer network exposure and operator compliance are not independently attested here.

## Findings and recommendations

Ratings describe residual risk within the proposed restricted scope, not a replacement for upstream advisory severity.

### braces — LOW; recommend ACCEPT TEMPORARILY

Installed **3.0.3**, `node_modules/braces`. Confirmed path: `expo@58.0.17 → @expo/cli@58.1.14 → @expo/metro@58.0.0 → metro-file-map@0.87.1 → micromatch@4.0.8 → braces@3.0.3`. Expo also depends directly on this Metro version; Jest has additional matching paths.

[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm): deeply nested patterns can terminate the Node process through stack exhaustion. All versions through 3.0.3 are affected; no patched version is listed and npm latest is 3.0.3. **No compatible patched package update is available.**

- **Android runtime:** no identified application bundle path. Customer search strings are not shown to reach this glob parser.
- **Local build:** reachable through Metro/Jest matching; malicious patterns/configuration can stop builds or the development server. Inspecting an arbitrary checkout is not a safe input boundary.
- **CI:** PR-controlled configuration can cause job failure or consume runner time. Hosted disposable runners and 20-minute quality / 45-minute debug job limits bound individual jobs, not aggregate cost or queue disruption.

Existing mitigations: lockfile with `npm ci`, bounded CI jobs, read-only workflow permissions, no owner signing secrets in the PR debug jobs. Required controls: review glob/config changes and build only trusted checkouts on developer machines; restrict Metro to loopback or a trusted device network without public tunnels; cancel abusive/repeated jobs and apply the repository's approval controls for untrusted contributions. LOW residual risk follows from limited build availability impact and restricted inputs. Untrusted public pattern processing is outside this recommendation.

### node-forge — MEDIUM; recommend ACCEPT TEMPORARILY

Installed **1.4.0**, `node_modules/node-forge`. Confirmed paths: `expo@58.0.17 → @expo/cli@58.1.14 → node-forge@1.4.0` and `expo@58.0.17 → @expo/cli@58.1.14 → @expo/code-signing-certificates@0.0.7 → node-forge@1.4.0`. The direct CLI import also parses certificates for iOS tooling. The helper's `validateSelfSignedCertificate` calls certificate verification and `signBufferRSASHA256AndVerify` calls public-key verification; certificate/key matching checks exist but are not a fix for the primitive.

[GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv): malformed RSA PKCS#1 v1.5 signature structures can bypass verification with low-exponent RSA keys. Versions through 1.4.0 are affected; no patched version is listed and npm latest is 1.4.0. **No compatible patched package update is available.**

- **Android runtime:** no identified application bundle path. This package is not shown to validate backend bearer tokens or Android APK signatures. That does not certify native update verification.
- **Local build:** certificate/signature tooling has a reachable vulnerable primitive. Accepting attacker-supplied certificates, keys or signed inputs could undermine an integrity decision. Merely parsing a certificate is not itself proof of exploiting this verification flaw.
- **CI:** inspected PR jobs perform quality checks and a debug build, with no configured Expo update-signing operation or owner keystore use; standalone signing was skipped. Risk increases substantially if verification of externally supplied signatures becomes a gate.

Existing mitigations: app config has no Expo update code-signing configuration; PR workflow separates debug builds from manual standalone signing. Required controls: use only owner-controlled, independently authenticated certificates/keys; do not use this verifier to establish trust in external inputs; do not enable update-signing or external certificate verification under this exception. Keep signing secrets out of untrusted PR jobs and use independently reviewed verification before any signed release. No private keys were inspected and key exponents were not verified. MEDIUM residual risk reflects integrity severity and remaining tooling reachability despite the restricted current use. If a vulnerable verification operation must serve as a trust boundary, **BLOCK that operation** pending compatible upstream remediation or a separately reviewed replacement.

### sprintf-js — LOW; recommend ACCEPT TEMPORARILY

Installed **1.0.3**, `node_modules/sprintf-js`. Confirmed path: `jest@30.5.2 → @jest/core@30.5.2 → @jest/transform@30.5.2 → babel-plugin-istanbul@8.0.0 → @istanbuljs/load-nyc-config@1.1.0 → js-yaml@3.15.2 → argparse@1.0.10 → sprintf-js@1.0.3`. The nested argparse constraint is `~1.0.2`; the root argparse 2.0.1 is a different instance.

[GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c): attacker-controlled excessive precision in format strings can raise an uncaught RangeError. Versions through 1.1.3 are affected; no patched version is listed and npm latest is 1.1.3. **No compatible patched update is available**; 1.1.3 is both affected and outside the installed parent's range.

- **Android runtime:** no identified application bundle path or customer-input formatting path.
- **Local build:** test/coverage CLI formatting can abort if hostile format templates reach the formatter; arbitrary YAML values alone do not establish that path.
- **CI:** hostile test/CLI templates could fail a job. Existing timeouts and disposable runners limit impact.

Existing mitigations: fixed repository test commands and locked tooling tree. Required controls: review CLI/help/coverage templates; do not insert remote/customer input into format strings; keep PR jobs unprivileged and cancel abusive runs. LOW residual risk follows from bounded tooling availability impact and the absence of an identified runtime path.

## Proposed acceptance boundary and human decision

All three findings can reasonably be considered for **temporary development and internal testing only**, conditional on the safeguards above. This document neither approves the exception nor authorizes merge. A human owner must decide separately for each row: approve the temporary exception with a named accountable owner and expiry, or reject it. They must confirm trusted inputs/network access and CI restrictions actually hold; absent that confirmation, keep the PR pending.

Internal testing must use synthetic data, restricted distribution and the existing nonproduction environment. No public deployment, store submission, production credentials, external signing trust service or production workload is covered. **Production release requires a separate security decision**, including current dependency findings, signed-artifact/native update verification and device acceptance.

There is no demonstrated safe drop-in patched version for any of these findings. If temporary acceptance is rejected, defer merge until a compatible upstream dependency/parent release removes the vulnerable path and validate it with audit, Expo alignment, tests and native builds. Do not force SDK downgrades or substitute cryptographic libraries without a separate compatibility/security review. Where exposure is the blocker, the smallest immediate control is to disable the untrusted-input/signature-verification operation; that limits exposure rather than repairing the package.

Reassess **no later than 2026-11-05**, immediately on a patched release or advisory change, dependency/lockfile change, new affected bundle import, changed CI permissions/events/runners, public Metro exposure, external certificates/format/glob inputs, signing/update feature activation, suspected exploitation, or any production-release proposal. Re-run audits on these triggers and before release; continue reporting findings without suppressions. Approval must identify its reviewed commit and controls; materially changed exposure invalidates it.
