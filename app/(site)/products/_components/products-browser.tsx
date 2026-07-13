"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowDownAZ,
  Filter,
  ImageOff,
  RefreshCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Pagination,
  PaginationInfo,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { LiveProductCard, type LiveProduct } from "@/components/live-product-card";
import { Section } from "@/components/section";
import { cn } from "@/lib/utils";
import { useGetCategories, type CategoryListItem } from "@/app/(site)/category/_services/queries";
import { useGetProducts } from "../_services/queries";
import type { ProductListItem } from "../_services/queries";
import {
  PRODUCT_SORTS,
  type ProductFilters,
  type ProductSort,
} from "../_services/types";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type InitialFilters = {
  categoryId?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: ProductSort;
  page?: number;
};

const PAGE_SIZE = 24;
const COLUMNS_DESKTOP = 4;

// ---------------------------------------------------------------------------
// URL ↔ filters helpers
// ---------------------------------------------------------------------------

function readFiltersFromSearchParams(params: URLSearchParams): InitialFilters {
  const categoryIdRaw = params.get("categoryId");
  const minPriceRaw = params.get("minPrice");
  const maxPriceRaw = params.get("maxPrice");
  const pageRaw = params.get("page");
  const sortRaw = params.get("sort");

  const sortValues = PRODUCT_SORTS.map((s) => s.value);
  const sort =
    sortRaw && (sortValues as readonly string[]).includes(sortRaw)
      ? (sortRaw as ProductSort)
      : undefined;

  return {
    categoryId: categoryIdRaw ? Number(categoryIdRaw) : undefined,
    search: params.get("search") ?? undefined,
    minPrice: minPriceRaw ? Number(minPriceRaw) : undefined,
    maxPrice: maxPriceRaw ? Number(maxPriceRaw) : undefined,
    inStock: params.get("inStock") === "1",
    sort,
    page: pageRaw ? Number(pageRaw) : 1,
  };
}

function writeFiltersToSearchParams(filters: ProductFilters, page: number) {
  const next = new URLSearchParams();
  if (filters.categoryId) next.set("categoryId", String(filters.categoryId));
  if (filters.search?.trim()) next.set("search", filters.search.trim());
  if (typeof filters.minPrice === "number" && filters.minPrice > 0)
    next.set("minPrice", String(filters.minPrice));
  if (typeof filters.maxPrice === "number" && filters.maxPrice > 0)
    next.set("maxPrice", String(filters.maxPrice));
  if (filters.inStock) next.set("inStock", "1");
  if (filters.sort && filters.sort !== "default") next.set("sort", filters.sort);
  if (page > 1) next.set("page", String(page));
  return next;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ProductsBrowser({ initialFilters }: { initialFilters?: InitialFilters }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // İlk render'da URL'den gelen filtreleri kullan; sonraki render'larda
  // client state'i öncelikli kıl (kullanıcı input değiştirdiğinde URL henüz
  // güncellenmemiş olabilir).
  const seed = useMemo<InitialFilters>(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) return initialFilters;
    return readFiltersFromSearchParams(new URLSearchParams(searchParams.toString()));
  }, [initialFilters, searchParams]);

  const [categoryId, setCategoryId] = useState<number | undefined>(seed.categoryId);
  const [minPrice, setMinPrice] = useState<string>(
    typeof seed.minPrice === "number" ? String(seed.minPrice) : "",
  );
  const [maxPrice, setMaxPrice] = useState<string>(
    typeof seed.maxPrice === "number" ? String(seed.maxPrice) : "",
  );
  const [inStock, setInStock] = useState<boolean>(Boolean(seed.inStock));
  const [sort, setSort] = useState<ProductSort>(seed.sort ?? "default");
  const [page, setPage] = useState<number>(seed.page ?? 1);

  const filters = useMemo<ProductFilters>(
    () => ({
      categoryId,
      // `search` sadece URL'den gelir (header'daki HeaderSearch bu sayfaya
      // `?search=…` ile derin link bırakır). Sayfa içinde ayrı bir input
      // yok; bu yüzden local state ve debounce'a gerek kalmadı.
      search: seed.search || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      inStock: inStock || undefined,
      sort,
    }),
    [categoryId, seed.search, minPrice, maxPrice, inStock, sort],
  );

  // Filtre değiştiğinde sayfayı 1'e sıfırla (kullanıcı yeni sonuç sayfasında
  // değil, listenin başında olmalı).
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, seed.search, minPrice, maxPrice, inStock, sort]);

  const productsQuery = useGetProducts(filters, page, PAGE_SIZE);

  // URL'i güncel tut — sayfa paylaşılabilir / geri tuşu çalışır olsun.
  useEffect(() => {
    const next = writeFiltersToSearchParams(filters, page);
    const current = new URLSearchParams(searchParams.toString());
    if (next.toString() === current.toString()) return;
    const qs = next.toString();
    router.replace(qs ? `/products?${qs}` : "/products", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  const totalCount = productsQuery.data?.totalCount ?? 0;
  const totalPages = productsQuery.data?.totalPages ?? 1;
  const products = (productsQuery.data?.products ?? []).filter(
    (p): p is ProductListItem => Boolean(p),
  );
  const isInitialLoading = productsQuery.isPending && !productsQuery.data;

  const handleResetFilters = useCallback(() => {
    setCategoryId(undefined);
    setMinPrice("");
    setMaxPrice("");
    setInStock(false);
    setSort("default");
    setPage(1);
    // Search sadece URL'de yaşıyor; "Temizle" de onu URL'den söksün.
    const qs = new URLSearchParams(searchParams.toString());
    qs.delete("search");
    router.replace(qs.toString() ? `/products?${qs}` : "/products", {
      scroll: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="max-w-[1320px] mx-auto">
        <Section>
          <div className="mb-6 flex flex-col gap-2">
            <h1 className="font-intro text-3xl font-extrabold sm:text-4xl">Tüm Ürünler</h1>
            <p className="text-sm text-muted-foreground">
              Filtreleri kullanarak aradığın ürünü hızlıca bul.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <FilterSidebar
              categoryId={categoryId}
              onCategoryChange={setCategoryId}
              minPrice={minPrice}
              onMinPriceChange={setMinPrice}
              maxPrice={maxPrice}
              onMaxPriceChange={setMaxPrice}
              inStock={inStock}
              onInStockChange={setInStock}
              onReset={handleResetFilters}
              isFetching={productsQuery.isFetching}
            />

            <div className="min-w-0">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <PaginationInfo
                  page={page}
                  totalPages={totalPages}
                  totalItems={totalCount}
                  pageSize={PAGE_SIZE}
                />
                <SortControl value={sort} onChange={setSort} />
              </div>

              {isInitialLoading ? (
                <ProductsGridSkeleton />
              ) : productsQuery.isError ? (
                <ErrorState
                  message={
                    (productsQuery.error as Error | null)?.message ??
                    "Ürünler yüklenemedi."
                  }
                  onRetry={() => productsQuery.refetch()}
                  isFetching={productsQuery.isFetching}
                />
              ) : products.length === 0 ? (
                <EmptyState onReset={handleResetFilters} />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {products.map((product, index) => (
                      <motion.div
                        key={product.productId}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.35,
                          delay: (index % COLUMNS_DESKTOP) * 0.05,
                        }}
                      >
                        <LiveProductCard product={toLiveProduct(product)} />
                      </motion.div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-between gap-3">
                      <PaginationPrevious
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                      />
                      <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                      />
                      <PaginationNext
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FilterSidebar({
  categoryId,
  onCategoryChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  inStock,
  onInStockChange,
  onReset,
  isFetching,
}: {
  categoryId: number | undefined;
  onCategoryChange: (value: number | undefined) => void;
  minPrice: string;
  onMinPriceChange: (value: string) => void;
  maxPrice: string;
  onMaxPriceChange: (value: string) => void;
  inStock: boolean;
  onInStockChange: (value: boolean) => void;
  onReset: () => void;
  isFetching: boolean;
}) {
  const categoriesQuery = useGetCategories();
  const categories = (categoriesQuery.data?.categories ?? []).filter(
    (c): c is CategoryListItem => Boolean(c),
  );

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-heading text-base font-bold text-foreground">
            <SlidersHorizontal className="size-4" />
            Filtreler
          </h2>
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3.5" />
            Temizle
          </button>
        </div>

        <div className="space-y-5">
          <FilterField label="Kategori">
            <Select
              value={categoryId ? String(categoryId) : ""}
              onValueChange={(value) =>
                onCategoryChange(value ? Number(value) : undefined)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tüm kategoriler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tüm kategoriler</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.categoryId} value={String(category.categoryId)}>
                    {category.categoryName?.trim() || `Kategori #${category.categoryId}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Fiyat aralığı (₺)">
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                value={minPrice}
                onChange={(event) => onMinPriceChange(event.target.value)}
                placeholder="Min"
                className="bg-background"
              />
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                value={maxPrice}
                onChange={(event) => onMaxPriceChange(event.target.value)}
                placeholder="Max"
                className="bg-background"
              />
            </div>
          </FilterField>

          <FilterField label="Stok durumu">
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-3 py-2">
              <span className="text-sm font-medium text-foreground">
                Sadece stoktakiler
              </span>
              <Switch
                checked={inStock}
                onCheckedChange={onInStockChange}
                aria-label="Sadece stoktakiler"
              />
            </label>
          </FilterField>
        </div>

        {isFetching && (
          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <RefreshCcw className="size-3 animate-spin" />
            Sonuçlar güncelleniyor...
          </p>
        )}
      </div>
    </aside>
  );
}

function FilterField({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      {children}
    </div>
  );
}

function SortControl({
  value,
  onChange,
}: {
  value: ProductSort;
  onChange: (value: ProductSort) => void;
}) {
  // base-ui Select'inde trigger içindeki metin `SelectValue`'nun children'ıdır,
  // value'dan otomatik türetilmez. Mevcut değerin label'ını bulup explicit
  // geçiyoruz; aksi halde trigger "name_desc" gibi ham değeri gösteriyor.
  const currentLabel =
    PRODUCT_SORTS.find((option) => option.value === value)?.label ?? value;
  return (
    <div className="flex items-center gap-2">
      <ArrowDownAZ className="size-4 text-muted-foreground" />
      <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
        Sırala:
      </span>
      <Select value={value} onValueChange={(next) => onChange(next as ProductSort)}>
        <SelectTrigger className="min-w-[160px]" size="sm">
          <SelectValue>{currentLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {PRODUCT_SORTS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ProductsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse flex-col overflow-hidden rounded-3xl bg-card pt-4 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)]"
        >
          <div className="mx-4 h-32 rounded-xl bg-muted sm:h-36" />
          <div className="mx-4 mt-3 h-4 w-3/4 rounded bg-muted" />
          <div className="mx-4 mt-2 h-5 w-1/2 rounded bg-muted" />
          <div className="mt-4 h-12 rounded-b-3xl bg-muted" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <Filter className="size-6" />
      </span>
      <p className="text-sm font-semibold text-foreground">
        Eşleşen ürün bulunamadı
      </p>
      <p className="max-w-sm text-xs text-muted-foreground">
        Filtrelerini değiştirip tekrar deneyebilir veya tüm filtreleri temizleyebilirsin.
      </p>
      <Button onClick={onReset} variant="outline" size="sm">
        Filtreleri temizle
      </Button>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
  isFetching,
}: {
  message: string;
  onRetry: () => void;
  isFetching: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-destructive/40 bg-destructive/5 px-6 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
        <ImageOff className="size-5" />
      </span>
      <p className="text-sm font-semibold text-foreground">
        Ürünler yüklenemedi
      </p>
      <p className="max-w-sm text-xs text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry} disabled={isFetching}>
        <RefreshCcw className={cn("size-4", isFetching && "animate-spin")} />
        Tekrar dene
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toLiveProduct(product: ProductListItem): LiveProduct {
  return {
    productId: product.productId,
    name: product.name,
    price: product.price,
    imageUrl: product.imageUrl,
  };
}