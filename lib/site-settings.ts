import type { paths } from "./types/api";

/**
 * Public-facing site settings exposed by the storefront.
 * Mirrors `PublicSiteSettingsResponse` in the OpenAPI spec — kept locally
 * so server-side code (metadata, layout SSR CSS injection) doesn't have to
 * thread React Query through server boundaries.
 */
export type PublicSiteSettings =
  paths["/api/SiteSettings/GetPublicSettings"]["get"]["responses"]["200"]["content"]["application/json"];

/**
 * Fallback values used when the API is unreachable. They are intentionally
 * minimal — only the strings and color slots that the storefront UI depends
 * on at first paint are populated; numeric section orders default to their
 * declared zero values. Without this, the storefront would render an empty
 * brand block instead of a recognizable fallback.
 *
 * Colors are explicit (not `null`) so when the API returns no color for a
 * field, `normalizeHex()` resolves to these brand-aligned defaults instead
 * of producing a transparent page surface.
 */
export const DEFAULT_PUBLIC_SETTINGS: PublicSiteSettings = {
  code: null,
  message: null,
  errors: null,
  siteName: "Mini Pazar",
  siteTagline: "Tazeliği kapınıza getiriyoruz",
  primaryColor: null,
  secondaryColor: null,
  primaryColorForeground: null,
  secondaryColorForeground: null,
  accentColor: null,
  backgroundColor: "#f4f6f6",
  textColor: "#0f172a",
  customCss: null,
  logoUrl: null,
  faviconUrl: null,
  currency: "TRY",
  isPurchasingEnabled: true,
  allowCashOnDelivery: false,
  allowOnlinePayment: true,
  shippingFee: 0,
  freeShippingThreshold: null,
  sliderSectionOrder: 0,
  categorySectionOrder: 1,
  productSectionOrder: 2,
  aboutSectionOrder: 3,
  contactSectionOrder: 4,
  supportSectionOrder: 5,
  footerText: null,
  contactEmail: null,
  contactPhone: null,
};

const HEX3 = /^#([0-9a-fA-F]{3})$/;
const HEX6 = /^#([0-9a-fA-F]{6})$/;

/**
 * Normalize a hex string into `#RRGGBB`. Falls back to `fallback` when the
 * input is missing, malformed, or the API returned a non-color placeholder.
 * Never throws — bad input from the API must not break the storefront.
 */
export function normalizeHex(
  value: string | null | undefined,
  fallback: string,
): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (HEX6.test(trimmed)) return trimmed.toLowerCase();
  if (HEX3.test(trimmed)) {
    const body = trimmed.slice(1);
    return ("#" + body[0] + body[0] + body[1] + body[1] + body[2] + body[2]).toLowerCase();
  }
  return fallback;
}

/**
 * Pick a high-contrast foreground (`#ffffff` or `#0a0a0a`) for a given
 * background hex using sRGB relative luminance. The 0.55 threshold biases
 * toward dark text — most soft brand colors (cream/teal) sit above 0.4
 * luminance and would otherwise flip to white text against a colored
 * background, which kills legibility on buttons.
 */
export function pickForeground(
  hex: string,
  light = "#ffffff",
  dark = "#0a0a0a",
): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return light;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return light;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.55 ? dark : light;
}
