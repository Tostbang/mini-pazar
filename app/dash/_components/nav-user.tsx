"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  ChevronDown,
  Mail,
  CheckCircle2,
  CircleAlert,
  ShieldCheck,
} from "lucide-react";
import { useProfileStore } from "@/lib/store/profile-store";
import { useMutationOP } from "@/lib/fetch";
import { deleteToken } from "@/lib/helpers";
import { Role, RoleLabels } from "@/lib/types";
import { toast } from "sonner";

export function NavUser() {
  const profile = useProfileStore((state) => state.profile);
  const setProfile = useProfileStore((state) => state.setProfile);
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const logoutMutation = useMutationOP("post", "/api/Auth/Logout");

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && !target.closest("[data-nav-user]")) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync({});
    } catch {
      // Global onError in providers shows a toast for non-401 errors.
      // We still continue with local logout so the user is not stuck.
    }
    deleteToken();
    setProfile(null);
    toast.success("Çıkış yapıldı.");
    router.replace("/login");
  };

  const initials =
    [profile?.firstName, profile?.lastName]
      .filter(Boolean)
      .map((p) => p!.charAt(0).toUpperCase())
      .join("") || "MP";

  const isAdmin = profile?.roleId === Role.Admin;
  const roleLabel = isAdmin ? RoleLabels[Role.Admin] : RoleLabels[Role.User];

  return (
    <div className="relative" data-nav-user>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1.5 pr-3 text-sm transition-colors hover:bg-muted"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initials}
        </span>
        <div className="hidden flex-col items-start leading-tight sm:flex">
          <span className="font-medium">
            {profile?.firstName ?? "Kullanıcı"}{" "}
            {profile?.lastName ?? ""}
          </span>
          <span className="text-xs text-muted-foreground">
            {profile?.email ?? ""}
          </span>
        </div>
        <ChevronDown className="size-4 text-muted-foreground" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
        >
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {profile?.firstName ?? "Kullanıcı"}{" "}
                  {profile?.lastName ?? ""}
                </p>
                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <Mail className="size-3" />
                  <span className="truncate">{profile?.email ?? "-"}</span>
                </p>
              </div>
            </div>
            {profile && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                  <ShieldCheck className="size-3" />
                  {roleLabel}
                </span>
                {profile.emailConfirmed ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                    <CheckCircle2 className="size-3" />
                    E-posta doğrulandı
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    <CircleAlert className="size-3" />
                    E-posta doğrulanmadı
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="p-1">
            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
            >
              <LogOut className="size-4" />
              {logoutMutation.isPending ? "Çıkış yapılıyor..." : "Çıkış Yap"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
