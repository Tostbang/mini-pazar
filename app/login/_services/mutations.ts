"use client";

import { useMutationOP } from "@/lib/fetch";
import { setToken } from "@/lib/helpers";
import { Role } from "@/lib/types";
import { toast } from "sonner";

export const useLogin = () => {
  return useMutationOP("post", "/api/Auth/Login", {
    onSuccess: (data) => {
      if (data.token) {
        setToken(data.token);
        toast.success("Giriş başarılı!");
      }
      const role = data.roleId == null ? null : Number(data.roleId);
      if (role === Role.Admin) {
        window.location.href = "/dash";
      } else {
        window.location.href = "/";
      }
    },
  });
};
