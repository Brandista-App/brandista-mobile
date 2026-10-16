# Android manual acceptance

Device acceptance remains pending until run on an emulator and physical phone. Use only the local fictional catalogue and disposable customer identities; a successful COD order reduces demo inventory and remains UNPAID. Never enter real card details. See the build guide for API connectivity.

1. Cold start in light/dark system mode. Confirm readable status bar, loading screen, safe areas and the deliberate light app appearance. Deny unnecessary permissions if any appear and record them as defects.
2. Browse home, brands/storefront, categories and search; change sort and paginate. Pull to refresh. Test empty search, offline/retry and unavailable products. Confirm PKR and the explicit photo-unavailable treatment.
3. Open a protected cart/order deep link such as `brandista://orders/1` signed out. Confirm sign-in gate and no private-data flash. Use Android back through tabs, detail screens, auth and keyboard. Unknown/non-owned orders must show a safe error.
4. Register a disposable email with valid Unicode/password byte limits. Verify field errors, password visibility, wrong password, duplicate email and existing admin-account rejection.
5. Sign in. Restart the process while the token remains valid: identity should restore through SecureStore. Sign out and restart: identity must remain cleared. Wait for expiry/foreground the app and verify sign-in is required; there is no silent refresh endpoint.
6. Add products from two demo brands. Check cart badge, quantities, remove/empty, server subtotal and stock conflict handling. Sign out/in and check server cart persistence.
7. Add two synthetic addresses, edit, select default, delete and select an address for checkout. Exercise long fields, invalid phone, keyboard scrolling and accessible labels.
8. With backend COD enabled, review server prices/delivery/tax/discount/total. Place once; confirm PLACED/COD/UNPAID, order ID, snapshot and empty cart. Confirm order history/detail after restart/login. COD disabled must prevent normal placement.
9. During placement, interrupt network after the request may have reached the server. Restart and sign in as the same customer. Retry the saved request; confirm one order and one stock deduction. A second customer must not see the saved attempt. Do not abandon an uncertain result and place another order.
10. Change stock or price after review using authorized admin tooling. Confirm a 409 requires review again and does not create an order. Verify tapping rapidly produces no duplicate successful order.
11. Test TalkBack, large font, 360dp/phone/tablet/landscape, keyboard avoidance and touch targets. Record actual device/API level, build SHA, screenshots, network and observed defects in the test report.
12. Verify HTTPS and cleartext rejection with a preview/release build, Android backup behavior and native SecureStore persistence. Inspect the generated manifest. These require a real native build and cannot be established by Jest mocks.
