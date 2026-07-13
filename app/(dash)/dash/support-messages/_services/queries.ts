"use client";

import { useQueryOP } from "@/lib/fetch";
import type { paths } from "@/lib/types/api";

type GetAllSupportMessagesResponse =
  paths["/api/SupportMessage/AdminGetAll"]["get"]["responses"]["200"]["content"]["application/json"];

export type SupportMessageItem = NonNullable<
  GetAllSupportMessagesResponse["items"]
>[number];

/**
 * Tüm destek mesajlarını listeler (en yeni üstte). Yönetim paneli için.
 */
export function useGetSupportMessages() {
  return useQueryOP("get", "/api/SupportMessage/AdminGetAll", {
    refetchOnMount: true,
  });
}