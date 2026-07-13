"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveProductCard } from "@/components/live-product-card";
import {
  useGetMyFavorites,
  useFavoritesStore,
  type ListFavoritesResponse,
} from "@/lib/favorites";
import { useHasTokenStatus } from "@/hooks/use-has-token";

/**
 * /account/favorites — kullanıcının favori ürünlerini listeler.
 *
 * Auth gating: Token yoksa /login'e yönlendir. Token var ama sorgu
 * hâlâ yükleniyorsa skeleton; hata varsa yeniden dene butonu;
 * boşsa "Henüz favori yok" CTA.
 */
export function FavoritesList() {
  const router = useRouter();
  const { hasToken, ready } = useHasTokenStatus();

  // Giriş yapmamış kullanıcıları login'e at. `ready` beklenir: token cookie
  // ilk client render'ında henüz okunmamışken (`hasToken` başlangıçta false)
  // geçerli oturumu login'e atmamak için. useEffect hydration uyumsuzluğunu
  // da önler (token yalnızca client'ta okunuyor).
  useEffect(() => {
    if (ready && !hasToken) {
      router.replace("/login?next=/account/favorites");
    }
  }, [ready, hasToken, router]);

  const query = useGetMyFavorites(hasToken);

  // Sorgu yüklenirken token kontrolü beklenebilir; burada mount guard
  // olarak `hasToken`'ı kullanıyoruz — store bağlı bileşenlerin
  // remount'unda query tekrar fire etmesin diye.
  useFavoritesStore((state) => state.ids);

  // Token cookie henüz okunmadıysa (`!ready`) ya da oturum yoksa skeleton
  // göster — ikinci durumda yukarıdaki effect login'e yönlendirir.
  if (!ready || !hasToken) {
    return <FavoritesSkeleton />;
  }

  if (query.isLoading) {
    return <FavoritesSkeleton />;
  }

  if (query.isError) {
    return (
      <div className="rounded-3xl bg-card p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] sm:p-8">
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
          Favoriler yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.
        </div>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => query.refetch()}
        >
          <RefreshCcw className="size-4" />
          Yeniden dene
        </Button>
      </div>
    );
  }

  // `useQueryOP`'s inferred data type unions every response shape (the
  // helper can't narrow to a single endpoint without explicit params).
  // Cast through the typed response declared in lib/favorites.ts —
  // runtime data is governed by the OpenAPI spec, so the cast is safe.
  const data = query.data as ListFavoritesResponse | undefined;
  const products = data?.products ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-card p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-brand sm:text-3xl">
              Favorilerim
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Beğendiğiniz ürünleri buradan takip edebilir, hızlıca
              sepete ekleyebilirsiniz.
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            {products.length} ürün
          </span>
        </div>
      </div>

      {products.length === 0 ? (
        <EmptyFavorites />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <LiveProductCard
              key={product.productId}
              product={{
                productId: product.productId,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyFavorites() {
  return (
    <div className="rounded-3xl bg-card p-10 text-center shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)]">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-rose-50 text-rose-500">
        <Heart className="size-7" />
      </span>
      <h2 className="mt-4 font-heading text-xl font-semibold text-brand">
        Henüz favori ürününüz yok
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Beğendiğiniz ürünlerin kalp simgesine dokunarak buraya
        ekleyebilirsiniz.
      </p>
      <Link
        href="/"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-lime transition-colors hover:bg-brand/90"
      >
        Alışverişe başla
      </Link>
    </div>
  );
}

function FavoritesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-card p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] sm:p-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-3xl" />
        ))}
      </div>
    </div>
  );
}