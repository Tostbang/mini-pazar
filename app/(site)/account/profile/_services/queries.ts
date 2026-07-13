"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMutationOP, useQueryOP } from "@/lib/fetch";
import type { paths } from "@/lib/types/api";

type GetMyProfileResponse =
  paths["/api/User/GetMyProfile"]["get"]["responses"]["200"]["content"]["application/json"];

export type UserProfile = GetMyProfileResponse["user"];

/**
 * Kendi profil bilgilerimi getirir: ad, soyad, email, telefon, adres, rol,
 * email doğrulama durumu.
 */
export function useGetMyProfile() {
  return useQueryOP("get", "/api/User/GetMyProfile", {
    refetchOnMount: true,
  });
}

function useInvalidateProfile() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({
      queryKey: ["get", "/api/User/GetMyProfile"],
    });
  };
}

/**
 * Ad, soyad, email, telefon (ve adres) bilgilerimi günceller. Email başka
 * kullanıcıda varsa backend 400 döner.
 */
export function useUpdateProfile() {
  const invalidate = useInvalidateProfile();
  return useMutationOP("put", "/api/User/UpdateProfile", {
    onSuccess: invalidate,
  });
}
