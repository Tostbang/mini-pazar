"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { getCartProductMeta, type Product } from "@/lib/products";
import {
  flattenCartItems,
  useAddCartItem,
  useGetMyCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from "@/lib/cart";

// The cream/beige fill of the bottom "add" container. Kept in one place so
// the SVG curve and the underlying container stay perfectly in sync.
const CREAM_BG = "#eef3e3";

export function ProductCard({ product }: { product: Product }) {
  const cartQuery = useGetMyCart();
  const addMutation = useAddCartItem();
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();

  const cartItems = flattenCartItems(cartQuery.data?.cart);
  const cartItem = cartItems.find(
    (it) => it.productId === getCartProductMeta(product).productId,
  );
  const qty = cartItem?.quantity ?? 0;
  const isPending =
    addMutation.isPending ||
    updateMutation.isPending ||
    removeMutation.isPending;

  const handleAdd = () => {
    const meta = getCartProductMeta(product);
    addMutation.mutate(
      {
        body: { productId: meta.productId, quantity: 1 },
        product: {
          productName: meta.productName,
          productImageUrl: meta.productImageUrl,
          unitPrice: meta.unitPrice,
          stock: meta.stock,
          categoryId: meta.categoryId,
          categoryName: meta.categoryName,
          categoryIcon: meta.categoryIcon,
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
        href={`/product/${product.id}`}
        className="flex flex-1 flex-col items-center px-1 pt-2"
      >
        <div className="relative flex h-32 w-full items-center justify-center sm:h-36">
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            width={180}
            height={180}
            className="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <h3 className="mt-3 text-center font-heading text-[15px] font-semibold leading-tight text-brand">
          {product.name}
          {product.subName && (
            <>
              <br />
              <span className="text-[13px] font-medium text-brand/80">
                {product.subName}
              </span>
            </>
          )}
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{product.weight}</p>
        <p className="mt-2 font-heading text-[28px] font-bold leading-none text-price">
          {product.dollars}
          <span className="align-super text-[14px] font-bold">
            .{product.cents}
            <span className="text-price">$</span>
          </span>
        </p>
      </Link>

      {/*
        Bottom "add" container. It is inset from the card edges (p-3 on the
        card) and is itself a rounded shape:
          1. An SVG at the top draws the concave curve (dips down in the
             middle, rises at the sides) and merges into a full-width
             rectangle below.
          2. A flex container with the same cream fill and a matching
             bottom border-radius holds either the bare + icon or the
             stepper pill.

        Because the container has its own rounded bottom corners, the card
        itself doesn't need any extra clipping for the bottom edge.
      */}
      <div className="relative overflow-hidden rounded-b-2xl">
        <svg
          viewBox="0 0 100 32"
          preserveAspectRatio="none"
          className="block h-5 w-full"
          aria-hidden
        >
          <path
            d="M0 0
               C 25 32, 75 32, 100 0
               L 100 32
               L 0 32 Z"
            fill={CREAM_BG}
          />
        </svg>
        <div
          className="flex h-11 items-center justify-center rounded-b-2xl px-3 pb-2"
          style={{ backgroundColor: CREAM_BG }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {qty === 0 ? (
              <motion.button
                key="add"
                aria-label={`${product.name} sepete ekle`}
                onClick={handleAdd}
                disabled={isPending}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileTap={{ scale: 0.9 }}
                className="grid place-items-center text-price transition-colors hover:text-brand disabled:opacity-50"
              >
                <Plus className="size-7" strokeWidth={2.5} />
              </motion.button>
            ) : (
              <motion.div
                key="stepper"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="flex w-full max-w-[160px] items-center justify-between rounded-full bg-lime px-2 py-1.5 text-lime-foreground"
              >
                <button
                  aria-label="Azalt"
                  onClick={handleDecrement}
                  disabled={isPending}
                  className="grid size-8 place-items-center rounded-full bg-white/30 transition-colors hover:bg-white/50 disabled:opacity-50"
                >
                  <Minus className="size-4" strokeWidth={3} />
                </button>
                <motion.span
                  key={qty}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-heading text-lg font-bold tabular-nums"
                >
                  {qty}
                </motion.span>
                <button
                  aria-label="Arttır"
                  onClick={handleIncrement}
                  disabled={isPending}
                  className="grid size-8 place-items-center rounded-full bg-white/30 transition-colors hover:bg-white/50 disabled:opacity-50"
                >
                  <Plus className="size-4" strokeWidth={3} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
