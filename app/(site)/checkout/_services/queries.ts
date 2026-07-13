"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMutationOP } from "@/lib/fetch";
import { CART_QUERY_KEY } from "@/lib/cart";

export function useStartCheckout() {
  return useMutationOP("post", "/api/Payment/start-package-payment");
}

export function useCreateCashOnDeliveryOrder() {
  const queryClient = useQueryClient();
  return useMutationOP("post", "/api/Order/CreateCashOnDeliveryOrder", {
    onSuccess: () => {
      // Stok anında düşer, sepet temizlenir. Sepet cache'ini invalidate
      // et ki kullanıcı sepet sayfasına döndüğünde boşalmış görsün.
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
}

export function useIyzicoCallback() {
  return useMutationOP("post", "/api/Payment/iyzico-callback");
}