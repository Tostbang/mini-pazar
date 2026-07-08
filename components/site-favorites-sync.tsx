"use client";

import { useEffect } from "react";
import { useGetMyFavorites, useSyncFavoritesStore } from "@/lib/favorites";
import { useHasToken } from "@/hooks/use-has-token";

/**
 * Mounted once near the top of the (site) layout. Hydrates the
 * favorites store from the server for logged-in users so the heart
 * icon on every product card can render in its correct state on
 * first paint. Renders nothing.
 *
 * Anonymous visitors don't trigger a 401 — we gate the underlying
 * query on the token so the favorites endpoint is never hit for
 * guests.
 */
export function SiteFavoritesSync() {
  const hasToken = useHasToken();
  useSyncFavoritesStore();

  // Soft prefetch once on login so the user lands on the favorites
  // page with a warm cache. The query is also refetched by React
  // Query on mount of every consumer — this just nudges it earlier.
  const query = useGetMyFavorites(hasToken);
  useEffect(() => {
    if (hasToken) query.refetch();
    // We intentionally fire once on login.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken]);

  return null;
}