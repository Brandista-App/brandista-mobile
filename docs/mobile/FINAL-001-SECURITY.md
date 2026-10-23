# FINAL-001 dependency reassessment

2026-10-24. No dependency versions, overrides or framework major versions changed in FINAL-001.

Current full and production-only npm audits each report **5 high affected package entries, zero critical**. These are inherited package entries, not five distinct vulnerabilities. Earlier PR19 counts describe a different advisory database snapshot and are not current clearance. Admin and customer web clean-install audits each reported zero vulnerabilities; this is not a security certification.

- **node-forge 1.4.0**, via Expo CLI / code-signing-certificates: [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv), no published patched version in the reviewed advisory. Used by Expo development/build certificate tooling. Limit builds to trusted source/config/certificate inputs.
- **zod 3.25.76**, via Expo CLI: [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), patched at 4.6.6. Installed CLI declares **^3.25.76**, so forcing Zod 4 crosses its supported major constraint. Keep tooling inputs trusted and await a compatible upstream CLI update. A forced override or npm's suggested Expo 44 downgrade would invalidate the verified SDK58 architecture.

The other affected entries are Expo, @expo/cli and @expo/code-signing-certificates. Counts can change as advisories change. This is a tooling dependency-path assessment, not native vulnerability certification or proof of non-exploitability. No claim of production security approval is made. The existing PR19 exception ends **2026-11-05** and is not renewed here.

Customer code uses the existing SecureStore policy, endpoint-scoped session keys, server-side authorization and persistent checkout idempotency protections. Demo storage is separate, contains no customer PII and has no API order mutation. Original demo images are bundled. No new native dependency or Android permission was added. Internal signing is retained; production keys, public deployment and store publication require their existing separate approvals.
