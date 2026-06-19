"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { getCartProductMeta, type Product } from "@/lib/products";
import {
  useAddCartItem,
  useGetMyCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from "@/lib/cart";

export function ProductCard({ product }: { product: Product }) {
  const cartQuery = useGetMyCart();
  const addMutation = useAddCartItem();
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();

  const cartItem = cartQuery.data?.cart.items?.find(
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
      className="group relative flex flex-col overflow-hidden rounded-3xl bg-card pt-4 "
    >
      <Link
        href={`/product/${product.id}`}
        className="flex flex-col items-center px-4"
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
        <h3 className="mt-3 text-center font-heading text-[15px] font-semibold leading-tight text-foreground">
          {product.name}
          {product.subName && (
            <>
              <br />
              <span className="text-[13px] font-medium text-foreground/85">
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

      <div className="relative mt-3 p-4 ">
        <svg
          viewBox="0 0 100 24"
          preserveAspectRatio="none"
          className="block h-5 w-full"
          aria-hidden
        >
          <path
            d="M0 0 C30 18, 70 18, 100 0 L100 24 L0 24 Z"
            className="fill-[#f1f5ea]"
          />
        </svg>
        <div
          className="flex h-12 items-end justify-center bg-[#f1f5ea]
 px-4 pb-3"
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
                  className="grid size-8 place-items-center rounded-full bg-white/30 transition-colors hover:bg-white/50 disabled:opacity-50"
                >
                  <Minus className="size-4" strokeWidth={3} />
                </button>
                <motion.span
                  key={qty}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-heading text-lg font-bold"
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
        <svg
          viewBox="0 0 100 36"
          preserveAspectRatio="none"
          className="block h-8 w-full"
          aria-hidden
        >
          <path
            d="M0 0
       H100
       V24
       C70 36, 30 36, 0 24
       Z"
            className="fill-[#f1f5ea]"
          />
        </svg>
      </div>
    </motion.div>
  );
}

