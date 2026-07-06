"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  ChevronRight,
  FolderTree,
  Hash,
  Loader2,
  Package,
  Plus,
  RefreshCcw,
  Search,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/format";
import {
  useGetProductsByCategory,
  type CategoryProductItem,
} from "../_services/queries";

export default function CategoryDetailPage() {
  const params = useParams<{ categoryId: string }>();
  const categoryId = Number(params?.categoryId);
  const categoryQuery = useGetProductsByCategory(
    categoryId,
    Number.isFinite(categoryId) && categoryId > 0,
  );

  const category = categoryQuery.data?.category;
  const products = categoryQuery.data?.products ?? [];

  const summary = useMemo(() => {
    const active = products.filter((p) => p.isActive).length;
    const totalStock = products.reduce((sum, p) => sum + (p.stock ?? 0), 0);
    return { total: products.length, active, totalStock };
  }, [products]);

  if (!Number.isFinite(categoryId) || categoryId <= 0) {
    return <InvalidCategoryState />;
  }

  if (categoryQuery.isLoading) {
    return <CategoryDetailSkeleton />;
  }

  if (categoryQuery.isError) {
    const errorMessage =
      (categoryQuery.error as Error | null)?.message ?? "Kategori getirilemedi.";
    return (
      <ErrorState
        message={errorMessage}
        onRetry={() => categoryQuery.refetch()}
        isFetching={categoryQuery.isFetching}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/dash/categories" />}
            className="self-start"
          >
            <ArrowLeft className="size-4" />
            Kategorilere dön
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <CategoryIcon
                value={category?.imageUrl}
                alt={category?.categoryName ?? "Kategori"}
              />
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {category?.categoryName ?? `Kategori #${categoryId}`}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Bu kategorideki aktif ürünleri görüntüleyin.
                </p>
              </div>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => categoryQuery.refetch()}
          disabled={categoryQuery.isFetching}
          className="self-start sm:self-auto"
        >
          <RefreshCcw
            className={cn("size-4", categoryQuery.isFetching && "animate-spin")}
          />
          Yenile
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="size-4 text-muted-foreground" />
              Ürünler
            </CardTitle>
            <CardDescription>
              {products.length === 0
                ? "Bu kategoride henüz ürün yok."
                : `${summary.active} aktif · ${summary.total - summary.active} pasif · ${summary.totalStock} adet stok`}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {products.length === 0 ? (
              <EmptyProducts />
            ) : (
              <CategoryProductsList products={products} />
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="size-4 text-muted-foreground" />
                Kategori Bilgisi
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <MetaRow
                icon={Hash}
                label="Kategori ID"
                value={`#${category?.categoryId ?? categoryId}`}
              />
              <MetaRow
                icon={FolderTree}
                label="Ad"
                value={category?.categoryName}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="size-4 text-muted-foreground" />
                Özet
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <SummaryRow
                label="Toplam Ürün"
                value={String(summary.total)}
              />
              <SummaryRow
                label="Aktif Ürün"
                value={String(summary.active)}
                emphasis
              />
              <SummaryRow
                label="Toplam Stok"
                value={String(summary.totalStock)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components (local — only used here)
// ---------------------------------------------------------------------------

function CategoryProductsList({
  products,
}: {
  products: CategoryProductItem[];
}) {
  return (
    <ul className="divide-y divide-border">
      {products.map((product) => (
        <li
          key={product.productId}
          className="flex items-center gap-4 px-6 py-4"
        >
          <ProductThumbnail
            src={product.imageUrl}
            alt={product.name ?? "Ürün"}
          />
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex flex-col">
                <span className="font-medium text-foreground">
                  {product.name ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground">
                  #{product.productId}
                </span>
              </div>
              <span className="text-sm font-semibold tabular-nums">
                {formatCurrency(product.price)}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Stok: {product.stock ?? 0}</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-medium",
                  product.isActive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400",
                )}
              >
                {product.isActive ? "Aktif" : "Pasif"}
              </span>
            </div>
          </div>
          <Link
            href="/dash/products"
            className="inline-flex items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            Detaylar
            <ChevronRight className="size-4" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ProductThumbnail({
  src,
  alt,
}: {
  src?: string | null;
  alt: string;
}) {
  if (!src) {
    return (
      <div className="grid size-14 shrink-0 place-items-center rounded-lg border border-border bg-muted text-muted-foreground">
        <Package className="size-5" />
      </div>
    );
  }
  return (
    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="56px"
        className="object-cover"
      />
    </div>
  );
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
      <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-border bg-muted text-muted-foreground">
        <FolderTree className="size-5" />
      </div>
    );
  }
  return (
    <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
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

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="text-sm font-medium text-foreground">
          {value?.trim() ? value : "—"}
        </span>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={cn(
          "text-muted-foreground",
          emphasis && "text-sm font-semibold text-foreground",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-right tabular-nums",
          emphasis
            ? "text-base font-semibold text-foreground"
            : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyProducts() {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Search className="size-5" />
      </div>
      <p className="text-sm font-medium text-foreground">
        Bu kategoride henüz ürün yok
      </p>
      <p className="max-w-sm text-xs text-muted-foreground">
        Yeni ürün eklediğinizde burada listelenecek.
      </p>
      <Button
        variant="outline"
        size="sm"
        render={<Link href="/dash/products" />}
        className="mt-2"
      >
        <Plus className="size-4" />
        Ürün ekle
      </Button>
    </div>
  );
}

function InvalidCategoryState() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/dash/categories" />}
        className="self-start"
      >
        <ArrowLeft className="size-4" />
        Kategorilere dön
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Geçersiz kategori</CardTitle>
          <CardDescription>
            Aradığınız kategori kimliği geçerli değil.
          </CardDescription>
        </CardHeader>
      </Card>
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/dash/categories" />}
        className="self-start"
      >
        <ArrowLeft className="size-4" />
        Kategorilere dön
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Kategori getirilemedi</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isFetching}
          >
            <RefreshCcw className={cn("size-4", isFetching && "animate-spin")} />
            Tekrar dene
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoryDetailSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-md" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-40" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-start gap-4">
                <Skeleton className="size-14 rounded-lg" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-lg" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3.5 w-32" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-16" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Kategori yükleniyor...
      </div>
    </div>
  );
}
