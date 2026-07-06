"use client";

import { useQueryOP } from "@/lib/fetch";
import type { paths } from "@/lib/types/api";
import type { ProductFilters } from "./types";

type ProductListResponse =
  paths["/api/List/GetAllProduct"]["get"]["responses"]["200"]["content"]["application/json"];

export type ProductListItem = NonNullable<
  ProductListResponse["products"]
>[number];

type GetAllProductQuery = NonNullable<
  paths["/api/List/GetAllProduct"]["get"]["parameters"]["query"]
>;

// `PRODUCT_SORTS` ve `ProductSort` kardeş dosya `./types.ts`'te — orada
// "use client" yok, dolayısıyla server `page.tsx` runtime'da okuyabiliyor.

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 24;

/**
 * /api/List/GetAllProduct — filtreli + sayfalı aktif ürün listesi.
 *
 * Query anahtarına filtreleri dahil etmek, aynı `useGetProducts` çağrısının
 * farklı filtrelerle bağımsız cache girişleri olarak yaşamasını sağlar; aksi
 * halde kullanıcı kategoriler arasında geçerken eski sayfa verisi gözükür.
 */
export function useGetProducts(
  filters: ProductFilters = {},
  page: number = DEFAULT_PAGE,
  pageSize: number = DEFAULT_PAGE_SIZE,
) {
  // Boş string / 0 / undefined gibi "anlamsız" filtreleri API'ye göndermiyoruz;
  // backend bunları yok sayıyor olsa da, gereksiz parametre query anahtarını
  // kirletiyor ve cache hit/miss kararlarını bozuyor.
  const query: GetAllProductQuery = {
    page,
    pageSize,
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.search?.trim() ? { search: filters.search.trim() } : {}),
    ...(typeof filters.minPrice === "number" && filters.minPrice > 0
      ? { minPrice: filters.minPrice }
      : {}),
    ...(typeof filters.maxPrice === "number" && filters.maxPrice > 0
      ? { maxPrice: filters.maxPrice }
      : {}),
    ...(filters.inStock ? { inStock: true } : {}),
    ...(filters.sort && filters.sort !== "default"
      ? { sort: filters.sort }
      : {}),
  };

  const params = { params: { query } };

  return useQueryOP("get", "/api/List/GetAllProduct", params);
}