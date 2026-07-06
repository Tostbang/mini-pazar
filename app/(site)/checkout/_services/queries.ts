"use client";

import { useMutationOP } from "@/lib/fetch";

export function useStartCheckout() {
  return useMutationOP("post", "/api/Payment/start-package-payment");
}

export function useIyzicoCallback() {
  return useMutationOP("post", "/api/Payment/iyzico-callback");
}