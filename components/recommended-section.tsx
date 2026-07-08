"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Package, RefreshCcw } from "lucide-react";
import { motion } from "motion/react";
import { LiveProductCard, type LiveProduct } from "./live-product-card";
import { Section } from "@/components/section";
import SectionTitle from "./SectionTitle";
import {
  useGetRecommendedProducts,
  type RecommendedProduct,
} from "@/lib/home-products";

const COLUMNS_DESKTOP = 5;

function toLiveProduct(p: RecommendedProduct): LiveProduct {
  return {
    productId: p.productId,
    name: p.name,
    price: p.price,
    imageUrl: p.imageUrl,
  };
}

export function RecommendedSection({
  title,
  limit = 10,
  seeMoreHref = "/products",
  emptyMessage = "Henüz öneri bulunamadı",
}: {
  title: string;
  limit?: number;
  seeMoreHref?: string;
  emptyMessage?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const query = useGetRecommendedProducts(limit);

  const products = (query.data?.products ?? [])
    .filter((p): p is RecommendedProduct => Boolean(p))
    .slice(0, limit)
    .map(toLiveProduct);

  return (
    <Section>
      <div className="mb-5 flex items-center justify-between">
        <SectionTitle>{title}</SectionTitle>
        <Link
          href={seeMoreHref}
          className="flex items-center gap-1.5 text-sm font-bold text-orange-600 transition-colors hover:text-orange-700"
        >
          Daha fazla <ArrowRight className="size-4" />
        </Link>
      </div>

      {!mounted || query.isLoading ? (
        <ProductsGridSkeleton />
      ) : query.isError ? (
        <ErrorState />
      ) : products.length === 0 ? (
        <EmptyState message={emptyMessage} />
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
              <LiveProductCard product={product} />
            </motion.div>
          ))}
        </div>
      )}
    </Section>
  );
}

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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <Package className="size-6" />
      </span>
      <p className="text-sm font-semibold text-foreground">{message}</p>
      <p className="max-w-sm text-xs text-muted-foreground">
        Mağaza yöneticisi öneriler eklediğinde burada görünecekler.
      </p>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-destructive/40 bg-destructive/5 px-6 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
        <RefreshCcw className="size-5" />
      </span>
      <p className="text-sm font-semibold text-foreground">
        Öneriler yüklenemedi
      </p>
      <p className="max-w-sm text-xs text-muted-foreground">
        Lütfen bağlantınızı kontrol edip sayfayı yenileyin.
      </p>
    </div>
  );
}