"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMutationOP, useQueryOP } from "@/lib/fetch";
import type { components, paths } from "@/lib/types/api";

type GetBusinessProfileResponse =
  paths["/api/Admin/GetBusinessProfileForAdmin"]["get"]["responses"]["200"]["content"]["application/json"];

export type BusinessProfile = NonNullable<
  GetBusinessProfileResponse["profile"]
>;

export type BusinessProfileFormValues =
  components["schemas"]["CreateOrUpdateBusinessProfileRequest"];

export function useGetBusinessProfile() {
  return useQueryOP("get", "/api/Admin/GetBusinessProfileForAdmin", {});
}

export function useCreateOrUpdateBusinessProfile() {
  const queryClient = useQueryClient();
  return useMutationOP("post", "/api/Admin/CreateOrUpdateBusinessProfile", {
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["get", "/api/Admin/GetBusinessProfileForAdmin"],
      });
      queryClient.invalidateQueries({
        queryKey: ["get", "/api/List/GetBusinessProfile"],
      });
    },
  });
}