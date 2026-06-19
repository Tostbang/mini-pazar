"use client";

import { useMutationOP } from "@/lib/fetch";

export function useInitializeIyzicoCheckout() {
  return useMutationOP("post", "/api/Payment/iyzico-initialize");
}

export function useIyzicoCallback() {
  return useMutationOP("post", "/api/Payment/iyzico-callback");
}
