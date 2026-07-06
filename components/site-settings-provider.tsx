"use client";

import { useLayoutEffect } from "react";
import { useGetPublicSiteSettings } from "@/app/(dash)/dash/settings/_services/queries";
import { useSiteSettingsStore } from "@/lib/store/site-settings-store";
import {
  normalizeHex,
  pickForeground,
  type PublicSiteSettings,
} from "@/lib/site-settings";

// Fallback palette mirrored from `globals.css` `:root` defaults. Used when
// the API hasn't returned a color yet (cold cache, first-ever visit) so the
// bridge from defaults → configured brand never produces a visible flicker.
const FALLBACK_PRIMARY = "#064c4f";
const FALLBACK_SECONDARY = "#bbea70";
const FALLBACK_BACKGROUND = "#f4f6f6";
const FALLBACK_TEXT = "#0f172a";

function applyBrandVars(settings: PublicSiteSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  const primary = normalizeHex(settings.primaryColor, FALLBACK_PRIMARY);
  const secondary = normalizeHex(settings.secondaryColor, FALLBACK_SECONDARY);
  const accent = normalizeHex(settings.accentColor, FALLBACK_SECONDARY);
  const background = normalizeHex(settings.backgroundColor, FALLBACK_BACKGROUND);
  const text = normalizeHex(settings.textColor, FALLBACK_TEXT);

  // `pickForeground` is computed for primary and accent because the
  // storefront relies on `--brand-foreground` and `--lime-foreground` for
  // text rendered on those colored surfaces. Background/text are the
  // page chrome — they get their own direct color values.
  const primaryFg = pickForeground(primary, "");
  const accentFg = pickForeground(accent, "#0a0a0a", "#ffffff");

  root.style.setProperty("--brand", primary);
  root.style.setProperty("--brand-foreground", primaryFg);
  root.style.setProperty("--lime", accent);
  root.style.setProperty("--lime-foreground", accentFg);
  // `--price` is conceptually a darker variant of `--brand`. Inheriting
  // the same value keeps the price color coherent when the primary
  // changes; an explicit override would require a separate dashboard
  // settings field.
  root.style.setProperty("--price", primary);
  // Map the shop owner's secondary onto Tailwind's `--secondary` token
  // so utility classes such as `bg-secondary` (used by shadcn) follow
  // the brand palette without further wiring.
  root.style.setProperty("--secondary", secondary);
  root.style.setProperty("--background", background);
  root.style.setProperty("--foreground", text);
  // `--primary` aliases `--brand` in globals.css, but we set both so the
  // brand theming also reaches the few utility classes that key off
  // `--primary` directly (e.g. `bg-primary` inside shadcn buttons).
  root.style.setProperty("--primary", primary);
}

const CUSTOM_CSS_ID = "mp-custom-site-css";

function applyCustomCss(settings: PublicSiteSettings) {
  if (typeof document === "undefined") return;
  const css = settings.customCss?.trim() ?? "";
  let node = document.getElementById(CUSTOM_CSS_ID) as HTMLStyleElement | null;
  if (!css) {
    node?.remove();
    return;
  }
  if (!node) {
    node = document.createElement("style");
    node.id = CUSTOM_CSS_ID;
    document.head.appendChild(node);
  }
  node.textContent = css;
}

/**
 * Mounts once inside the (site) layout. Fetches public settings, syncs
 * them into the Zustand store, and applies CSS variables + custom CSS
 * onto `<html>`.
 *
 * Trust model: `customCss` is accepted from the API as-is. The shop
 * owner is the sole trusted author of their storefront (per CLAUDE.md
 * target user), and the dashboard form is the only path that writes it.
 *
 * `initialSettings` is the server-rendered copy passed in by the layout
 * — it backstops the very first paint before the React Query cache
 * hydrates so the visible siteName/logo don't flash from defaults to
 * configured values on cold visit.
 */
export function SiteSettingsProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings?: PublicSiteSettings;
}) {
  const setSettings = useSiteSettingsStore((state) => state.setSettings);
  const query = useGetPublicSiteSettings();

  // Query data wins (it's the live source). `initialSettings` is the
  // server-rendered fallback, only used until the client query
  // resolves. `null` only happens if both sources are unavailable.
  const settings = query.data ?? initialSettings ?? null;

  // useLayoutEffect — not useEffect — runs before browser paint, so the
  // brand CSS variables and Zustand store update synchronously with the
  // first frame. Subscribers (Header, BestInTown, etc.) re-render in
  // the same flush, leaving no observable flash from defaults.
  useLayoutEffect(() => {
    if (!settings) return;
    setSettings(settings);
    applyBrandVars(settings);
    applyCustomCss(settings);
  }, [settings, setSettings]);

  return <>{children}</>;
}
