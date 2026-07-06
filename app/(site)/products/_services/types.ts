/**
 * Pure data + types — safe to import from both server and client modules.
 *
 * Kept in its own file (no `"use client"` directive) so that the server
 * `page.tsx` can import `PRODUCT_SORTS` as a runtime value. If it lived in
 * `queries.ts` (which IS a client module), Next.js would hand the server a
 * client-reference proxy and `PRODUCT_SORTS.map` would throw at runtime.
 */

export const PRODUCT_SORTS = [
  { value: "default", label: "Önerilen" },
  { value: "newest", label: "En yeni" },
  { value: "price_asc", label: "Fiyat: Artan" },
  { value: "price_desc", label: "Fiyat: Azalan" },
  { value: "name_asc", label: "İsim: A → Z" },
  { value: "name_desc", label: "İsim: Z → A" },
] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number]["value"];

/** URL ↔ state arasında taşınan filtreler. Boş değerler API'ye gönderilmez. */
export type ProductFilters = {
  categoryId?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: ProductSort;
};