"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  BadgePercent,
  Heart,
  RefreshCcw,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Section } from "@/components/section";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCategories, type CategoryListItem } from "@/app/(site)/category/_services/queries";
import { cn } from "@/lib/utils";
import { useGetProductById } from "../../_services/queries";
import { AddToCartButton } from "./add-to-cart-button";

const currencyFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatTRY(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  try {
    return currencyFormatter.format(value);
  } catch {
    return `${value.toFixed(2)} ₺`;
  }
}

/**
 * /product/[id] için tüm UI'ı çizer.
 *
 *  - Veri: `useGetProductById` (GET /api/List/GetByIdProduct/{id})
 *  - Kategori adı: `useGetCategories` içinden `categoryId` ile bulunur
 *
 * API'nin sağladığı alanlar görseldeki slotlara birebir bağlanır:
 *  - İndirim rozeti, satış sayacı gibi API'de OLMAYAN alanlar için
 *    placeholder gösterilir; uydurma veri gösterilmez.
 */
export function ProductDetailView({ productId }: { productId: number }) {
  const productQuery = useGetProductById(productId);
  const categoriesQuery = useGetCategories();

  const product = productQuery.data;
  const category = useMemo<CategoryListItem | null>(() => {
    if (!product) return null;
    return (
      (categoriesQuery.data?.categories ?? []).find(
        (c): c is CategoryListItem =>
          Boolean(c) && c.categoryId === product.categoryId,
      ) ?? null
    );
  }, [product, categoriesQuery.data?.categories]);

  // `mounted` gate — ilk paint'te skeleton, ardından gerçek içerik. Bu,
  // sessionStorage'dan cache rehydrate olan client ile boş cache'li server
  // arasındaki olası farkı tolere eder.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!Number.isFinite(productId) || productId <= 0) {
    return <InvalidProductState />;
  }

  const isInitialLoading = !mounted || (productQuery.isPending && !product);

  if (isInitialLoading) {
    return <ProductDetailSkeleton />;
  }

  if (productQuery.isError || !product) {
    return (
      <ErrorState
        message={
          (productQuery.error as Error | null)?.message ??
          "Ürün detayı yüklenemedi."
        }
        onRetry={() => productQuery.refetch()}
        isFetching={productQuery.isFetching}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f4f1] px-3 pb-10 pt-3 sm:px-5 sm:pt-4">
      <div className="mx-auto max-w-[1320px]">
        <Header />
      </div>

      <Section className="mx-auto max-w-[1320px]">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand"
        >
          <ArrowLeft className="size-4" />
          Ana sayfaya dön
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-4 rounded-[2rem] bg-card p-4 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.35)] sm:p-6 lg:p-10"
        >
          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr]">
            <GallerySection
              name={product.name ?? "Ürün"}
              imageUrl={product.imageUrl}
            />

            <section className="flex flex-col justify-between">
              <div>
                <p className="text-base text-muted-foreground">
                  {category?.categoryName?.trim() || "Genel"}
                </p>

                <h1 className="mt-2 max-w-xl font-heading text-4xl font-semibold tracking-tight text-brand sm:text-[2.6rem] sm:leading-[1.05]">
                  {product.name?.trim() || `Ürün #${product.productId}`}
                </h1>

                <PriceTag price={product.price} />

                <Divider />

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="min-w-48 rounded-full border border-brand/20 bg-card px-6 text-lg font-semibold text-brand hover:bg-brand/5"
                  >
                    <Heart className="size-5" />
                    Favorilere ekle
                  </Button>
                  <AddToCartButton
                    productId={product.productId}
                    name={product.name}
                    price={product.price}
                    imageUrl={product.imageUrl}
                    stock={product.stock}
                  />
                </div>

                <Divider />

                <FeatureStrip stock={product.stock} />

                <div className="mt-8 space-y-2.5 text-sm leading-7 text-muted-foreground sm:text-base">
                  <p>
                    <span className="font-semibold text-foreground">
                      Kategoriler:
                    </span>{" "}
                    {category ? (
                      <Link
                        href={`/category/${category.categoryId}`}
                        className="text-brand underline decoration-border underline-offset-2"
                      >
                        {category.categoryName?.trim() ||
                          `Kategori #${category.categoryId}`}
                      </Link>
                    ) : (
                      <span>Genel</span>
                    )}
                  </p>
                  {product.description?.trim() ? (
                    <p className="mt-4 max-w-2xl text-foreground/80">
                      {product.description}
                    </p>
                  ) : (
                    <p className="mt-4 max-w-2xl italic text-muted-foreground">
                      Bu ürün için açıklama henüz eklenmemiş.
                    </p>
                  )}
                  {product.stock === 0 && (
                    <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                      Stokta yok
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      </Section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GallerySection({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl: string | null | undefined;
}) {
  return (
    <section className="relative">
      <div className="overflow-hidden rounded-[2rem] bg-[#f5f6f5] p-6 sm:p-10">
        <div className="flex min-h-[420px] items-center justify-center sm:min-h-[520px]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              width={560}
              height={560}
              priority
              unoptimized
              className="h-auto w-full max-w-[420px] object-contain drop-shadow-[0_35px_45px_rgba(0,0,0,0.18)]"
            />
          ) : (
            <div className="grid size-40 place-items-center rounded-2xl bg-card text-muted-foreground">
              <span className="text-sm font-medium">Görsel yok</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PriceTag({ price }: { price: number | null | undefined }) {
  // Mockup: büyük tam kısım + superscript ondalık. "₺" mockup'ta $ olarak
  // gösterilmiş; Türkçe mağaza olduğu için ₺ kullanıyoruz ve mockup'taki
  // sayı hissiyatını koruyoruz.
  const value = typeof price === "number" ? price : 0;
  const formatted = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  const [whole, decimal] = formatted.split(",");

  return (
    <p className="mt-5 font-heading text-5xl font-bold tracking-tight text-price sm:text-[3.5rem]">
      {whole}
      <span className="align-super text-2xl">
        ,{decimal}
        <span className="ml-0.5 text-price">₺</span>
      </span>
    </p>
  );
}

function Divider() {
  return <div className="my-8 h-px bg-border" />;
}

function FeatureStrip({ stock }: { stock: number | null | undefined }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-5">
      <div className="flex items-center gap-3">
        <span
          className="grid size-10 place-items-center rounded-full bg-[#6f1d4f] text-white"
          aria-label="İndirim"
          title="İndirim"
        >
          <BadgePercent className="size-5" />
        </span>
        <span
          className="grid size-10 place-items-center rounded-full bg-[#b66517] text-white"
          aria-label="Hızlı kargo"
          title="Hızlı kargo"
        >
          <Truck className="size-5" />
        </span>
        <span
          className={cn(
            "grid size-10 place-items-center rounded-full text-white",
            typeof stock === "number" && stock > 0
              ? "bg-[#204e78]"
              : "bg-muted-foreground/60",
          )}
          aria-label="Stokta"
          title="Stokta"
        >
          {typeof stock === "number" && stock > 0 ? (
            <span className="font-heading text-xs font-bold">{stock}</span>
          ) : (
            <span className="text-xs">0</span>
          )}
        </span>
      </div>
      {/* "X satıldı" verisi API'de yok; stok bilgisi yeterli. */}
    </div>
  );
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

function ProductDetailSkeleton() {
  return (
    <main className="min-h-screen bg-[#f4f4f1] px-3 pb-10 pt-3 sm:px-5 sm:pt-4">
      <div className="mx-auto max-w-[1320px]">
        <Header />
      </div>
      <Section className="mx-auto max-w-[1320px]">
        <Skeleton className="h-5 w-40" />
        <div className="mt-4 rounded-[2rem] bg-card p-4 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.35)] sm:p-6 lg:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr]">
            <Skeleton className="aspect-square w-full rounded-[2rem]" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-14 w-56" />
              <Skeleton className="h-px w-full" />
              <div className="flex gap-3">
                <Skeleton className="h-12 w-48 rounded-full" />
                <Skeleton className="h-12 w-48 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </Section>
    </main>
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
    <main className="min-h-screen bg-[#f4f4f1] px-3 pb-10 pt-3 sm:px-5 sm:pt-4">
      <div className="mx-auto max-w-[1320px]">
        <Header />
      </div>
      <Section className="mx-auto max-w-[1320px]">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand"
        >
          <ArrowLeft className="size-4" />
          Ana sayfaya dön
        </Link>
        <div className="mt-6 flex flex-col items-center gap-3 rounded-3xl border border-dashed border-destructive/40 bg-destructive/5 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-foreground">
            Ürün detayı yüklenemedi
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">{message}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isFetching}
          >
            <RefreshCcw className={cn("size-4", isFetching && "animate-spin")} />
            Tekrar dene
          </Button>
        </div>
      </Section>
    </main>
  );
}

function InvalidProductState() {
  return (
    <main className="min-h-screen bg-[#f4f4f1] px-3 pb-10 pt-3 sm:px-5 sm:pt-4">
      <div className="mx-auto max-w-[1320px]">
        <Header />
      </div>
      <Section className="mx-auto max-w-[1320px]">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand"
        >
          <ArrowLeft className="size-4" />
          Ana sayfaya dön
        </Link>
        <div className="mt-6 flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-foreground">
            Geçersiz ürün
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Aradığınız ürün kimliği geçerli değil.
          </p>
          <Button variant="outline" size="sm" render={<Link href="/" />}>
            Ana sayfaya dön
          </Button>
        </div>
      </Section>
    </main>
  );
}

// `formatTRY` yalnızca typecheck katmanı için; runtime'da PriceTag
// kendi formatını kullanıyor. Ama burada yine de dışa açık bırakıyoruz ki
// başka yerlerden import edilebilir.
export { formatTRY };