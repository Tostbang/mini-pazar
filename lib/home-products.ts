"use client";

import { useQueryOP } from "@/lib/fetch";
import type { paths } from "@/lib/types/api";

type GetRecommendedProductsResponse =
  paths["/api/Product/GetRecommendedProducts"]["get"]["responses"]["200"]["content"]["application/json"];

export type RecommendedProduct = NonNullable<
  GetRecommendedProductsResponse["products"]
>[number];

type GetBestSellingProductsResponse =
  paths["/api/Product/GetBestSellingProducts"]["get"]["responses"]["200"]["content"]["application/json"];

export type BestSellingProduct = NonNullable<
  GetBestSellingProductsResponse["products"]
>[number];

/**
 * "Sizin için önerilenler" listesini getirir. Anonim kullanıcıya da açık;
 * userId token claim'inden backend tarafından alınır. refetchOnMount: true
 * ile sayfa her ziyaret edildiğinde taze veri çekilir.
 */
export function useGetRecommendedProducts(limit = 10) {
  return useQueryOP("get", "/api/Product/GetRecommendedProducts", {
    params: { query: { limit } },
    refetchOnMount: true,
  });
}

/**
 * BestSellingPeriod enum: 1=Weekly, 2=Monthly, 3=Yearly.
 * Backend belirtilen dönemde ürün yoksa fallback olarak başka bir dönemi
 * kullanır ve `isFallback: true` döner.
 */
export const BEST_SELLING_PERIOD = {
  Weekly: 1,
  Monthly: 2,
  Yearly: 3,
} as const;

export function useGetBestSellingProducts(period: 1 | 2 | 3) {
  return useQueryOP("get", "/api/Product/GetBestSellingProducts", {
    params: { query: { Period: period } },
    refetchOnMount: true,
  });
}