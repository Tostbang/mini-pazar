"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMutationOP, useQueryOP } from "@/lib/fetch";
import type { paths } from "@/lib/types/api";

type CategoryListResponse =
  paths["/api/List/GetAllCategory"]["get"]["responses"]["200"]["content"]["application/json"];

export type CategoryListItem = NonNullable<
  CategoryListResponse["categories"]
>[number];

type ProductsByCategoryResponse =
  paths["/api/List/GetProductsByCategory/{categoryId}"]["get"]["responses"]["200"]["content"]["application/json"];

export type CategoryProductItem = NonNullable<
  ProductsByCategoryResponse["products"]
>[number];

/**
 * Tüm kategorileri listeler.
 *
 * `refetchOnMount: true` overrides the global `refetchOnMount: false`
 * set in `lib/query-client.ts`. The categories table renders fresh
 * data whenever the user lands on this page (including after navigating
 * back from a category edit), and — more importantly — the same hook is
 * used on the storefront (CategoryPills on the home page) where the
 * override guarantees the latest list lands on the next mount. The
 * mutation `onSuccess` callbacks below mark the entry stale; the
 * override is what makes that stale-mark actually result in a refetch
 * when the next component reads the query.
 */
export function useGetCategories() {
  return useQueryOP("get", "/api/List/GetAllCategory", {
    refetchOnMount: true,
  });
}

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

function useInvalidateCategories() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({
      queryKey: ["get", "/api/List/GetAllCategory"],
    });
  };
}

export function useCreateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutationOP("post", "/api/Admin/AddCategory", {
    onSuccess: invalidate,
  });
}

export function useUpdateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutationOP("put", "/api/Admin/UpdateCategory", {
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategories();
  return useMutationOP("delete", "/api/Admin/DeleteCategory", {
    onSuccess: invalidate,
  });
}
