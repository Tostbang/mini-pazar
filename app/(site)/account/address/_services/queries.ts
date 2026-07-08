"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMutationOP, useQueryOP } from "@/lib/fetch";
import type { paths } from "@/lib/types/api";

type GetMyAddressResponse =
  paths["/api/User/GetMyAddress"]["get"]["responses"]["200"]["content"]["application/json"];

type UserAddressModel =
  NonNullable<GetMyAddressResponse["address"]>;

export type AccountAddress = UserAddressModel;

/**
 * Hesabıma kayıtlı adres bilgilerini getirir. Profil/şifre bilgisi dönmez.
 */
export function useGetMyAddress() {
  return useQueryOP("get", "/api/User/GetMyAddress", {
    refetchOnMount: true,
  });
}

function useInvalidateAddress() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({
      queryKey: ["get", "/api/User/GetMyAddress"],
    });
  };
}

/**
 * Adres bilgilerini günceller. Address girildiyse City ve Country zorunludur.
 */
export function useUpdateMyAddress() {
  const invalidate = useInvalidateAddress();
  return useMutationOP("put", "/api/User/UpdateMyAddress", {
    onSuccess: invalidate,
  });
}