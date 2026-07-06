"use client";

import { useQueryOP } from "@/lib/fetch";
import type { paths } from "@/lib/types/api";

type ProductsByCategoryResponse =
  paths["/api/List/GetProductsByCategory/{categoryId}"]["get"]["responses"]["200"]["content"]["application/json"];

type CategoryListResponse =
  paths["/api/List/GetAllCategory"]["get"]["responses"]["200"]["content"]["application/json"];

export type CategoryProductItem = NonNullable<
  ProductsByCategoryResponse["products"]
>[number];

export type CategoryMeta = NonNullable<ProductsByCategoryResponse["category"]>;

export type CategoryListItem = NonNullable<
  CategoryListResponse["categories"]
>[number];

/**
 * Belirli bir kategorinin aktif ürünlerini getirir.
 * Yanıt: kategori meta bilgisi + ürün listesi.
 * Backend "Kategori bulunamadı" için 400 + ApiError fırlatır.
 */
export function useGetProductsByCategory(categoryId: number, enabled = true) {
  return useQueryOP(
    "get",
    "/api/List/GetProductsByCategory/{categoryId}",
    {
      params: { path: { categoryId } },
      enabled: enabled && Number.isFinite(categoryId) && categoryId > 0,
    },
  );
}

/**
 * Mağazanın tüm kategorilerini getirir. Vitrin kategori listesi için kullanılır.
 *
 * `refetchOnMount: true` overrides the global `refetchOnMount: false`
 * set in `lib/query-client.ts`. The dashboard's category mutations call
 * `invalidateQueries({ queryKey: ["get", "/api/List/GetAllCategory"] })`
 * on the shared QueryClient — without the override, navigating back to
 * the home page would render the pre-mutation snapshot until the user
 * navigated away and back. TanStack Query still returns the cached data
 * instantly while the background refetch runs, so there's no loading
 * flash and the new category list shows up as soon as the network
 * settles.
 */
export function useGetCategories() {
  return useQueryOP("get", "/api/List/GetAllCategory", {
    refetchOnMount: true,
  });
}
