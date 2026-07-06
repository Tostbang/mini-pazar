# Bug Report — Mini Pazar

Generated 2026-07-03 from a full-project audit. The repo is mid-restructure
(old flat `app/dash`, `app/cart`, `app/checkout`, `app/about`, `app/settings`,
`app/profile` are being moved into Next.js route groups `app/(site)/...` and
`app/(dash)/...`; `lib/emoji-api.ts`, `lib/emoji-translations.*`, `lib/translate.ts`
were removed; `lib/types/api.d.ts` was regenerated from
`https://marketapi20260604105905-ajfqchdfakgbhggm.canadacentral-01.azurewebsites.net/swagger/v1/swagger.json`).
Nothing is committed yet — all of this is uncommitted.

## Tool failure modes

- `pnpm lint` — **fails**: no `eslint.config.*` exists in the repo.
- `pnpm build` — **fails** on the same TS error as `tsc --noEmit` (the
  `GetByIdProduct` POST→GET mismatch in `app/(dash)/dash/products/_services/queries.ts`).
- `pnpm typecheck` (`tsc --noEmit`) — **6 errors** (listed under Critical and High).

## Critical (breaks build / runtime)

1. **`components/emoji-finder.tsx:11`** — imports `{ emojiTranslations, normalizeText }`
   from `@/lib/emoji-translations`. The file was deleted, so this breaks the
   entire storefront because `app/(site)/page.tsx` renders `<EmojiFinder />`.
   **Fix:** restore `lib/emoji-translations.ts` (and `lib/emoji-translations.json`
   if needed), or replace with category labels sourced from a new module.

2. **`components/emoji-finder.tsx:15`** — imports `EmojiListResponse, EnrichedEmoji`
   from `@/app/api/emojis/route`. The route moved to
   `app/(site)/api/emojis/route.ts`. The URL still resolves (route groups
   don't affect URLs), but the TS module path is broken.
   **Fix:** update the import path to `@/app/(site)/api/emojis/route`, or
   move the types into a shared module under `lib/`.

3. **`app/(dash)/dash/products/_services/queries.ts:29-34`** —
   `useQueryOP("post", "/api/List/GetByIdProduct", { body: { productId } })`.
   The regenerated `lib/types/api.d.ts` defines this endpoint as
   `GET /api/List/GetByIdProduct/{productId}` with `productId` as a path
   parameter (line 1696). TS `TS2345` confirms the contract mismatch and
   `pnpm build` exits with this error.
   **Fix:** switch to
   `useQueryOP("get", "/api/List/GetByIdProduct/{productId}", { params: { path: { productId } } })`
   — same pattern used in `app/(site)/product/_services/queries.ts:17-22`.

4. **`proxy.ts`** (project root) — Next.js 16 expects `middleware.ts` at the
   project root, not `proxy.ts`. The auth gate for `/dash/*` is silently
   inactive.
   **Fix:** rename `proxy.ts` → `middleware.ts`.

5. **`proxy.ts:32`** — calls `request.cookies.get("token")` (server), but the
   auth flow uses `js-cookie` (browser-only) via `lib/helpers.ts:3-13`. On the
   server `getToken()` would crash trying to read `document.cookie`. The
   `token` cookie name is correct, so this would work *if* the file were
   loaded as middleware — but `proxy.ts` is never loaded.

## High (functional bugs)

- **`app/(dash)/dash/settings/_components/settings-form.tsx:35`** — form schema
  includes `siteName`, but `lib/types/api.d.ts:4661-4696`
  (`UpdateSiteSettingsRequest`) does NOT include `siteName`. `toPayload()`
  returns `{ siteName: ... }`, which is rejected by the generated API types.
  TS `TS2353`.
  **Fix:** remove `siteName` from `settingsSchema` and `buildDefaults` /
  `toPayload`, OR regenerate the OpenAPI spec and update `api.d.ts` to add
  `siteName` back to the request schema.

- **`app/(dash)/dash/profile/components/edit-profile-modal.tsx:75-82`** —
  sends `{ firstName, lastName, email, phone }` to `/api/User/UpdateProfile`,
  but the regenerated `UpdateProfileRequest` schema
  (`lib/types/api.d.ts:4644-4653`) now also requires `address`, `city`,
  `postalCode`, `country`. TS `TS2322`.
  **Fix:** add all required fields to the form schema (or pass `null` for
  the new fields and update the form to include address inputs).

- **`lib/fetch.ts:66`** — `const api = data as any;` violates the project's
  CLAUDE.md "no `any`" rule.
  **Fix:** replace with `const api = data as baseApi;` (`baseApi` is already
  defined at line 10 of the same file).

- **`app/(dash)/dash/_components/dash-providers.tsx:5`** — `useProfileStore`
  is used inside this client component but the `setProfile` mutation runs on
  every render where `profileQuery.data?.user` resolves, even if the user
  object hasn't changed. This re-renders every subscriber. Combined with
  `useEffect` deps that include the entire user object, this can cause
  unnecessary re-renders.
  **Fix:** use a stable reference (`profileQuery.dataUpdatedAt`) or shallow
  compare before calling `setProfile`.

- **`hooks/use-has-token.ts:6-13`** — polls `getToken()` every 1 second via
  `setInterval`, but `getToken()` reads `js-cookie` which has no subscription
  mechanism. The Header's login button only updates at most once a second.
  Acceptable but worth flagging.

- **`app/(site)/checkout/page.tsx:100`** — `fetch("/api/client-ip", ...)`
  works at runtime (route moved to `(site)/api/client-ip/route.ts` but URL
  unchanged), but the route is now inside the `(site)` group so only
  `(site)`-prefixed pages can rely on it.

## Medium (lint / typecheck worth fixing)

- **`app/not-found.tsx:20-22`** — JSX contains a stray literal `"global"`
  string: `<h1>...{`\n\t      global\n\t        404\n\t      `}</h1>`. This is
  clearly a debug/dev artifact left over from the multi-root-layout
  restructure.
  **Fix:** remove `"global"` from the heading.

- **`app/(site)/layout.tsx:6`** — imports `"../globals.css"`. The relative
  path resolves to `app/(site)/../globals.css` = `app/globals.css`. Correct,
  but a `@/app/globals.css` absolute import would be more robust.

- **`app/(dash)/layout.tsx:6`** — same relative `import "../globals.css"`
  pattern. Works, but is one of the things the restructure should clean up
  to use `@/app/globals.css`.

- **`app/(dash)/dash/products/_services/queries.ts:7`** and
  **`app/(dash)/dash/about/_services/queries.ts:7`** — both re-export
  `useUploadImage` from `@/lib/upload`. The function is also directly
  imported elsewhere from `@/lib/upload` (e.g. `image-upload-field.tsx`).
  Two different access paths for the same hook is brittle — pick one and
  align.

- **`lib/fetch.ts:5`** — `import { isRedirectError } from
  "next/dist/client/components/redirect-error"`. Reaching into Next.js
  internals is unsupported and may break on minor version bumps.
  **Fix:** use the public `next/navigation` redirect detection or accept the
  redirect as-is.

- **`components/emoji-finder.tsx:15`** — TS error: "Cannot find module
  '@/app/api/emojis/route'". This is a path-only issue (the route exists at
  `app/(site)/api/emojis/route.ts`); flagging here as well since it's
  surfaced by `tsc --noEmit`. (Duplicate of Critical #2.)

## Low

- **`tsconfig.json`** — `"allowJs": true` but no `checkJs`. Combined with
  deleting files without removing imports, this allows stale references to
  slip through. Not a bug per se.

- **ESLint not configured** — `pnpm lint` fails with "ESLint couldn't find
  an eslint.config.(js|mjs|cjs)". CLAUDE.md mandates running `pnpm lint`
  before declaring work done, but no config exists in the repo.
  **Fix:** add a flat config (e.g. `eslint.config.mjs`) that extends
  `eslint-config-next`.

- **`app/(dash)/dash/_components/app-sidebar.tsx:46`** — nav includes
  `href: "/dash/analytics"` but no corresponding
  `app/(dash)/dash/analytics/` directory exists. Sidebar link goes to
  global 404.
  **Fix:** create the page or remove the nav entry.

- **`app/(dash)/dash/layout.tsx:8-11`** — relative imports
  `./dash/_components/...` work because the file is at
  `app/(dash)/layout.tsx`, but the CLAUDE.md convention is `@/` absolute
  imports. Switch to `@/app/(dash)/dash/_components/...` (the alias should
  resolve route groups).

- **`app/(site)/api/emojis/route.ts:15`** — `export const dynamic =
  "force-static"` on a route that returns ~1.6 MB of emoji data forces
  pre-rendering of the entire blob into the build. Intentional per the
  comment, but worth confirming the build output size.

- **`components/header.tsx:114`** — commented-out `<ThemeToggle />`. Dead
  JSX in the bundle; remove or restore.

- **`app/(site)/cart/page.tsx:155,159`** — hardcoded address
  `(+90) 554-264-1999`, `İstanbul, Kadıköy, Moda, Atatürk Caddesi No: 42`.
  Mock data left in the cart UI; should be sourced from the authenticated
  user's address.

- **`app/(site)/cart/page.tsx:399`** — hardcoded `Klarna.` badge on the
  checkout link. Cosmetic, but shows leftover branding.

- **`app/(site)/checkout/page.tsx:39-44`** — Klarna option is selectable but
  the integration doesn't actually support Klarna (the start-checkout API
  and Iyzico gateway are the only path). Either implement or remove the
  option.

## Observations (not bugs, but worth flagging)

- **`lib/types/api.d.ts`** is regenerated from the live Azure API. The
  TypeScript and code layers must keep in sync; the typecheck failures above
  are largely caused by drift between the regenerated types and the call
  sites that hadn't been updated. Re-run `pnpm sync-api` and fix every call
  site that doesn't match the new contract before the next build.

- **`lib/fetch.ts:7`** — hardcoded
  `baseUrl = "https://marketapi20260604105905-ajfqchdfakgbhggm.canadacentral-01.azurewebsites.net"`.
  This bypasses any environment-based switching. CLAUDE.md lists "Hosting
  and deployment pipeline — confirm before implementing" as out of scope,
  but production deployments will need this to be configurable.

- **`.env.local`** still defines `EMOJI_API_KEY`, but `grep` finds no usages
  of `process.env.EMOJI_API_KEY` anywhere in source. Dead config — safe to
  drop.

- **`lib/cart.ts`, `lib/orders.ts`, `lib/products.ts`, `lib/site-settings.ts`**
  are all marked `"use client"` indirectly via the hooks they export, but the
  helpers are imported into server components in some places
  (`app/(site)/page.tsx:12` imports `youMightNeed, justForYou, mostSelling`
  from `@/lib/products`). Verify these imports are tree-shake-safe or move
  the pure helpers into a separate non-client file.

- **`components/header.tsx:27`** — imports `useHasToken` from
  `@/hooks/use-has-token`. There is no `hooks/` entry in `tsconfig.json`
  `paths` but the `@/*` alias covers it, so it resolves. Fine.

- **`app/(site)/[...slug]/page.tsx`** — the catch-all immediately calls
  `notFound()`, which is intentional per the comment. No issue.

- **`app/(dash)/dash/[...slug]`** — I did not see this catch-all under
  `(dash)/dash/`. If it doesn't exist, dashboard URLs that don't match any
  route will fall through to `app/not-found.tsx` instead of the
  dashboard-themed 404. **Fix:** add `app/(dash)/dash/[...slug]/page.tsx`
  that calls `notFound()`.

## Summary

The restructure itself looks mechanically correct — old flat paths are
gone, route groups resolve, no stale `@/app/dash`, `@/app/cart`,
`@/app/checkout`, `@/app/about`, `@/app/settings`, `@/app/profile`,
`@/app/login`, `@/app/register`, `@/app/forgot-password`,
`@/app/reset-password`, `@/app/verify-email`, or `@/app/layout` imports
remain in `app/` or `components/`. The breakage is concentrated in
`components/emoji-finder.tsx` (the deletion of `lib/emoji-translations.ts`)
and in the three call sites that drift from the regenerated
`lib/types/api.d.ts`.