# Brand onboarding readiness

The customer APK contains no privileged account creation controls. Use the existing separate brandista-admin application and approved operator provisioning process.

1. Receive a brand application through the existing intake API. A platform super administrator reviews it; approval creates an **inactive** brand.
2. Issue the existing onboarding invitation through the super-admin UI. Deliver it only through the configured approved delivery channel. Acceptance establishes the authorized membership; activation separately checks invitation, account and membership eligibility.
3. The assigned brand administrator selects a permitted active brand. Create draft products, set category, PKR price and inventory, review, then publish using the existing merchant catalogue workflow.
4. Verify the product in the customer live catalogue against the configured backend. The current live product contract has no product-photo field or SKU/variant model; image delivery and variants need an approved backend extension before promising those features commercially.
5. Inspect merchant orders and advance only allowed adjacent fulfillment states: PLACED → ACCEPTED → PACKED → SHIPPED → DELIVERED. Delivery attestation does not record COD settlement or create courier tracking.

Authorization is server-side and brand-scoped. Verify two separate brand administrators cannot read or mutate one another's products, inventory or orders. Existing backend integration suites cover these boundaries; repeat acceptance in the deployment environment.

Remaining operations: approved brand agreements and imagery rights, invitation/email delivery, privileged operator access controls, catalogue ownership and stock accuracy, COD/courier handling, settlement, cancellations/returns policy, support, backup/restore, incident response and real deployment/device acceptance. Bulk spreadsheet catalogue import is not promised by the existing contract. Never create production privileged users automatically or reuse showcase products as real stock.
