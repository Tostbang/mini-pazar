"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMutationOP } from "@/lib/fetch";
import { setToken } from "@/lib/helpers";
import { clearPersistedCache } from "@/lib/query-persist";
import { useProfileStore } from "@/lib/store/profile-store";
import { Role } from "@/lib/types";
import { toast } from "sonner";

export const useLogin = () => {
  const queryClient = useQueryClient();
  const setProfile = useProfileStore((state) => state.setProfile);
  return useMutationOP("post", "/api/Auth/Login", {
    onSuccess: (data) => {
      if (data.token) {
        // Defensive: a previous user may have left stale data in memory or
        // sessionStorage (e.g. the previous logout failed, or the user opened
        // a fresh tab on a borrowed device). Wipe it before the new identity
        // is established so the new account cannot see the old one.
        queryClient.clear();
        clearPersistedCache();
        setProfile(null);
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
