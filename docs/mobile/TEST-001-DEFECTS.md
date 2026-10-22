# TEST-001 observed defects (before fixes)

Baseline: latest mobile main `ac35a14fe9137864f89062abb5ca33456e9aa4bc`;
existing 36 tests / 10 suites passed. The new customer-screen suite reproduced
**3 failing cases and 15 passing cases** before application changes. Raw evidence:
ignored `apps/mobile/.expo/test-001-regressions-before.log`.

1. **High: uncertain checkout result discarded on HTTP 408/429.** Both screen
   tests expected the persisted retry and exact same key, but the retry control
   disappeared. `uncertain()` classified these responses as definite failures,
   causing pending request deletion. A timeout or rate-limit intermediary can
   leave order outcome unknown; starting a new key risks a duplicate. Fix only
   the classification, preserving current handling of validation/stock conflicts.
2. **Medium: UUID generation failure escapes checkout cleanup.** A mocked
   `expo-crypto.randomUUID` failure rejected the event handler; no recoverable
   error appeared and busy/lock cleanup was skipped. Attempt creation happened
   before `try/finally`. Move it inside the guarded block so no order is sent and
   existing error/cleanup logic handles failure.

Regression cases exercise actual React components with mocked API/crypto/storage
boundaries. These are JavaScript failures, not physical iPhone observations.
Final fixes and full validation are recorded in `TEST-001-VERIFICATION.md`.
