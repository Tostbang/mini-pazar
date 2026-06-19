"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMutationOP, useQueryOP } from "@/lib/fetch";
import type { paths } from "@/lib/types/api";

export { useUploadImage } from "@/lib/upload";

type AboutListResponse =
  paths["/api/List/GetAllAbout"]["get"]["responses"]["200"]["content"]["application/json"];

export type AboutListItem = NonNullable<
  AboutListResponse["abouts"]
>[number];

export function useGetAbouts() {
  return useQueryOP("get", "/api/List/GetAllAbout", {});
}

function useInvalidateAbouts() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({
      queryKey: ["get", "/api/List/GetAllAbout"],
    });
  };
}

export function useCreateAbout() {
  const invalidate = useInvalidateAbouts();
  return useMutationOP("post", "/api/Admin/CreateAbout", {
    onSuccess: invalidate,
  });
}

export function useUpdateAbout() {
  const invalidate = useInvalidateAbouts();
  return useMutationOP("put", "/api/Admin/UpdateAbout", {
    onSuccess: invalidate,
  });
}
