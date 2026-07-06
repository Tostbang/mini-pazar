"use client";

import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useAddCartItem } from "@/lib/cart";
import { cn } from "@/lib/utils";

/**
 * `useAddCartItem`'ın beklediği `product` meta bloğu.
 *
 * API'den gelen ürün detayını bu şekle çevirip mutation'a veriyoruz; cart
 * kendi iç snapshot'ını oluştururken bu alanlara ihtiyaç duyuyor.
 */
type AddToCartPayload = {
  productId: number;
  name: string | null | undefined;
  price: number | null | undefined;
  imageUrl: string | null | undefined;
  stock: number | null | undefined;
};

export function AddToCartButton({
  productId,
  name,
  price,
  imageUrl,
  stock,
  className,
}: AddToCartPayload & { className?: string }) {
  const addMutation = useAddCartItem();
  const [done, setDone] = useState(false);

  const isOutOfStock = typeof stock === "number" && stock <= 0;
  const isPending = addMutation.isPending || isOutOfStock;

  const handleClick = () => {
    if (isOutOfStock) {
      toast.error("Bu ürün stokta yok.");
      return;
    }
    addMutation.mutate(
      {
        body: { productId, quantity: 1 },
        product: {
          productName: name ?? "Ürün",
          productImageUrl: imageUrl ?? null,
          unitPrice: typeof price === "number" ? price : 0,
          stock: typeof stock === "number" ? stock : 999,
        },
      } as never,
      {
        onSuccess: () => {
          setDone(true);
          toast.success("Ürün sepete eklendi.");
          setTimeout(() => setDone(false), 1500);
        },
        onError: () => toast.error("Ürün sepete eklenemedi."),
      },
    );
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "inline-flex min-w-48 items-center justify-center gap-2 rounded-full bg-[#edf2e3] px-6 py-4 text-lg font-semibold text-brand transition-colors hover:bg-[#e5ead7] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      <ShoppingCart className="size-5" />
      {addMutation.isPending
        ? "Ekleniyor..."
        : isOutOfStock
          ? "Stokta yok"
          : done
            ? "Sepete eklendi ✓"
            : "Sepete ekle"}
    </button>
  );
}