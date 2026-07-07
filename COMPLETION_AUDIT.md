# Mini Pazar — Completion Audit (2026-07-06)

Cross-reference of frontend state vs CLAUDE.md and the backend API surface. Excludes home / hero / slider / support / contact / logo management (being handled separately).

## A. Cart / Checkout correctness — broken today

1. **`/checkout` sends no shipping fields.** `useStartCheckout` only ships `callbackUrl / idempotencyKey / notes / clientIp`. The backend requires `ShippingFullName / ShippingPhone / ShippingAddress / ShippingCity / ShippingPostalCode / ShippingCountry`. **It will 400 every order.** No form exists in `/checkout/page.tsx` to capture these. Same gap in `CreateCashOnDeliveryOrder`.
   - **Fix shape:** add a `ShippingForm` step before payment-method selection, capture the seven fields (Turkish, RHF + Zod, pulled from `useProfileStore` as defaults), pass them into both `useStartCheckout` and `CreateCashOnDeliveryOrder` bodies.

2. **Cart page hardcodes address + phone.** `app/(site)/cart/page.tsx` lines ~153-159. The "Düzenle" button has no handler. The backend 400s checkout if `user.Address/City/Country` are missing.
   - **Fix shape:** replace the hardcoded card with a read from `useGetMyProfile()` + an inline edit modal that calls `PUT /api/User/UpdateProfile`. The form already exists at `app/(dash)/dash/profile/components/edit-profile-modal.tsx` — factor it out so both contexts share it.

3. **Login gates everything.** All four cart/order/payment endpoints are `[Authorize]`; there is no anonymous cart on the backend. Browsing works without login; the first click on **Sepete ekle** must redirect to `/login?next=/cart`. Today the user gets a 401 if they hit the API while unauthenticated.

4. **Payment-method radios don't do anything.** Three radios (card / wallet / Klarna) on `/checkout`; only `card` (Iyzico) is wired. Klarna and wallet are info copy. Either remove the radios or branch the call.
   - **Klarna** doesn't exist in the backend — only Iyzico. If you keep the option, mark it `disabled` with "Yakında" or remove.
   - **Kapıda Nakit / Kapıda POS** in the cart sidebar are not wired either; the correct call would be `POST /api/Order/CreateCashOnDeliveryOrder` (different endpoint, no Iyzico).

5. **Promo code input is decorative.** No `Apply` handler, no mutation, no endpoint exposed. Either wire it or hide it.

## B. Product detail (product-by-id) — thinnest screen

Currently renders one hero image, full description, add-to-cart (=1 only). Missing:

- **Image gallery / thumbnails.** Backend returns `ImageUrl` only (single image). Either ask backend to add `Images[]` to `ProductGetByIdResponse`, or accept the single-image contract and remove the gallery placeholder.
- **Quantity selector on detail.** Today always adds 1. Add `<QtyStepper value=1 max={stock} />` to `<AddToCartButton />`.
- **Related products / "Bu ürünü alanlar bunları da aldı".** The backend already exposes `GET /api/Product/GetRecommendedProducts?limit=N`. Today it's not consumed anywhere — perfect candidate for a `<LiveProductsSection>` below the description.
- **Best-selling rail.** `GET /api/Product/GetBestSellingProducts?Period=monthly` is also unused. Add it to `/product/[id]` and `/category/[id]`.
- **Wishlist / Favorilere ekle** has no endpoint anywhere — either delete the button or add a wishlist surface later.
- **`DisplayOrder` and `IsActive`** are in the response but never rendered. Decide what they mean in this design (e.g. "Yeni" badge for `IsActive`, nothing for `DisplayOrder`).
- **Stock-aware labels** ("Son 2 ürün!") on the product card need `stock` from `LiveProductCard` — it's already in the data, just not rendered.

## C. Product list (`/products`) and category

- **No "store is empty" vs "filtered out" distinction.** Same `<EmptyState />` for both. A new owner's first storefront renders as "Filtreleri temizle" against zero products. Add a separate first-time empty state with a CTA to "Mağaza henüz ürün eklemedi" → link to `/dash/products`.
- **No category index page.** `/category/[id]` exists, but there's no `/categories` listing all categories. `useGetCategories()` is wired (used by `FilterSidebar` and `CategoryPills`); add a simple grid page.
- **No SEO.** No `generateMetadata` on `/products`, `/product/[id]`, `/category/[id]`. Search and social previews will be blank. Each page should export `generateMetadata` reading the product/category name and image.
- **Backend `ProductListItem` has no `CategoryName`.** You have `CategoryId` only. The frontend currently renders the category name by re-fetching `useGetCategories()` and looking it up — fine for now, but a `CategoryName` field on the response would eliminate the second round trip and live in `api.d.ts`.

## D. Cart page — concrete gaps

1. Hardcoded address/phone → use `useProfileStore` (see A.2).
2. Payment radios wired to nothing → see A.4. Cart-level "Ödeme yöntemi" radio should be removed; the choice happens at `/checkout`.
3. Promo code input is decorative → see A.5.
4. "Kupon indirimi" and "Vergiler" rows show but are 0. Either compute from the cart response (the backend already returns `SubTotal/ShippingFee/TotalAmount`; coupon/tax aren't in the response) or remove the rows.
5. Mobile order: summary should be **above** line items on small screens — currently it's below. `flex-col-reverse lg:flex-row` or similar.
6. Vendor grouping exists (collapsible blocks) but comes from no backend field — it's a frontend grouping key that won't match your multi-vendor design later. Mark it TODO or replace with simple flat list until multi-shop exists.

## E. Payment flow

- **Add the `ShippingForm`** described in A.1. The `/checkout` page currently has only the payment-method selector and a SKU list.
- **Pass `PaymentMethod` selection through.** Right now the call is always Iyzico. When user picks "Kapıda Nakit" (the only other option that exists on the backend), the call must split into `useCreateCashOnDeliveryOrder` from `app/(site)/checkout/_services/queries.ts` — which **doesn't exist yet** but should be a one-liner mirror of `useStartCheckout` against `POST /api/Order/CreateCashOnDeliveryOrder`.
- **Klarna** should not be a selectable option — there's no backend endpoint for it. Remove the radio or disable with "Yakında".
- **Polling the payment status** after the callback page renders would be more reliable than relying on the iyzico-callback route's sequencing. `GET /api/Payment/get-payment-status/{orderId}` exists; the result page should poll it.
- **`/checkout/result` UX is unclear.** When the Iyzico callback says success, where does the user land? Today it renders `iyzico-callback-card.tsx`. Should be a success page with the order number, "Siparişlerim" link, and a "Alışverişe devam" CTA. Confirm what `iyzico-callback-card.tsx` shows and either rename or replace.
- **No /account/orders wiring check.** `app/(site)/account/orders/page.tsx` exists; quick verification that it actually reads `GET /api/Order/GetMyOrders` and renders the order list is worth one Read.

## F. Cross-cutting concerns

- **Type drift** on `useAddCartItem().mutate({ body, product: {...} } as never)` — `product` is `as never`. Either narrow the mutation's TS signature or move `product` meta into the body and let the backend ignore extra fields. Today this hides bugs.
- **No error boundaries** beyond per-page inline error states. `app/(site)/error.tsx` and `app/(site)/cart/error.tsx` would turn a thrown render into a customer-friendly retry.
- **`useHasToken` polls every 1s.** Acceptable, but the auth event flow should ideally invalidate once instead of polling. Not urgent.
- **`useGetProductsByCategory` returns `{ category, products }`.** Add `description` and `imageUrl` to the category side of the response (already in `CategoryListItem`) — the page only shows count + name today.

## G. Backend mismatches — raise before they bite

1. **`ProductGetByIdResponse` is bare.** No `CategoryName`, no `ShopName`, no `Images[]`, no SKU/brand. Frontend currently does a second round-trip to look up category by id. Either add `CategoryName` (cheap) or accept and document the second call.
2. **`OrderModel` doesn't expose `CancelledReason` / `CancelledDate`.** Frontend order detail page won't be able to show "İptal nedeni: …" without another fetch.
3. **`/api/Order/GetMyOrders` has no pagination.** Today this returns every order the user ever made — fine for first launch, dangerous at scale. Add `page`/`pageSize` like `GetAllProduct`.
4. **`Order` entity doesn't carry `ShopId`.** Multi-tenant order routing will need this added before the storefront-multiplication work begins.
5. **All public endpoints implicitly pick the first approved shop.** No `?shopId=` query parameter exists. When you do multi-tenant, every public endpoint needs a shop source.
6. **`ProductController.GetBestSellingProducts` accepts `UserId`** in the query but ignores it (always uses the shop's pool). Either remove the param or honor it.
7. **Whitelist drift.** `JwtSessionValidationMiddleware` whitelists `/api/order/iyzicocallback(|form)` but the real route is `/api/Payment/iyzico-callback`. Today it works because `PaymentController.iyzico-callback` is `[AllowAnonymous]`. Worth cleaning up.

## H. CLAUDE.md reality check — update doc, don't move code

- **`/app/dashboard` doesn't exist.** Dashboard lives at `app/(dash)/dash/`, URL prefix `/dash`. Update doc.
- **`/app/admin` doesn't exist.** Admin role is enforced page-by-page via `Role.Admin` (e.g. `/dash/customers`). Update doc.
- **`/app/[storeSlug]` doesn't exist.** Storefront is single-tenant at `app/(site)/`. Update doc; flag the multi-tenant milestone as the missing piece for the "go live under your own brand" success state.
- **"Auth provider / session strategy — out of scope" is wrong.** `proxy.ts` exists (and needs to be `middleware.ts`). Auth pages and login flow are implemented. Move that line out of "out of scope" and into "in progress".
- **One English leak** worth fixing while you're polishing Turkish: four section titles in `app/(site)/page.tsx` (`"You might need"`, `"Most selling products"`, `"Just for you"`) — the source data was renamed but the JSX strings weren't.

## Recommended next-step sequence

Three self-contained PRs that each leave the storefront in a more honest state without locking you into the multi-tenant work done elsewhere.

1. **Cart + Checkout auth gate + profile-driven address.** Wire `useGetMyProfile`, factor out the edit modal, gate `/checkout` behind a complete profile, replace the cart's hardcoded card.
2. **Checkout shipping form + correct order/payment mutation.** Capture the seven address fields, branch `Kapıda Nakit` to `CreateCashOnDeliveryOrder`, remove the Klarna radio, poll payment status on the result page.
3. **Product-detail completeness.** Qty stepper, related-products rail (`GetRecommendedProducts`), best-selling rail (`GetBestSellingProducts`), `generateMetadata`, empty vs filtered-out distinction on `/products`.

---

# Part Two — what is still missing after Part One

## Legally required for a Turkish store (the biggest gap)

Not optional for selling online in Turkey. Going live without them risks fines or takedowns.

1. **Mesafeli Satış Sözleşmesi** — must be presented and accepted **before** checkout.
2. **Ön Bilgilendirme Formu** — the consumer-protection terms the buyer must see pre-purchase.
3. **KVKK Aydınlatma Metni** — required at first visit and on user-profile pages.
4. **Çerez (Cookie) consent banner** with explicit Accept/Reject and persistence of choice.
5. **İade/Değişim Politikası**, **Gizlilik Politikası**, **Kullanım Koşulları** — linked from footer; content should be editable from dashboard settings (currently no slot in `/dash/settings` for any of these).
6. **E-Fatura / E-Arşiv** integration for orders. Confirm the backend has hooks (`/api/Invoice/...`); if missing, it's a backend item.
7. **Order-confirmation email** + shipped/delivered emails. Confirm the backend sends them; if not, both sides need work.

## CLAUDE.md success-state pieces still missing

Called out but never listed with their actual requirements:

8. **`/app/[storeSlug]` auto-generated storefront.** Currently `app/(site)/` is a single hardcoded shop. To go "your own branded site" you need: dynamic `[storeSlug]` route, lookup endpoint (`/api/Shop/GetBySlug`), and the storefront sections (`Hero`, `ProductSection`, `PromoBanners`, `BestInTown`) must consume the owner's branding — today only `Header` and SSR-injected CSS variables read from settings.
9. **Domain mapping** middleware so a custom domain resolves to the right slug.
10. **Template/theme selection** in the dashboard — single fixed layout today; CLAUDE.md implies the owner picks a layout.
11. **Dashboard analytics page** (`/dash/analytics` — sidebar link exists, route does not).
12. **Auth gate that actually runs** — `proxy.ts` → `middleware.ts` rename is still pending; today the `/dash/*` guard is silently inactive.

## Backend capabilities the frontend never uses

These endpoints exist; no page consumes them:

13. **`GET /api/Product/GetBestSellingProducts`** (period / categoryId / limit).
14. **`GET /api/Product/GetRecommendedProducts`** (limit).
15. **`PUT /api/Order/CancelMyOrder/{orderId}`** — no UI to cancel from `/account/orders/[orderId]`.
16. **`GET /api/Payment/get-payment-status/{orderId}`** — `/checkout/result` should poll this instead of relying on the synchronous iyzico-callback sequencing.

## Features that exist on neither side

Each requires a decide-and-build conversation:

17. **Reviews / ratings** — no backend entity, no `Review` schema, no FE UI. Either build the domain or accept as a future feature.
18. **Wishlist / favorites** — no endpoint, no FE surface. The "Favorilere ekle" button on product detail is a stub.
19. **Coupons / promo codes** — the cart has a `Promosyon kodu` input wired to nothing; no public coupon endpoint on the backend either. Full feature to design (creation in dashboard, validation in cart, application on checkout).
20. **Product variants** — `Product` has no sizes/colors/options field. Selling clothing or any variant-based product requires entity + admin UI + cart line-item model changes.
21. **Multi-image upload** on the dashboard — backend only stores one `ImageUrl` per product. `use-background-removal` worker exists, but the result overwrites the single slot. Adding a `ProductImage` collection is a backend change with cascading FE changes.
22. **Order tracking / shipping carrier integration** — orders exist, but no tracking-number field, no carrier mapping, no "Kargom nerede?" page.
23. **Returns / refunds** — backend `OrderStatus` enum includes `Refunded` but there is no UI to start a return, no reason capture, no restocking workflow.
24. **Stock alerts / low-stock notifications** on the dashboard — no inventory threshold UI today.

## UX / quality gaps not yet listed

25. **Search experience** is thin — `HeaderSearch` deep-links to `/products?search=...`, but no autocomplete suggestions, no popular searches, no "no results" state, no fuzzy matching.
26. **Abandoned-cart recovery** — no email flow, no dashboard widget for "you have 12 abandoned carts this week".
27. **Structured data / SEO beyond `generateMetadata`** — no Schema.org `Product` / `Offer` / `BreadcrumbList` markup; no `sitemap.xml`; no `robots.txt`. Non-negotiable for a no-code builder whose selling point is "go live".
28. **Performance / image CDN** — `next/image` uses `unoptimized` because the image origin differs from the app origin. A storefront that does not optimize product images will feel slow.
29. **Accessibility on the buy path** — keyboard nav and screen-reader labels on cart stepper, qty selector, and the Iyzico iframe modal should be audited (the modal especially).
30. **Currency / locale of displayed prices** — backend always returns TRY; if the owner wants EUR/USD, that is a render-layer transform plus a settings flag.

## Risks to flag before any production push

- **Address profile prerequisite** must be implemented **before** you expose the cart to customers.
- **Cancel-stock re-increment** is on the backend (`Cancelled` order → stock returned). The dashboard `OrderStatusForm` should confirm before cancelling — confirm there is a confirmation dialog.
- **All-API auth**: with no anonymous cart, every "Sepete ekle" handler (dashboard preview, category card, home section, product detail) must funnel through a single helper that redirects to login on 401, otherwise you get inconsistent behavior across surfaces.

---

## Ranking by "what blocks the success state"

- **#1–7 (Turkish legal pages)** and **#8 (multi-tenant route)** are the only two that prevent "go live under your own brand." Everything else can ship incrementally.
