"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMutationOP, useQueryOP } from "@/lib/fetch";
import type { paths } from "@/lib/types/api";

type GetAllSupportResponse =
  paths["/api/Support/AdminGetAll"]["get"]["responses"]["200"]["content"]["application/json"];

export type SupportListItem = NonNullable<
  GetAllSupportResponse["items"]
>[number];

/**
 * Tüm SSS kayıtlarını listeler (aktif + pasif). Yönetim paneli için.
 */
export function useGetSupports() {
  return useQueryOP("get", "/api/Support/AdminGetAll", {
    refetchOnMount: true,
  });
}

function useInvalidateSupports() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({
      queryKey: ["get", "/api/Support/AdminGetAll"],
    });
    queryClient.invalidateQueries({
      queryKey: ["get", "/api/Support/GetActiveSupport"],
    });
  };
}

export function useCreateSupport() {
  const invalidate = useInvalidateSupports();
  return useMutationOP("post", "/api/Support/AdminCreate", {
    onSuccess: invalidate,
  });
}

export function useUpdateSupport() {
  const invalidate = useInvalidateSupports();
  return useMutationOP("put", "/api/Support/AdminUpdate", {
    onSuccess: invalidate,
  });
}

export function useDeleteSupport() {
  const invalidate = useInvalidateSupports();
  return useMutationOP("delete", "/api/Support/AdminDelete", {
    onSuccess: invalidate,
  });
}