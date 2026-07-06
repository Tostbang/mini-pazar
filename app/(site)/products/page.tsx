import { ProductsBrowser } from "./_components/products-browser";
import { PRODUCT_SORTS, type ProductSort } from "./_services/types";

/**
 * /products — filtrelenebilir + sayfalanabilir tüm aktif ürün listesi.
 *
 * Server component olarak searchParams'ı okur; client component'e seed değer
 * olarak aktarır. Bu sayede:
 *  - Sayfa link olarak paylaşıldığında (örn. ?categoryId=3&sort=price_asc)
 *    doğru filtrelerle açılır.
 *  - İlk render'da skeleton göstermek yerine doğrudan filtrelenmiş sonuç
 *    hazırlanmış olur.
 */

type SearchParams = Record<string, string | string[] | undefined>;

const PRODUCT_SORT_VALUES = PRODUCT_SORTS.map((s) => s.value) as readonly string[];

function readSingle(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseInitialFilters(searchParams: SearchParams) {
  const categoryIdRaw = readSingle(searchParams.categoryId);
  const minPriceRaw = readSingle(searchParams.minPrice);
  const maxPriceRaw = readSingle(searchParams.maxPrice);
  const pageRaw = readSingle(searchParams.page);
  const sortRaw = readSingle(searchParams.sort);

  const sort: ProductSort | undefined =
    sortRaw && (PRODUCT_SORT_VALUES as readonly string[]).includes(sortRaw)
      ? (sortRaw as ProductSort)
      : undefined;

  return {
    categoryId: categoryIdRaw ? Number(categoryIdRaw) : undefined,
    search: readSingle(searchParams.search),
    minPrice: minPriceRaw ? Number(minPriceRaw) : undefined,
    maxPrice: maxPriceRaw ? Number(maxPriceRaw) : undefined,
    inStock: readSingle(searchParams.inStock) === "1",
    sort,
    page: pageRaw ? Number(pageRaw) : 1,
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const initialFilters = parseInitialFilters(params);
  return <ProductsBrowser initialFilters={initialFilters} />;
}