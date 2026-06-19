"use client";

import { useMutationOP } from "@/lib/fetch";

export const useForgotPassword = () => {
  return useMutationOP("post", "/api/Auth/ForgotPassword");
};
