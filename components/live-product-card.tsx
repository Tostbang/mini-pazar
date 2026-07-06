"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ImageOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  useAddCartItem,
  useGetMyCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from "@/lib/cart";
import { cn } from "@/lib/utils";
const CREAM_BG = "#eef3e3";
const LIME_BG = "#bbea71";

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

export type LiveProduct = {
  productId: number;
  name?: string | null;
  price?: number | null;
  imageUrl?: string | null;
};

export function LiveProductCard({ product }: { product: LiveProduct }) {
  const cartQuery = useGetMyCart();
  const addMutation = useAddCartItem();
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();

  const cartItem = cartQuery.data?.cart.items?.find(
    (it) => it.productId === product.productId,
  );
  const qty = cartItem?.quantity ?? 0;
  const isPending =
    addMutation.isPending ||
    updateMutation.isPending ||
    removeMutation.isPending;

  const handleAdd = () => {
    addMutation.mutate(
      {
        body: { productId: product.productId, quantity: 1 },
        product: {
          productName: product.name ?? "Ürün",
          productImageUrl: product.imageUrl ?? null,
          unitPrice: product.price ?? 0,
          stock: 999,
        },
      } as never,
      {
        onError: () => toast.error("Ürün sepete eklenemedi."),
      },
    );
  };

  const handleIncrement = () => {
    if (!cartItem) return;
    updateMutation.mutate(
      {
        body: {
          cartItemId: cartItem.cartItemId,
          quantity: cartItem.quantity + 1,
        },
      },
      { onError: () => toast.error("Miktar güncellenemedi.") },
    );
  };

  const handleDecrement = () => {
    if (!cartItem) return;
    if (cartItem.quantity <= 1) {
      removeMutation.mutate(
        { body: { cartItemId: cartItem.cartItemId } },
        { onError: () => toast.error("Ürün sepetten kaldırılamadı.") },
      );
    } else {
      updateMutation.mutate(
        {
          body: {
            cartItemId: cartItem.cartItemId,
            quantity: cartItem.quantity - 1,
          },
        },
        { onError: () => toast.error("Miktar güncellenemedi.") },
      );
    }
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-card p-3 shadow-[0_10px_30px_-22px_rgba(0,0,0,0.18)]"
    >
      <Link
        href={`/product/${product.productId}`}
        className="flex flex-col items-center px-4"
      >
        <div className="relative flex h-32 w-full items-center justify-center sm:h-36">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name ?? "Ürün"}
              width={180}
              height={180}
              unoptimized
              className="h-full w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="grid size-16 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <ImageOff className="size-6" />
            </div>
          )}
        </div>
        <h3 className="mt-3 line-clamp-2 min-h-[2.5em] text-center font-heading text-[15px] font-semibold leading-tight text-foreground">
          {product.name ?? "—"}
        </h3>
        <p
          className={cn(
            "mt-3 font-heading text-[26px] font-bold leading-none tabular-nums",
            "text-price",
          )}
        >
          {formatPrice(product.price)}
        </p>
      </Link>

      <div className="relative mt-4">
        <svg
          viewBox="0 0 100 24"
          preserveAspectRatio="none"
          className="block h-5 w-full"
          aria-hidden
        >
          <path
            d="M0 0 C30 18, 70 18, 100 0 L100 24 L0 24 Z"
            fill={qty === 0 ? CREAM_BG : LIME_BG}
          />
        </svg>
        <div
          className="flex h-11 items-center justify-center  px-3 pb-2 rounded-b-2xl"
          style={{ backgroundColor: qty === 0 ? CREAM_BG : LIME_BG }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {qty === 0 ? (
              <motion.button
                key="add"
                aria-label={`${product.name ?? "Ürün"} sepete ekle`}
                onClick={handleAdd}
                disabled={isPending}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileTap={{ scale: 0.9 }}
                className="grid size-10 place-items-center rounded-full text-price transition-colors hover:text-brand disabled:opacity-50"
              >
                <Plus className="size-7" strokeWidth={2.5} />
              </motion.button>
            ) : (
              <motion.div
                key="stepper"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="flex w-full max-w-[180px] items-center justify-between rounded-full bg-lime px-2 py-1.5 text-lime-foreground"
              >
                <button
                  aria-label="Azalt"
                  onClick={handleDecrement}
                  disabled={isPending}
                  className="grid size-8 place-items-center rounded-full border-2 border-brand transition-colors disabled:opacity-50"
                >
                  <Minus className="size-6 text-brand" strokeWidth={3}  />
                </button>
                <motion.span
                  key={qty}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-heading text-2xl font-bold tabular-nums text-brand"
                >
                  {qty}
                </motion.span>
                <button
                  aria-label="Arttır"
                  onClick={handleIncrement}
                  disabled={isPending}
                  className="grid size-8 place-items-center rounded-full border-2 border-brand transition-colors disabled:opacity-50"
                >
                  <Plus className="size-6 text-brand" strokeWidth={3} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
