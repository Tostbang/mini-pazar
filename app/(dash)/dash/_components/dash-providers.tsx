"use client";

import { useEffect } from "react";
import { useQueryOP } from "@/lib/fetch";
import { useProfileStore } from "@/lib/store/profile-store";
import { BusinessProfileGate } from "@/app/(dash)/dash/business-profile/_components/business-profile-gate";

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

  // Warm up the background-removal model the first time the shop owner
  // enters the dashboard. The model is heavy (~80MB ONNX/WASM) and lives in
  // IndexedDB after first use. Dynamic import keeps it out of the marketing
  // bundle. No cleanup — the cache should persist across navigations.
  useEffect(() => {
    if (typeof window === "undefined") return;
    void import("@imgly/background-removal")
      .then(({ preload }) => preload())
      .catch((err) => {
        console.warn("[bg-removal] preload failed", err);
      });
  }, []);

  return <BusinessProfileGate>{children}</BusinessProfileGate>;
}
