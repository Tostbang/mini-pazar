import type { Metadata } from "next";
import "../globals.css";
import localFont from "next/font/local";
import { AppProviders } from "@/components/providers";
import { AsyncFooter } from "@/components/footer";
import { SiteSettingsProvider } from "@/components/site-settings-provider";
import {
  DEFAULT_PUBLIC_SETTINGS,
  normalizeHex,
  pickForeground,
  type PublicSiteSettings,
} from "@/lib/site-settings";
import { fetchPublicSettings } from "@/lib/site-settings-server";

const intro = localFont({
  src: [
    {
      path: "./fonts/intro/Intro Black Alt.otf",
      weight: "800",
      style: "normal",
    },
    {
      path: "./fonts/intro/Intro Bold Alt.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/intro/Intro Regular Alt.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/intro/Intro Light Alt.otf",
      weight: "300",
      style: "normal",
    },
  ],
  variable: "--font-intro",
});

const helvetica = localFont({
  src: [
    {
      path: "./fonts/HelveticaNeueThin.otf",
      weight: "100",
      style: "normal",
    },
    {
      path: "./fonts/HelveticaNeueUltraLight.otf",
      weight: "200",
      style: "normal",
    },
    {
      path: "./fonts/HelveticaNeueLight.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/HelveticaNeueRoman.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/HelveticaNeueMedium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/HelveticaNeueBold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-helvetica",
});

// Mirror `globals.css` `:root` defaults so the inline block never
// produces a flash by injecting temporary fallback values different
// from the ones applied during client hydration.
const FALLBACK_PRIMARY = "#064c4f";
const FALLBACK_SECONDARY = "#bbea70";
const FALLBACK_BACKGROUND = "#f4f6f6";
const FALLBACK_TEXT = "#0f172a";

/**
 * Returns an inline `<style>` payload that mirrors what
 * `SiteSettingsProvider` writes to `document.documentElement` during
 * client hydration. By injecting it server-side we eliminate the
 * first-paint flash from `:root` defaults to the configured brand
 * palette. Two near-identical bodies exist by necessity — server has
 * no access to `document` and the client has no access to the SSR
 * payload — but the helper below factors the shared color math so they
 * stay in lockstep.
 */
function buildRootCss(settings: PublicSiteSettings | null): string {
  const s = settings ?? DEFAULT_PUBLIC_SETTINGS;
  const primary = normalizeHex(s.primaryColor, FALLBACK_PRIMARY);
  const secondary = normalizeHex(s.secondaryColor, FALLBACK_SECONDARY);
  const accent = normalizeHex(s.accentColor, FALLBACK_SECONDARY);
  const background = normalizeHex(s.backgroundColor, FALLBACK_BACKGROUND);
  const text = normalizeHex(s.textColor, FALLBACK_TEXT);
  const primaryFg = pickForeground(primary);
  const accentFg = pickForeground(accent, "#0a0a0a", "#000");
  const custom = s.customCss?.trim() ?? "";


  const rootRule = `:root{--brand:${primary};--brand-foreground:${primaryFg};--lime:${accent};--lime-foreground:${accentFg};--price:${primary};--secondary:${secondary};--background:${background};--foreground:${text};--primary:${primary}}`;

  return custom ? `${rootRule}\n${custom}` : rootRule;
}

/**
 * Build dynamic metadata from public settings. Fetching twice in one
 * render (here + RootLayout below) is safe — Next.js's fetch cache
 * dedupes by URL + `revalidate` window.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchPublicSettings();
  const name =
    settings.siteName?.trim() ||
    DEFAULT_PUBLIC_SETTINGS.siteName ||
    "Mağaza";
  const tagline = settings.siteTagline?.trim();
  const title = tagline ? `${name} — ${tagline}` : name;
  const faviconUrl = settings.faviconUrl?.trim();

  return {
    title,
    description: tagline ?? undefined,
    generator: "v0.app",
    icons: faviconUrl
      ? {
          icon: [{ url: faviconUrl }],
          apple: "/apple-icon.png",
        }
      : {
          icon: [
            {
              url: "/icon-light-32x32.png",
              media: "(prefers-color-scheme: light)",
            },
            {
              url: "/icon-dark-32x32.png",
              media: "(prefers-color-scheme: dark)",
            },
            {
              url: "/icon.svg",
              type: "image/svg+xml",
            },
          ],
          apple: "/apple-icon.png",
        },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await fetchPublicSettings();
  const rootCss = buildRootCss(settings);

  return (
    <html lang="tr" className="bg-background">
      <body
        className={`${helvetica.className}
          ${intro.variable}
          font-sans antialiased`}
      >
        {/* Inline `:root` style block applies the configured brand
            palette before any element using those tokens is rendered,
            so the first paint is already themed. */}
        <style dangerouslySetInnerHTML={{ __html: rootCss }} />
        <AppProviders>
          {/* initialSettings hydrates the Zustand store synchronously
              on mount via useLayoutEffect — see SiteSettingsProvider. */}
          <SiteSettingsProvider initialSettings={settings}>
            {children}
          </SiteSettingsProvider>
        </AppProviders>
        {/* AsyncFooter lives outside the provider because it is a
            server component that fetches its own `hasAbout` and
            `settings` props; props-instead-of-store keeps the server
            boundary clean. */}
        <AsyncFooter />
      </body>
    </html>
  );
}
