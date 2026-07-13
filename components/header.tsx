"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  LogIn,
  LogOut,
  Menu,
  Settings,
  ShoppingBag,
  ShoppingBasket,
  Heart,
  LayoutDashboard,
  Mail,
  CheckCircle2,
  CircleAlert,
  User as UserIcon,
  ShoppingCart,
} from "lucide-react";
import { HeaderSearch } from "@/components/header-search";
import { useGetMyCart } from "@/lib/cart";
import { useQueryOP, useMutationOP } from "@/lib/fetch";
import { deleteToken } from "@/lib/helpers";
import { clearPersistedCache } from "@/lib/query-persist";
import { useProfileStore } from "@/lib/store/profile-store";
import { useSiteSettingsStore } from "@/lib/store/site-settings-store";
import { useHasToken } from "@/hooks/use-has-token";
import { Role, RoleLabels } from "@/lib/types";
import { toast } from "sonner";

const FALLBACK_TAGLINE = "Şimdi sipariş ver, 15 dk içinde kapında!";
const FALLBACK_SITE_NAME = "Mini Pazar";

export function Header() {
  const cartQuery = useGetMyCart();
  const profileQuery = useQueryOP("get", "/api/User/GetMyProfile");
  const totalItems = cartQuery.data?.cart.totalItems ?? 0;
  const isAdmin = profileQuery.data?.user?.roleId === Role.Admin;

  // The cart query can hydrate from sessionStorage before the first React
  // render completes (see lib/query-persist.ts). If we render the badge
  // from that pre-hydration value, the server-rendered HTML (no badge)
  // will mismatch the client tree (badge present) and React will throw a
  // hydration error. Defer the badge until after mount so the first paint
  // matches what SSR produced; subsequent updates flow normally.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Site settings live in the store, populated by SiteSettingsProvider.
  // We never hit `useGetPublicSiteSettings` here directly because every
  // storefront surface would otherwise re-subscribe — the provider is
  // the single subscriber.
  const settings = useSiteSettingsStore((state) => state.settings);
  const siteName = settings?.siteName?.trim() || FALLBACK_SITE_NAME;
  const logoUrl = settings?.logoUrl?.trim() || "";
  const tagline = settings?.siteTagline?.trim() || FALLBACK_TAGLINE;

  return (
    <header className="sticky top-0 z-50 px-3 pt-3   sm:px-6 sm:pt-4 max-w-[1320px] mx-auto">
      <div className=" flex flex-wrap items-center gap-3  rounded-1.5xl bg-brand px-4 py-3 text-brand-foreground shadow-lg sm:gap-5 sm:px-6 sm:py-5">
        <button
          aria-label="Menüyü aç"
          className="grid size-9 shrink-0 place-items-center rounded-full transition-colors hover:bg-white/10"
        >
          <Menu className="size-5" />
        </button>

        <Link href="/" className="flex shrink-0 items-center gap-2">
          {logoUrl ? (
            // Plain <img> because logo URLs come from the dashboard's
            // upload pipeline and we cannot guarantee a Next/Image loader
            // is configured for the absolute origin.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={siteName}
              className="h-8 max-w-[180px] object-contain"
            />
          ) : (
            <>
              <span className="grid size-8 place-items-center rounded-lg bg-lime text-lime-foreground">
                <ShoppingBasket className="size-5" />
              </span>
              <span className="font-intro text-2xl font-semibold tracking-tight ">
                {siteName}
              </span>
            </>
          )}
        </Link>

        {/* Tek bir HeaderSearch örneği. Mobilde `w-full` flex-wrap ile
            kendi satırına sarar; md+ üzerinde `flex-1 max-w-[440px]` ile
            satır içi orta alanı doldurur. Önceki çift-kopyalı düzende iki
            ayrı örnek aynı anda DOM'a giriyor, kontrol listesinde çift
            buton olarak görünüyordu. */}
        <div className="flex w-full  md:w-auto md:flex-1 md:max-w-[440px]">
          <HeaderSearch className="w-full" />
        </div>

        <div className="ml-auto hidden items-center gap-5 text-sm lg:flex">
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid size-8 place-items-center rounded-full bg-lime/20 text-lime">
              <svg
                viewBox="0 0 24 24"
                className="size-4 fill-lime"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </span>
            <span>{tagline}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          {/* <ThemeToggle /> */}
          {/*
            Admin-only shortcut to the dashboard. The button is hidden on
            first paint and only appears after the profile query resolves
            (client-side only), so SSR markup never disagrees with the
            client tree — no hydration mismatch. TanStack Query
            deduplicates the request with the same call inside the user
            dropdown, so this adds zero extra network cost.
          */}
          {isAdmin && (
            <Link
              href="/dash"
              aria-label="Mağaza paneli"
              className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              <LayoutDashboard className="size-4" />
              Kontrol Paneli
            </Link>
          )}
          <Link
            href="/cart"
            aria-label="Sepet"
            className="relative grid size-10 place-items-center rounded-full bg-card text-foreground"
          >
            <div className="relative">
              <ShoppingCart className="size-5" />
              {mounted && totalItems > 0 && (
                <span className="absolute -right-3 -top-3 flex size-5 items-center justify-center rounded-full bg-black text-[11px] font-bold text-white">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </div>
          </Link>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

function UserMenu() {
  const hasToken = useHasToken();

  if (!hasToken) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
      >
        <LogIn className="size-4" />
        Giriş Yap
      </Link>
    );
  }

  return <UserMenuDropdown />;
}

function UserMenuDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();
  const setProfile = useProfileStore((state) => state.setProfile);

  const profileQuery = useQueryOP("get", "/api/User/GetMyProfile");
  const logoutMutation = useMutationOP("post", "/api/Auth/Logout");

  const user = profileQuery.data?.user;
  const firstName = user?.firstName ?? "";
  const lastName = user?.lastName ?? "";
  const fullName = `${firstName} ${lastName}`.trim() || "Üye";
  const initials =
    [firstName, lastName]
      .filter(Boolean)
      .map((p) => p!.charAt(0).toUpperCase())
      .join("") || "Ü";

  const isAdmin = user?.roleId === Role.Admin;
  const roleLabel = isAdmin ? RoleLabels[Role.Admin] : RoleLabels[Role.User];

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && !target.closest("[data-user-menu]")) {
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
    // Wipe every user-specific piece of state so the next account that logs
    // in on this tab cannot see this user's profile, cart, or query results.
    queryClient.clear();
    clearPersistedCache();
    setProfile(null);
    deleteToken();
    setOpen(false);
    toast.success("Çıkış yapıldı.");
    router.replace("/");
  };

  return (
    <div className="relative" data-user-menu ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-full ring-2 ring-lime transition hover:ring-lime/70"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Hesap menüsünü aç"
      >
        <span className="grid size-10 place-items-center overflow-hidden rounded-full bg-card text-sm font-semibold text-foreground">
          {initials}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-lg"
        >
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{fullName}</p>
                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <Mail className="size-3" />
                  <span className="truncate">{user?.email ?? "-"}</span>
                </p>
              </div>
            </div>
            {user && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                  {isAdmin ? (
                    <CheckCircle2 className="size-3" />
                  ) : (
                    <UserIcon className="size-3" />
                  )}
                  {roleLabel}
                </span>
                {user.emailConfirmed ? (
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
            <Link
              href="/account/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              <UserIcon className="size-4" />
              Profilim
            </Link>
            <Link
              href="/account/orders"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              <ShoppingBag className="size-4" />
              Siparişlerim
            </Link>
            <Link
              href="/account/favorites"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              <Heart className="size-4" />
              Favorilerim
            </Link>
            <Link
              href="/account/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              <Settings className="size-4" />
              Ayarlar
            </Link>
            <div className="my-1 h-px bg-border" />
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
            >
              {logoutMutation.isPending ? (
                <span className="size-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
              ) : (
                <LogOut className="size-4" />
              )}
              {logoutMutation.isPending ? "Çıkış yapılıyor..." : "Çıkış Yap"}
            </button>
          </div>

          {/* <div className="flex items-center justify-end gap-1 border-t border-border bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground"> */}
          {/*   <ChevronDown className="size-3 -rotate-90" /> */}
          {/*   Mini-Pazar hesabı */}
          {/* </div> */}
        </div>
      )}
    </div>
  );
}
