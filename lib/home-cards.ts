import type { paths } from "@/lib/types/api";

/**
 * Public-facing home-cards payload — mirror of `HomeCardsResponse` in the
 * OpenAPI spec. Kept locally so the dashboard editor and (future)
 * storefront data flow share one source of truth.
 */
export type HomeCards =
  paths["/api/Home/GetHomeCards"]["get"]["responses"]["200"]["content"]["application/json"];

/**
 * Seed values used when the API returns no rows (cold database, no admin
 * customization yet) and as the editor's initial state. Mirrors the copy
 * the storefront used to hardcode so the first paint looks identical to
 * the pre-dynamic build.
 *
 * Images are intentionally left null — the shop owner uploads those
 * through the editor and the components fall back to bundled assets
 * (`/products/grocery-bag.png`, `seller.png`, etc.) when `imageUrl` is
 * null.
 *
 * Featured-store and stay-home backgrounds are seeded with the same
 * colors the previous hardcoded build used (`#083e74`, `#a9411e`,
 * `#6c1143`) so the look-and-feel survives a fresh database.
 *
 * `\n` in titles and descriptions is preserved so a future component
 * rewrite can keep the existing `whitespace-pre-line` line breaks that
 * `best-in-town.tsx` and `hero.tsx` already rely on.
 */
export const DEFAULT_HOME_CARDS: HomeCards = {
  code: "200",
  message: null,
  errors: null,
  mainCard: {
    title: "Marketi ayağiniza getiriyoruz",
    description:
      "Organik ürünler ve sürdürülebilir kaynakli\nmarket teslimati, %4'e varan indirimle.",
    imageUrl: null,
    buttonName: "Şimdi incele",
    enabled: true,
    backgroundColor: null,
  },
  featuredStoreCards: [
    {
      title:
        "%50'ye varan indirim 12:15'e kadar teslimat Hızlı ve ücretsiz",
      description: null,
      imageUrl: null,
      buttonName: "Ücretsiz teslimat",
      enabled: true,
      backgroundColor: "#083e74",
    },
    {
      title: "Sağlık kartımızı kullanarak %5 indirim kazanabilirsiniz",
      description: null,
      imageUrl: null,
      buttonName: "Üyelik kartı",
      enabled: true,
      backgroundColor: "#a9411e",
    },
  ],
  stayHomeCard: {
    title: "Evde Kalın, Tüm İhtiyaçlarınızı Marketimizden Alın!",
    description: "App Store veya Google Play'den uygulamayı indirin",
    imageUrl: null,
    buttonName: null,
    enabled: true,
    backgroundColor: "#6c1143",
  },
  campaignCards: [],
  cityAdvantagesSection: {
    title: "Size her zaman\nşehrin en iyisini sunuyoruz",
    description:
      "2007'den beri ürün geliştirme, destek ve\ngüncellemelerde mükemmelliği sorunsuz alışveriş deneyimi için sunuyoruz.",
    imageUrl: null,
    buttonName: null,
    enabled: true,
    cards: [
      {
        title: "Hediye çeki",
        description: null,
        imageUrl: null,
        buttonName: null,
        enabled: true,
        backgroundColor: null,
      },
      {
        title: "Hediye kartı\nverin",
        description: null,
        imageUrl: null,
        buttonName: null,
        enabled: true,
        backgroundColor: null,
      },
      {
        title: "Tabby faturanızı\nödeyin",
        description: null,
        imageUrl: null,
        buttonName: null,
        enabled: true,
        backgroundColor: null,
      },
      {
        title: "Sipariş ver\nmağazadan al",
        description: null,
        imageUrl: null,
        buttonName: null,
        enabled: true,
        backgroundColor: null,
      },
    ],
  },
};
