"use client";

import { useQueryOP } from "@/lib/fetch";
import type { paths } from "@/lib/types/api";

type ProductDetailResponse =
  paths["/api/List/GetByIdProduct/{productId}"]["get"]["responses"]["200"]["content"]["application/json"];

export type ProductDetail = Omit<ProductDetailResponse, "code" | "message" | "errors">;

/**
 * Tek ürün detayı — `GET /api/List/GetByIdProduct/{productId}`.
 *
 * productId 0 veya negatifse sorguyu atla (mounted değilken / geçersiz
 * route parametrelerinde istek atıp 400 yemek yerine sessizce boş döner).
 */
export function useGetProductById(productId: number, enabled = true) {
  return useQueryOP("get", "/api/List/GetByIdProduct/{productId}", {
    params: { path: { productId } },
    enabled: enabled && Number.isFinite(productId) && productId > 0,
  });
}