"use client";

import { useEffect } from "react";
import { useQueryOP } from "@/lib/fetch";
import { useProfileStore } from "@/lib/store/profile-store";

export function DashProviders({ children }: { children: React.ReactNode }) {
  const setProfile = useProfileStore((state) => state.setProfile);
  const profileQuery = useQueryOP("get", "/api/User/GetMyProfile");

  useEffect(() => {
    const user = profileQuery.data?.user;
    if (user) {
      setProfile(user);
    }
  }, [profileQuery.data?.user, setProfile]);

  // Scope the neutral (zinc) override to the dashboard. Setting the attribute
  // on the root element so portals (dialog/sheet/popover/dropdown/toast)
  // rendered at document.body also inherit the override.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", "dashboard");
    return () => {
      root.removeAttribute("data-theme");
    };
  }, []);

  return <>{children}</>;
}
