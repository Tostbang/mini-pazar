"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useHasToken } from "@/hooks/use-has-token";
import {
  useAddFavorite,
  useIsFavorite,
  useRemoveFavorite,
} from "@/lib/favorites";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  productId: number;
  /** Product name used in the success toast and aria-label. */
  productName?: string | null;
  /**
   * Visual size:
   *  - `"detail"` — full-width pill button used on the product detail page.
   *  - `"card"`   — small round icon overlay in the corner of a product card.
   */
  variant?: "detail" | "card";
  className?: string;
}

/**
 * Heart toggle for a single product. If the user isn't logged in, tapping
 * the button redirects to `/login?next=...` instead of calling the API —
 * the endpoint returns 401 for anonymous users and the toast would be
 * confusing. Optimistic updates flip the heart instantly; a server error
 * rolls the UI back via the favorites store (set in `useSyncFavoritesStore`).
 */
export function FavoriteButton({
  productId,
  productName,
  variant = "detail",
  className,
}: FavoriteButtonProps) {
  const router = useRouter();
  const hasToken = useHasToken();
  const isFavorite = useIsFavorite(productId);
  const addMutation = useAddFavorite();
  const removeMutation = useRemoveFavorite();

  const isPending = addMutation.isPending || removeMutation.isPending;
  const disabled = !Number.isFinite(productId) || productId <= 0 || isPending;

  const handleClick = () => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    const label = productName?.trim() || `Ürün #${productId}`;
    if (isFavorite) {
      removeMutation.mutate(
        { params: { path: { productId } } } as never,
        {
          onError: () =>
            toast.error("Favorilerden kaldırılamadı. Lütfen tekrar deneyin."),
        },
      );
      toast.success(`"${label}" favorilerden kaldırıldı.`);
    } else {
      addMutation.mutate(
        { body: { productId } } as never,
        {
          onError: () =>
            toast.error("Favorilere eklenemedi. Lütfen tekrar deneyin."),
        },
      );
      toast.success(`"${label}" favorilere eklendi.`);
    }
  };

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label={isFavorite ? "Favorilerden kaldır" : "Favorilere ekle"}
        aria-pressed={isFavorite}
        className={cn(
          "grid size-9 place-items-center rounded-full bg-card/90 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60",
          isFavorite && "text-rose-500 hover:text-rose-600",
          className,
        )}
      >
        <Heart
          className="size-4"
          fill={isFavorite ? "currentColor" : "none"}
          strokeWidth={2}
        />
      </button>
    );
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={isFavorite}
      variant="outline"
      size="lg"
      className={cn(
        "min-w-48 rounded-full border bg-card px-6 text-lg font-semibold transition-colors",
        isFavorite
          ? "border-rose-200 text-rose-600 hover:bg-rose-50"
          : "border-brand/20 text-brand hover:bg-brand/5",
        className,
      )}
    >
      <Heart
        className="size-5"
        fill={isFavorite ? "currentColor" : "none"}
        strokeWidth={2}
      />
      {isFavorite ? "Favorilerden kaldır" : "Favorilere ekle"}
    </Button>
  );
}