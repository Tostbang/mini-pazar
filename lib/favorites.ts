"use client";

import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useEffect } from "react";
import { useMutationOP, useQueryOP } from "@/lib/fetch";
import type { components, paths } from "@/lib/types/api";
import { create } from "zustand";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ListFavoritesResponse =
  paths["/api/Favorites/GetMyFavorites"]["get"]["responses"]["200"]["content"]["application/json"];

type AddFavoriteResponse =
  paths["/api/Favorites/AddFavorite"]["post"]["responses"]["200"]["content"]["application/json"];

export type FavoriteProduct = NonNullable<ListFavoritesResponse["products"]>[number];

export type AddFavoriteVariables = components["schemas"]["AddFavoriteRequest"];

export type FavoriteMutationContext = {
  previous: ListFavoritesResponse | undefined;
};

export const FAVORITES_QUERY_KEY: QueryKey = [
  "get",
  "/api/Favorites/GetMyFavorites",
];

// ---------------------------------------------------------------------------
// Store — a small mirror of which products are favorited. The product
// detail page and the LiveProductCard read this so the heart icon can flip
// instantly without a refetch. `useGetMyFavorites` is the source of truth
// — the store is seeded from it and updated optimistically by the mutation
// hooks below.
// ---------------------------------------------------------------------------

type FavoritesStore = {
  ids: Set<number>;
  setIds: (ids: Iterable<number>) => void;
  add: (id: number) => void;
  remove: (id: number) => void;
  clear: () => void;
};

export const useFavoritesStore = create<FavoritesStore>((set) => ({
  ids: new Set<number>(),
  setIds: (ids) => set(() => ({ ids: new Set(ids) })),
  add: (id) =>
    set((state) => {
      if (state.ids.has(id)) return state;
      const next = new Set(state.ids);
      next.add(id);
      return { ids: next };
    }),
  remove: (id) =>
    set((state) => {
      if (!state.ids.has(id)) return state;
      const next = new Set(state.ids);
      next.delete(id);
      return { ids: next };
    }),
  clear: () => set(() => ({ ids: new Set<number>() })),
}));

/** Cheap selector — re-renders only when the boolean flips for this id. */
export function useIsFavorite(productId: number): boolean {
  return useFavoritesStore((state) => state.ids.has(productId));
}

/**
 * Mirror the favorites query into the Zustand store so subscribers
 * (the heart icon on product cards, the page heart toggle) can read
 * the latest set without each subscribing to the full query. Mounted
 * once at the top of the (site) layout — see
 * `components/site-favorites-sync.tsx`.
 */
export function useSyncFavoritesStore(): void {
  const setIds = useFavoritesStore((state) => state.setIds);
  const query = useGetMyFavorites();

  useEffect(() => {
    // The query's inferred data type unions every response shape because
    // `useQueryOP` can't narrow to a single endpoint without explicit
    // params. Cast through the typed response we already declared above
    // — runtime data is governed by the OpenAPI spec, so the cast is
    // safe and keeps the store sync logic a one-liner.
    const data = query.data as ListFavoritesResponse | undefined;
    const products = data?.products ?? null;
    if (!products) return;
    setIds(products.map((p) => p.productId));
  }, [query.data, setIds]);
}

// ---------------------------------------------------------------------------
// Query / mutation hooks
// ---------------------------------------------------------------------------

/**
 * `GET /api/Favorites/GetMyFavorites`. Disabled when the user is not
 * authenticated so anonymous visitors don't trigger a 401.
 */
export function useGetMyFavorites(enabled = true) {
  return useQueryOP("get", "/api/Favorites/GetMyFavorites", {
    enabled,
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();
  const addToStore = useFavoritesStore((state) => state.add);
  return useMutationOP("post", "/api/Favorites/AddFavorite", {
    onMutate: async (variables): Promise<{ previous: ListFavoritesResponse | undefined }> => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_QUERY_KEY });
      const previous = queryClient.getQueryData<ListFavoritesResponse>(FAVORITES_QUERY_KEY);
      const body = variables?.body as AddFavoriteVariables | undefined;
      if (body?.productId) addToStore(body.productId);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FAVORITES_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  const removeFromStore = useFavoritesStore((state) => state.remove);
  return useMutationOP("delete", "/api/Favorites/RemoveFavorite/{productId}", {
    onMutate: async (variables): Promise<FavoriteMutationContext> => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_QUERY_KEY });
      const previous = queryClient.getQueryData<ListFavoritesResponse>(FAVORITES_QUERY_KEY);
      // Path is exposed as `{ productId }` by openapi-fetch — but the path
      // template name is also `productId` so we look it up defensively.
      const pathVars = (variables as { params?: { path?: Record<string, unknown> } } | undefined)?.params?.path;
      const productId =
        typeof pathVars?.productId === "number" ? pathVars.productId : null;
      if (productId !== null) removeFromStore(productId);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      // `useMutationOP`'s context generic isn't narrowed for `delete`
      // methods that take only path params, so the inferred type is
      // `{}`. Cast through our declared shape — the `onMutate` return
      // value is the runtime source of truth.
      const ctx = context as FavoriteMutationContext | undefined;
      if (ctx?.previous) {
        queryClient.setQueryData(FAVORITES_QUERY_KEY, ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
    },
  });
}

// Re-export the response type so consumers don't have to dig through paths.
export type { AddFavoriteResponse, ListFavoritesResponse };