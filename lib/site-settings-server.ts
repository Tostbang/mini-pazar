import { cookies } from "next/headers";
import { baseUrl } from "./fetch";
import {
  DEFAULT_PUBLIC_SETTINGS,
  type PublicSiteSettings,
} from "./site-settings";

const ENDPOINT = "/api/SiteSettings/GetPublicSettings";

/**
 * ISR-style cache window. 60s is enough so a dashboard "Kaydet" reflects on
 * the next storefront request within a minute, without hammering the API.
 * Bump if the dashboard starts showing stale brand on (site).
 */
const REVALIDATE_SECONDS = 60;

/**
 * Server-side fetch for public site settings. Used by `generateMetadata`
 * and the root layout's first-paint CSS injection so the storefront never
 * flashes default colors before the client store hydrates. Two callers in
 * one render are deduped by Next.js's fetch cache when the URL and
 * `revalidate` window match.
 *
 * Lives in its own file (separate from `site-settings.ts`) so the
 * `next/headers` import stays out of the client bundle — `site-settings.ts`
 * is also imported by client components (footer, SiteSettingsProvider)
 * and the shared Zustand store, which cannot load server-only modules.
 *
 * Forwards the auth cookie (when present) so the server-rendered result
 * matches what `useGetPublicSiteSettings` will see on the client. Without
 * this, the SSR and client paths would call the backend with different
 * contexts — leading to a visible hydration flicker when the client query
 * overrides the SSR-injected palette with the user's actual saved colors.
 */
export async function fetchPublicSettings(): Promise<PublicSiteSettings> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${baseUrl}${ENDPOINT}`, {
      headers,
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) return DEFAULT_PUBLIC_SETTINGS;
    const data = (await response.json()) as Partial<PublicSiteSettings>;
    return { ...DEFAULT_PUBLIC_SETTINGS, ...data };
  } catch {
    return DEFAULT_PUBLIC_SETTINGS;
  }
}
