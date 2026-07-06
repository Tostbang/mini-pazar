"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMutationOP, useQueryOP } from "@/lib/fetch";
import type { paths } from "@/lib/types/api";

export { useUploadImage } from "@/lib/upload";

type AboutResponse =
  paths["/api/List/GetAbout"]["get"]["responses"]["200"]["content"]["application/json"];

export type AboutModel = NonNullable<AboutResponse["about"]>;

export function useGetAbout() {
  return useQueryOP("get", "/api/List/GetAbout", {});
}

function useInvalidateAbout() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({
      queryKey: ["get", "/api/List/GetAbout"],
    });
  };
}

export function useSaveAbout() {
  const invalidate = useInvalidateAbout();
  return useMutationOP("post", "/api/Admin/SaveAbout", {
    onSuccess: invalidate,
  });
}
