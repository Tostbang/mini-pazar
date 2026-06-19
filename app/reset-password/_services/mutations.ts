"use client";

import { useMutationOP } from "@/lib/fetch";

export const useResetPassword = () => {
  return useMutationOP("post", "/api/Auth/ResetPassword");
};
