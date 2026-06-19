"use client";

import { useMutationOP } from "@/lib/fetch";

export const useVerifyEmail = () => {
  return useMutationOP("post", "/api/Auth/VerifyEmail");
};

export const useResendVerificationCode = () => {
  return useMutationOP("post", "/api/Auth/ResendVerificationCode");
};
