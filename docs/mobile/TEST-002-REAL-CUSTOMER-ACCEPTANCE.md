# BRANDISTA-TEST-002: isolated MySQL customer transaction acceptance

Date: 2026-10-22. **PASS for host-executed Expo API adapters against a real
isolated Spring Boot/MySQL backend. Native UI, Keychain, simulator and physical
iPhone acceptance remain NOT TESTED.** No paid service, signing, device
registration, public exposure, production customer or real payment was used.

## Repository and environment verification

Both repositories were clean before work; remote main refs were fetched without
discarding changes. Mobile [PR #22](https://github.com/Brandista-App/brandista-mobile/pull/22)
is confirmed merged at `88b7c6697e171635bdba568b76f76aaf2de83be7`, containing
TEST-001 `31d42c6`. Created `codex/test-002-isolated-backend` from that main.
Backend current main is `4c7d09cd58337d3cc5c3a5a29b270e33a3b02354`.
Its older local checkout/branch was preserved; a fresh Git archive of current main
was built and run under ignored `apps/mobile/.expo/test-002-backend-main`.

Remotes remain `https://github.com/Brandista-App/brandista-mobile.git` and
`https://github.com/Brandista-App/brandista-mvp.git`. Publication uses the existing
Brandista SSH identity with Windows OpenSSH. No remote/account was replaced.

Tools: Windows, Node 24.22.0/npm 11.19.1, Java 25.0.4.1 (project targets 21),
Maven wrapper 3.9.11, Docker Engine 29.8.1, Compose 5.5.1, MySQL 8.4.11,
Spring Boot 3.5.16. Existing Expo SDK 58 dependencies remain unchanged.

## Docker diagnosis and corrective action

Initially Docker CLI existed and context was `desktop-linux`, but Desktop/backend
processes were absent and `dockerDesktopLinuxEngine` named pipe was missing.
WSL default was Ubuntu/WSL2. The Docker helper service was Stopped/Manual.

Ran the installed application's supported command:

```powershell
docker desktop start --timeout 60
docker info --format '{{.ServerVersion}}'
docker desktop status
```

Desktop/Engine started successfully; no install, reset, WSL change, service
startup change, firewall edit, data deletion, or global configuration change was
needed. The helper service remained Stopped/Manual; it was not a blocker for this
WSL2 engine. If this symptom recurs, start Desktop normally and verify engine
response before provisioning. Do not reset Docker or delete volumes as a repair.

Pre-existing restart-policy containers resumed with Desktop. They were not used,
reconfigured or stopped by TEST-002. Their loopback ports 8080/3307/3308 were
avoided.

## Isolated runtime and test-data provenance

| Item                     | Verified value                                                                |
| ------------------------ | ----------------------------------------------------------------------------- |
| New Compose project      | brandista-test002-9275f03796                                                  |
| MySQL container          | brandista-test002-9275f03796-mysql-1                                          |
| Database                 | brandista_test002, fresh dedicated volume                                     |
| MySQL binding during run | 127.0.0.1:32768 → 3306                                                        |
| Spring API during run    | http://127.0.0.1:51557/api/v1                                                 |
| Readiness                | HTTP 200, status UP, database ready                                           |
| Migrations               | All V1–V14 applied successfully                                               |
| Data before seed         | 0 users, 0 brands, 0 customer orders                                          |
| Approved seed            | Existing backend scripts/m01-catalogue.sql, unchanged                         |
| Seeded catalogue         | 2 fictional brands, 2 categories, 4 fictional products; initial stock 20 each |
| Customers                | 2 disposable CUSTOMER registrations through the public API                    |

Used existing `compose.yaml` for a unique project and only its MySQL service,
with generated random database/JWT secrets in an ignored local environment file.
The backend ran as a separate loopback Java process, following the repository's
host-Java/MySQL development pattern. No existing acceptance database or volume
was reused. SQL seed execution was gated by the new project label, exact test
database, V14 migrations, and zero users/brands/orders. Product/address/order IDs
were discovered from actual responses, never invented or borrowed from another
stack. No administrator account, privileged JWT, or production credential was
needed.

The older M0.1 seed wrapper is tied to its historical project/schema guard (V9),
so it was not blindly run against current V14. The unchanged approved fictional
SQL was instead applied only after stronger fresh-database checks above. No
backend source, migration, provisioning script, or business logic was edited.

COD was enabled only in this isolated process. JWT lifetime was set to 30 seconds
only here to test genuine expiration; the test waited until the actual issued
token was rejected, including the backend's normal clock-skew tolerance. No
production authentication or payment policy was changed.

## Real customer scenarios executed

The runner imports existing `createClient`, `createApi`, session-store and pending-
order helpers. Ordinary calls use actual HTTP and actual MySQL persistence.
Host-memory storage exercises helper contracts, not native SecureStore/Keychain.
The native iPhone HTTPS guards were not bypassed or changed; loopback HTTP is
restricted to this explicit host test runner.

| Scenario                        | Result | Actual observations                                                                                                                                                              |
| ------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend/DB readiness            | PASS   | HTTP 200/UP; MySQL app-user query succeeded; V14 verified                                                                                                                        |
| Registration/login/logout       | PASS   | Valid registration/login; invalid registration 400, duplicate 409, wrong login 401; logout clears host session/token and protected request returns 401; re-login recovers orders |
| Session/authorization           | PASS   | Host storage roundtrip restores a real accepted token; missing/invalid bearer 401; customer request to admin products 403                                                        |
| Brand/product discovery         | PASS   | 2 brands, 2 categories, 4 products; brand/category filter and slug detail use returned IDs                                                                                       |
| Cart add/update/remove          | PASS   | Two-brand server cart, quantity update and item removal/re-add; quantity zero 400; server subtotal verified                                                                      |
| Address create/retrieve         | PASS   | Create/edit/default/list; invalid recipient 400; another customer's address rejected 404                                                                                         |
| COD checkout                    | PASS   | Real quote, server totals, COD, PLACED/UNPAID order, cart emptied                                                                                                                |
| History/details                 | PASS   | All four owner orders listed; persisted snapshot survives deletion of saved source address; other customer order lookup 404 and history empty                                    |
| Expired authentication          | PASS   | A real login-issued token eventually returns 401 after actual expiration/skew tolerance; no forged privileged token or simulated clock                                           |
| Validation/out of stock         | PASS   | Excess-stock preview 409, no order and no stock mutation; input validation errors propagated through the existing adapters                                                       |
| Lost-response / 408 / 429 retry | PASS   | Controlled client-transport fault after real server 201/commit; persisted original key/request replayed to the same committed order, no duplicate or second stock decrement      |
| Concurrent idempotency          | PASS   | Two simultaneous same-key requests: real HTTP 201/200, same order ID, one order and one decrement                                                                                |
| Same key / changed body         | PASS   | Actual changed owned address with previously used key rejected 409                                                                                                               |
| Mutation runner boundaries      | PASS   | Invalid project and non-loopback API contexts rejected before Docker/HTTP mutations                                                                                              |

The evidence contains **14 passing live scenario groups**. Individual groups
contain multiple requests/assertions; this is not a claim of only 14 HTTP calls
or 14 native UI tests.

### Controlled fault injection distinction

For each retry case the transport first awaited the real server's 201 response
and consumed its body, proving the order had committed. It then deliberately
threw a connection failure or substituted a 408/429 response for the caller.
These three failures are controlled client-side fault injection, **not** claims
that Spring itself returned 408/429 or that an iPhone radio/network was disabled.
MySQL order counts and stock were checked before and after retries. TEST-001's
`uncertain()` classification remained active and retained each exact key.

## Actual MySQL order and inventory evidence

| Order ID (this disposable DB only) | Test case                              | Total PKR | Status / payment |
| ---------------------------------- | -------------------------------------- | --------- | ---------------- |
| 1                                  | Lost response after multi-brand commit | 6250.40   | PLACED / UNPAID  |
| 2                                  | Post-commit 408 injection/replay       | 2499.95   | PLACED / UNPAID  |
| 3                                  | Post-commit 429 injection/replay       | 2499.95   | PLACED / UNPAID  |
| 4                                  | Concurrent same-key submission         | 2499.95   | PLACED / UNPAID  |

Database verification: **4 customer orders, 4 distinct idempotency keys, 0 paid
orders**. Three retry cases each created exactly one order. The concurrent pair
also created exactly one order. Every deliberate same-key/different-body call
returned 409. No money was collected or payment gateway invoked.

Final stock: DEMO Linen Shirt 15 (five units ordered exactly once), DEMO Canvas
Tote 19 (one unit), DEMO Cotton Kurta 20, DEMO Woven Scarf 20. These values came
from MySQL queries and matched returned order quantities. Test customers/orders
are disposable and unrelated to real customers.

## Defects, changes and regression results

**No application integration defect was reproduced.** TEST-001's existing retry
fixes passed real post-commit tests. No backend or mobile runtime source fix,
dependency upgrade, duplicate feature, migration change, or payment change was
needed. Added `apps/mobile/scripts/verify-isolated-customer.ts` as a guarded,
repeatable real-adapter acceptance harness, plus this report.

| Validation                                                        | Result                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------ |
| Current backend main: mvnw.cmd -Dserver.address=127.0.0.1 package | PASS; 190 tests, 0 failures/errors/skips, runnable jar built |
| MySQL/Spring runtime acceptance runner                            | PASS; 14 groups, real persistence and four orders            |
| TypeScript                                                        | PASS                                                         |
| ESLint                                                            | PASS                                                         |
| Expo SDK dependency check                                         | PASS; up to date                                             |
| Expo Doctor                                                       | PASS; 20/20                                                  |
| Jest                                                              | PASS; 65 tests / 13 suites                                   |
| Foreign-project / remote-host safety probes                       | PASS; rejected before mutations                              |
| Native iOS/device/UI tests                                        | NOT TESTED                                                   |

Maven's default automated suite uses existing isolated test fixtures/databases;
the separate runtime acceptance above used **real MySQL 8.4.11**, not H2 or a
mock server. No new fixture identities were used against existing Docker stacks.

## Evidence and reproduction boundaries

Local ignored evidence in `apps/mobile/.expo/`:

- `test-002-backend-build.log`: full Maven build/test summary.
- `test-002-backend-runtime.log`: actual startup/migration/readiness output.
- `test-002-http-run.log`, `test-002-transactions.json`: actual scenario outcomes,
  backend response statuses and order IDs; no passwords or bearer tokens.
- `test-002-database-proof.txt`: MySQL version, schema version, counts, stock and
  order payment/status evidence.
- `test-002-doctor.log`, `test-002-jest.log`: mobile regression results.
- `test-002-context.json`: local non-secret project/port/process metadata;
  generated credentials are separately ignored and never printed or committed.

The runner refuses an already used customer database, wrong project label,
unexpected database/migration/catalogue, or non-loopback API. It requires a
**fresh**, explicitly provisioned TEST-002 context, not an arbitrary API URL.
For this run, local ignored `test-002-stack.ps1` orchestration created only the
unique project, generated its secrets and launched the exported backend. These
local orchestration files/credentials/builds are not committed. Do not repoint
the runner at the existing M0.1 environment or rerun it against retained orders.

The tested acceptance command from `apps/mobile` was:

```powershell
node node_modules/tsx/dist/cli.mjs scripts/verify-isolated-customer.ts
```

## Cleanup and publication

Stopped only the TEST-002 Java process tree and its newly created MySQL container
after verification. The test container is exited, its database volume/data is
**retained**, and loopback test ports 32768/51557 are closed. No `down -v`, volume
deletion, Docker reset or global setting change occurred. Docker Desktop and
pre-existing projects remain running and untouched by cleanup.

Only the mobile repository requires a feature branch:
`codex/test-002-isolated-backend`. Backend checkout/source remains unchanged.
Commit/push/PR or comparison results are supplied in the milestone delivery;
do not merge automatically. Raw generated evidence/builds/secrets stay ignored.

Remaining iPhone requirements: approved reachable HTTPS test backend, an
authorized installed SDK-compatible iOS app when available, actual launch/native
navigation, Keychain/session restoration across restart, background/expiry,
keyboard/VoiceOver/safe areas, and real phone network interruption/customer-flow
acceptance. Host API success does not close these native requirements. No paid
build, signing credential, device registration, Mac requirement or next milestone
was initiated. Stop after TEST-002.
