# App Control Center consumer

The official native app reads `/content/homepage?target=MOBILE`, using the existing
public backend client. It refreshes on mount, pull-to-refresh, and every 60 seconds.
No draft or management API is called. Missing/unavailable content falls back to the
existing homepage, including when a previous content query later errors.

HERO, COLLECTIONS, BRANDS and PRODUCTS follow published section order and enabled
states. Banner targeting/scheduling is evaluated server-side. HERO/PROMOTION banners
share HERO; COLLECTION banners appear under COLLECTIONS. Featured references resolve
against the live catalogue, including paginated categories, in operator-selected order.

Both clients share `/products`, `/brands`, `/products?brandId=ID` and
`/products?categoryId=ID` destinations. Native maps products to Expo Router's catalogue
screen. The route now forwards brand/category parameters into the catalogue filters.
Unrecognized/script/external destinations are ignored; content is rendered as native
text and network images, never a webview or HTML.

No new dependency or native configuration is required. Expo SDK 58 documentation was
checked before changing Router/native image usage. Existing app versions keep using
existing catalogue endpoints. Review the backend `docs/content/APP-CONTROL-CENTER.md`
for coordinated deployment and first-banner instructions. This code does not submit
an EAS build, deploy updates or change production content.

From this directory run `npm ci`, `npm run typecheck`, `npm run lint` and `npm test`.
New destination tests cover supported filters and rejection of unsafe routes.
