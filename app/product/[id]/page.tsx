import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgePercent,
  Heart,
  GitCompareArrows,
  Flame,
  Star,
  Truck,
} from "lucide-react";
import { products } from "@/lib/products";
import { AddToCartButton } from "./_components/add-to-cart-button";

export function generateStaticParams() {
  return Object.keys(products).map((id) => ({ id }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = products[id];

  if (!product) {
    notFound();
  }

  const gallery = [
    product.image,
    "/products/flour.png",
    "/products/grocery-bag.png",
    "/products/frozen-mix.png",
  ];

  return (
    <main className="min-h-screen bg-[#f4f4f1] px-3 pb-10 pt-3 sm:px-5 sm:pt-4">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand"
        >
          <ArrowLeft className="size-4" />
          Ana sayfaya dön
        </Link>

        <div className="rounded-[2rem] bg-card p-4 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.35)] sm:p-6 lg:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr]">
            <section className="relative">
              {product.discount ? (
                <div className="absolute left-4 top-4 z-10 grid size-28 place-items-center rounded-full bg-[#134e86] text-center text-white shadow-lg sm:left-8 sm:top-8">
                  <div className="leading-none">
                    <div className="text-4xl font-bold">
                      {product.discount}%
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.3em]">
                      İndirim
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="overflow-hidden rounded-[2rem] bg-[#f5f6f5] p-6 sm:p-10">
                <div className="flex min-h-[420px] items-center justify-center sm:min-h-[520px]">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    width={560}
                    height={560}
                    priority
                    className="h-auto w-full max-w-[420px] object-contain drop-shadow-[0_35px_45px_rgba(0,0,0,0.18)]"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-3 sm:mt-5 sm:gap-4">
                {gallery.map((src, index) => (
                  <button
                    key={`${src}-${index}`}
                    className="flex aspect-square items-center justify-center rounded-2xl bg-card p-2 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.35)] transition-transform hover:-translate-y-0.5"
                    aria-label={`Ürün resmi ${index + 1}`}
                  >
                    <Image
                      src={src}
                      alt=""
                      width={120}
                      height={120}
                      className="h-full w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            </section>

            <section className="flex flex-col justify-between">
              <div>
                <p className="text-base text-muted-foreground">
                  {product.vendor}
                </p>
                <h1 className="mt-2 max-w-xl font-heading text-4xl font-semibold tracking-tight text-brand sm:text-[3.2rem] sm:leading-[1.05]">
                  {product.name}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-base">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="size-5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-foreground">
                      {product.rating?.toFixed(1)} Puan
                    </span>
                  </div>
                  <span className="text-muted-foreground underline underline-offset-2">
                    ({product.reviews} değerlendirme)
                  </span>
                </div>

                <p className="mt-5 font-heading text-5xl font-bold tracking-tight text-price sm:text-[3.65rem]">
                  {product.dollars}.
                  <span className="align-super text-2xl">{product.cents}$</span>
                </p>

                <div className="my-8 h-px bg-border" />

                <div className="flex flex-wrap gap-3">
                  <AddToCartButton product={product} />
                  <button className="inline-flex min-w-48 items-center justify-center gap-2 rounded-full bg-[#b9ea62] px-6 py-4 text-lg font-semibold text-brand transition-colors hover:bg-[#a8dd4c]">
                    Satın al
                    <span className="font-black tracking-tight">tamara</span>
                  </button>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-5 text-lg font-semibold text-brand">
                  <button className="inline-flex items-center gap-2 underline decoration-1 underline-offset-4">
                    <Heart className="size-5" />
                    FAVORİLERE EKLE
                  </button>
                  <span className="hidden h-5 w-px bg-border sm:block" />
                  <button className="inline-flex items-center gap-2 underline decoration-1 underline-offset-4">
                    <GitCompareArrows className="size-5" />
                    Diğer satıcılarla karşılaştır
                  </button>
                </div>

                <div className="my-8 h-px bg-border" />

                <div className="flex flex-wrap items-center justify-between gap-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-[#6f1d4f] text-white">
                      <BadgePercent className="size-5" />
                    </span>
                    <span className="grid size-10 place-items-center rounded-full bg-[#b66517] text-white">
                      <Flame className="size-5" />
                    </span>
                    <span className="grid size-10 place-items-center rounded-full bg-[#204e78] text-white">
                      <Truck className="size-5" />
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-base font-semibold text-[#a35a22]">
                    <Flame className="size-5 fill-current" />
                    Son 35 saatte 100 satıldı
                  </div>
                </div>

                <div className="mt-8 space-y-3 text-base leading-7 text-muted-foreground">
                  <p>
                    SKU:{" "}
                    <span className="font-semibold text-brand capitalize">
                      {product.id.replace(/-/g, " ")}
                    </span>
                  </p>
                  <p>
                    Satıcı:{" "}
                    <span className="text-brand underline decoration-border underline-offset-2">
                      {product.vendor}
                    </span>
                  </p>
                  <p className="max-w-2xl">
                    {product.name} harika lezzetli, besleyici bir alternatiftir.
                    Yemek pişirirken veya fırında kullanmak için idealdir.
                    Doğal olarak zengin bir besin kaynağıdır.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
