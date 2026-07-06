"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMutationOP, useQueryOP } from "@/lib/fetch";
import type { components, paths } from "@/lib/types/api";

type GetSiteSettingsResponse =
  paths["/api/SiteSettings/GetSettings"]["get"]["responses"]["200"]["content"]["application/json"];

export type SiteSettings = GetSiteSettingsResponse["settings"];

export type SiteSettingsFormValues =
  components["schemas"]["UpdateSiteSettingsRequest"];

export function useGetSiteSettings() {
  return useQueryOP("get", "/api/SiteSettings/GetSettings", {});
}

export function useGetPublicSiteSettings() {
  return useQueryOP("get", "/api/SiteSettings/GetPublicSettings", {
  });
}

export function useUpdateSiteSettings() {
  const queryClient = useQueryClient();
  return useMutationOP("put", "/api/SiteSettings/UpdateSettings", {
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["get", "/api/SiteSettings/GetSettings"],
      });
      queryClient.invalidateQueries({
        queryKey: ["get", "/api/SiteSettings/GetPublicSettings"],
      });
    },
  });
}
