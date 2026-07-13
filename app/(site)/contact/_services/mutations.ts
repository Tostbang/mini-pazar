"use client";

import { useMutationOP } from "@/lib/fetch";

export type SupportMessagePayload = {
  email: string;
  title: string;
  message: string;
};

/**
 * Site genelinden (anonim) admine destek mesajı gönderir.
 */
export function useSendSupportMessage() {
  return useMutationOP("post", "/api/SupportMessage/UserSend");
}