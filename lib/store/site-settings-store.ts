import { create } from "zustand";
import type { PublicSiteSettings } from "@/lib/site-settings";

/**
 * Single Zustand store for live site settings — see CLAUDE.md's "one store
 * per domain" rule. Holds the most recent public settings fetched by the
 * client. The (site) layout injects the same data server-side for first
 * paint; this store is the source of truth for client components during
 * navigation and refetches.
 */
type SiteSettingsStore = {
  settings: PublicSiteSettings | null;
  setSettings: (settings: PublicSiteSettings | null) => void;
};

export const useSiteSettingsStore = create<SiteSettingsStore>((set) => ({
  settings: null,
  setSettings: (settings) => set(() => ({ settings })),
}));
