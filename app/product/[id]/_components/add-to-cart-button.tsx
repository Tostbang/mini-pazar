"use client";

import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useAddCartItem } from "@/lib/cart";
import { getCartProductMeta, type Product } from "@/lib/products";

export function AddToCartButton({ product }: { product: Product }) {
  const addMutation = useAddCartItem();
  const [done, setDone] = useState(false);

  const handleClick = () => {
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
      disabled={addMutation.isPending}
      className="inline-flex min-w-48 items-center justify-center gap-2 rounded-full bg-[#edf2e3] px-6 py-4 text-lg font-semibold text-brand transition-colors hover:bg-[#e5ead7] disabled:opacity-60"
    >
      <ShoppingCart className="size-5" />
      {addMutation.isPending
        ? "Ekleniyor..."
        : done
          ? "Sepete eklendi ✓"
          : "Sepete ekle"}
    </button>
  );
}