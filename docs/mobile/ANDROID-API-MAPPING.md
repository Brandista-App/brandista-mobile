# Android API mapping

API root is environment-configured and ends in `/api/v1`. Anonymous discovery and authentication use the existing Spring APIs; customer operations send `Authorization: Bearer <access token>`. MySQL is accessed exclusively by Spring, never by the device. See backend `docs/api/CHECKOUT-CONTRACT.md` for authoritative decimal, ownership, concurrency and error rules.

| Native surface         | Existing endpoint                                      | Contract                                                                                 |
| ---------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Registration           | POST `/registrations`                                  | email/password; password >=12 code points and <=72 UTF-8 bytes                           |
| Login/session/account  | POST `/auth/login`                                     | accessToken, tokenType, expiresIn, account id/email/role; CUSTOMER only                  |
| Home/search/storefront | GET `/products`                                        | page/size/keyword/brandId/categoryId/sort; content/page/size/totalElements/totalPages    |
| Product detail         | GET `/products/{slug}`                                 | product/brand/category, PKR price, availability and stockQuantity; no images or variants |
| Brand discovery        | GET `/brands`                                          | array of active brands; storefront filters products by numeric brandId                   |
| Categories             | GET `/categories?page=&size=`                          | paginated categories                                                                     |
| Cart/badge             | GET `/customers/me/cart`                               | id/items/subtotal/currency; server values                                                |
| Add                    | POST `/customers/me/cart/items`                        | productId/quantity                                                                       |
| Quantity               | PATCH `/customers/me/cart/items/{itemId}`              | quantity, backend eligibility validation                                                 |
| Remove/empty           | DELETE `/customers/me/cart/items/{itemId}` or `/items` | remove returns 204; clear returns cart                                                   |
| Address management     | GET/POST `/customers/me/addresses`, PUT/DELETE `/{id}` | owner-scoped recipient, phone, delivery fields; frontend asks for province               |
| Default address        | PUT `/customers/me/addresses/{id}/default`             | no body; returns default address                                                         |
| Checkout availability  | GET `/customers/me/checkout/config`                    | codEnabled/currency                                                                      |
| Order review           | POST `/customers/me/checkout/preview`                  | addressId; authoritative quoteToken/snapshots/decimal totals                             |
| Place/retry            | POST `/customers/me/orders`                            | addressId/quoteToken and UUID `Idempotency-Key`; 201 new, 200 replay                     |
| Order history/details  | GET `/customers/me/orders?page=&size=`, `/{id}`        | customer-only page or immutable order; other owners return 404                           |

401 expires the local session; 400 exposes backend field errors; 403/404 remain explicit; 409 requires a new review after resolving eligibility/stock changes. Network errors and 5xx retain the exact pending placement UUID/request. 401 also retains it so a customer can sign in again and resolve the original placement. No authoritative pricing or payment state is accepted from the device. No card details are collected.

One order can include multiple brands. There are no fulfilment suborders or brand-specific shipping APIs. All displayed amounts use PKR formatting. Missing/unavailable products and failed requests stay visible; production paths have no mock-data fallback.
