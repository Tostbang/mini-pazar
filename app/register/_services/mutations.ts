"use client";

import { useMutationOP } from "@/lib/fetch";

export const useRegister = () => {
  return useMutationOP("post", "/api/Auth/Register");
};
