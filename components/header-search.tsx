"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowRight, Search, X } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useGetProducts, type ProductListItem } from "@/app/(site)/products/_services/queries";

const SEARCH_DEBOUNCE_MS = 250;
const RESULT_LIMIT = 6;

const currencyFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatPrice(value: number | undefined | null) {
  if (value === null || value === undefined) return "—";
  try {
    return currencyFormatter.format(value);
  } catch {
    return `₺${value.toFixed(2)}`;
  }
}

/**
 * Site genelinde Header'da kullanılan arama bileşeni.
 *
 * - Yazarken 250ms debounce edilir.
 * - Sorgu 2+ karakter olunca `useGetProducts({ search }, 1, 6)` ile sonuç çeker.
 * - Sonuçlar bir Popover'da listelenir; "Daha fazla" linki kullanıcıyı
 *   tam filtrelenmiş `/products?search=...` sayfasına yönlendirir.
 * - Sonuç listesinde bir ürüne tıklamak önce popover'ı kapatır, sonra
 *   `/product/{id}` linkine gider.
 */
export function HeaderSearch({
  className,
  placeholder = "Market, mağaza, sebze veya et arayın",
}: {
  className?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const popoverId = useId();
  const [value, setValue] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Debounce: kullanıcı her tuşa bastığında istek atılmasın.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebounced(value.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [value]);

  // 2+ karakter ve odak/input aktifken popover'ı otomatik aç.
  const shouldQuery = debounced.length >= 2;
  useEffect(() => {
    if (shouldQuery) setOpen(true);
  }, [shouldQuery]);

  const productsQuery = useGetProducts(
    shouldQuery ? { search: debounced } : {},
    1,
    RESULT_LIMIT,
  );

  const results = useMemo<ProductListItem[]>(
    () =>
      (productsQuery.data?.products ?? []).filter(
        (p): p is ProductListItem => Boolean(p),
      ),
    [productsQuery.data?.products],
  );
  const totalCount = productsQuery.data?.totalCount ?? 0;

  const handleClear = () => {
    setValue("");
    setDebounced("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleSeeAll = () => {
    setOpen(false);
    router.push(`/products?search=${encodeURIComponent(debounced)}`);
  };

  const isFetching = productsQuery.isFetching;

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger
        render={
          <div
            role="combobox"
            aria-expanded={open}
            aria-controls={popoverId}
            className={cn(
              "relative flex h-11 w-full items-center rounded-full bg-card pl-11 pr-5 text-sm text-foreground shadow-sm ring-1 ring-transparent transition focus-within:ring-2 focus-within:ring-lime",
              className,
            )}
          />
        }
      >
        <Search className="pointer-events-none absolute left-4 size-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => {
            if (shouldQuery) setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              event.currentTarget.blur();
            }
            if (event.key === "Enter" && shouldQuery) {
              event.preventDefault();
              handleSeeAll();
            }
          }}
          placeholder={placeholder}
          aria-label="Ürün ara"
          className="h-full w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Aramayı temizle"
            className="absolute right-3 grid size-6 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </PopoverTrigger>

      {shouldQuery && (
        <PopoverContent
          id={popoverId}
          align="start"
          sideOffset={8}
          className="w-[var(--anchor-width)] max-w-[440px] p-0"
        >
          <ResultsPanel
            isLoading={isFetching && results.length === 0}
            results={results}
            totalCount={totalCount}
            query={debounced}
            onSeeAll={handleSeeAll}
            onPick={() => setOpen(false)}
          />
        </PopoverContent>
      )}
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Result panel
// ---------------------------------------------------------------------------

function ResultsPanel({
  isLoading,
  results,
  totalCount,
  query,
  onSeeAll,
  onPick,
}: {
  isLoading: boolean;
  results: ProductListItem[];
  totalCount: number;
  query: string;
  onSeeAll: () => void;
  onPick: () => void;
}) {
  return (
    <div className="flex max-h-[60vh] flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {isLoading ? "Aranıyor..." : `"${query}" için sonuçlar`}
        </p>
        {!isLoading && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {totalCount} ürün
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <ResultsSkeleton />
        ) : results.length === 0 ? (
          <EmptyResults />
        ) : (
          <ul className="divide-y divide-border">
            {results.map((product) => (
              <li key={product.productId}>
                <Link
                  href={`/product/${product.productId}`}
                  onClick={onPick}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/60"
                >
                  <ResultThumbnail
                    src={product.imageUrl}
                    alt={product.name ?? "Ürün"}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-foreground">
                      {product.name ?? "—"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      #{product.productId}
                    </p>
                  </div>
                  <span className="shrink-0 font-heading text-sm font-bold tabular-nums text-price">
                    {formatPrice(product.price)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!isLoading && results.length > 0 && (
        <button
          type="button"
          onClick={onSeeAll}
          className="flex items-center justify-between gap-2 border-t border-border bg-muted/40 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <span>Tüm sonuçları gör</span>
          <ArrowRight className="size-4" />
        </button>
      )}
    </div>
  );
}

function ResultThumbnail({
  src,
  alt,
}: {
  src?: string | null;
  alt: string;
}) {
  if (!src) {
    return (
      <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-muted text-xs text-muted-foreground">
        ?
      </div>
    );
  }
  return (
    <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-muted">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="48px"
        unoptimized
        className="object-contain p-1"
      />
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <ul className="divide-y divide-border">
      {Array.from({ length: 3 }).map((_, index) => (
        <li key={index} className="flex items-center gap-3 px-4 py-2.5">
          <div className="size-12 animate-pulse rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-1/4 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        </li>
      ))}
    </ul>
  );
}

function EmptyResults() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <div className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
        <Search className="size-4" />
      </div>
      <p className="text-sm font-medium text-foreground">Sonuç bulunamadı</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        Farklı bir kelime deneyebilir veya tüm ürünleri görmek için
        &ldquo;Tüm sonuçları gör&rdquo;e tıklayabilirsin.
      </p>
    </div>
  );
}