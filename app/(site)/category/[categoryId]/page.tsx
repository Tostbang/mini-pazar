"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import { motion } from "motion/react";
import {
  ArrowLeft,
  FolderTree,
  ImageOff,
  Package,
  RefreshCcw,
} from "lucide-react";
import { Header } from "@/components/header";
import {
  LiveProductCard,
  type LiveProduct,
} from "@/components/live-product-card";
import { Section } from "@/components/section";
import SectionTitle from "@/components/SectionTitle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useGetProductsByCategory,
  type CategoryProductItem,
} from "../_services/queries";

const COLUMNS_DESKTOP = 5;

export default function CategoryPage() {
  const params = useParams<{ categoryId: string }>();
  const categoryId = Number(params?.categoryId);

  if (!Number.isFinite(categoryId) || categoryId <= 0) {
    return <InvalidCategoryState />;
  }

  return <CategoryPageContent categoryId={categoryId} />;
}

function CategoryPageContent({ categoryId }: { categoryId: number }) {
  const categoryQuery = useGetProductsByCategory(categoryId);

  const category = categoryQuery.data?.category;
  const products = (categoryQuery.data?.products ?? []).filter(
    (p): p is NonNullable<typeof p> => Boolean(p),
  );

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="max-w-[1320px] mx-auto">
        <Header />

        <Section>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon-sm"
                render={<Link href="/" />}
                aria-label="Ana sayfaya dön"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <CategoryIcon
                value={category?.imageUrl}
                alt={category?.categoryName ?? "Kategori"}
              />
              <div className="flex flex-col">
                <SectionTitle>
                  {category?.categoryName ?? `Kategori #${categoryId}`}
                </SectionTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {categoryQuery.isLoading
                    ? "Yükleniyor..."
                    : `${products.length} ürün listeleniyor`}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => categoryQuery.refetch()}
              disabled={categoryQuery.isFetching}
              className="self-start sm:self-auto"
            >
              <RefreshCcw
                className={cn(
                  "size-4",
                  categoryQuery.isFetching && "animate-spin",
                )}
              />
              Yenile
            </Button>
          </div>

          {categoryQuery.isLoading ? (
            <ProductsGridSkeleton />
          ) : categoryQuery.isError ? (
            <ErrorState
              message={
                (categoryQuery.error as Error | null)?.message ??
                "Kategori getirilemedi."
              }
              onRetry={() => categoryQuery.refetch()}
              isFetching={categoryQuery.isFetching}
            />
          ) : products.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {products.map((product, index) => (
                <motion.div
                  key={product.productId}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: (index % COLUMNS_DESKTOP) * 0.06,
                  }}
                >
                  <LiveProductCard product={toLiveProduct(product)} />
                </motion.div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toLiveProduct(product: CategoryProductItem): LiveProduct {
  return {
    productId: product.productId,
    name: product.name,
    price: product.price,
    imageUrl: product.imageUrl,
  };
}

function CategoryIcon({
  value,
  alt,
}: {
  value?: string | null;
  alt: string;
}) {
  if (!value) {
    return (
      <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-border bg-card text-muted-foreground">
        <FolderTree className="size-5" />
      </div>
    );
  }

  // Emoji karakterler metin olarak render edilir; URL'ler için Image kullanılır.
  if (isEmojiCharacter(value)) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="grid size-12 shrink-0 place-items-center rounded-xl border border-border bg-card text-2xl leading-none"
      >
        {value}
      </div>
    );
  }

  return (
    <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border bg-card">
      <Image
        src={value}
        alt={alt}
        fill
        sizes="48px"
        unoptimized
        className="object-contain p-1"
      />
    </div>
  );
}

// Emoji karakterler kısa (1-2 grapheme) ve path/whitespace karakteri içermez.
function isEmojiCharacter(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.length > 8) return false;
  if (/\s/.test(trimmed)) return false;
  if (/[\/\\?#]/.test(trimmed)) return false;
  return true;
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

function ProductsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <Package className="size-6" />
      </span>
      <p className="text-sm font-semibold text-foreground">
        Bu kategoride henüz ürün yok
      </p>
      <p className="max-w-sm text-xs text-muted-foreground">
        Mağaza yöneticisi bu kategoriye ürün eklediğinde burada görünecekler.
      </p>
      <Button render={<Link href="/" />} variant="outline" size="sm">
        Alışverişe devam et
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
        Kategori yüklenemedi
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
  );
}

function InvalidCategoryState() {
  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="max-w-[1320px] mx-auto">
        <Header />
        <Section>
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
            <p className="text-sm font-semibold text-foreground">
              Geçersiz kategori
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Aradığınız kategori kimliği geçerli değil.
            </p>
            <Button render={<Link href="/" />} variant="outline" size="sm">
              Ana sayfaya dön
            </Button>
          </div>
        </Section>
      </div>
    </main>
  );
}
