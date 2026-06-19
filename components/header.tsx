"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogIn,
  LogOut,
  Menu,
  Search,
  Settings,
  ShoppingBag,
  ShoppingBasket,
  ChevronDown,
  Mail,
  CheckCircle2,
  CircleAlert,
  User as UserIcon,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useGetMyCart } from "@/lib/cart";
import { useQueryOP, useMutationOP } from "@/lib/fetch";
import { deleteToken } from "@/lib/helpers";
import { useHasToken } from "@/hooks/use-has-token";
import { Role, RoleLabels } from "@/lib/types";
import { toast } from "sonner";

export function Header() {
  const cartQuery = useGetMyCart();
  const totalItems = cartQuery.data?.cart.totalItems ?? 0;
  return (
    <header className="sticky top-0 z-50 px-3 pt-3   sm:px-6 sm:pt-4">
      <div className=" flex items-center gap-3  rounded-1.5xl bg-brand px-4 py-3 text-brand-foreground shadow-lg sm:gap-5 sm:px-6 sm:py-5">
        <button
          aria-label="Menüyü aç"
          className="grid size-9 shrink-0 place-items-center rounded-full transition-colors hover:bg-white/10"
        >
          <Menu className="size-5" />
        </button>

        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-lime text-lime-foreground">
            <ShoppingBasket className="size-5" />
          </span>
          <span className="font-intro text-2xl font-semibold tracking-tight ">
            Mini-Pazar
          </span>
        </Link>

        <div className="relative ml-1 hidden flex-1 items-center md:flex max-w-[440px]">
          <input
            type="text"
            placeholder="Market, mağaza, sebze veya et arayın"
            className="h-11 w-full rounded-full bg-card pl-11 pr-5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-lime"
          />
          <Search className="absolute right-4 size-4 text-muted-foreground" />
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
            <span>Şimdi sipariş ver, 15 dk içinde kapında!</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <ThemeToggle />
          <Link
            href="/cart"
            aria-label="Sepet"
            className="relative grid size-10 place-items-center rounded-full bg-card text-foreground"
          >
            <div className="relative">
              <ShoppingBasket className="size-5" />
              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-black text-[11px] font-bold text-white">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </div>
          </Link>
          <UserMenu />
        </div>
      </div>

      <div className="mx-auto mt-3 flex max-w-[1320px] items-center md:hidden">
        <div className="relative flex w-full items-center">
          <input
            type="text"
            placeholder="Market, mağaza, sebze veya et arayın"
            className="h-11 w-full rounded-full bg-card pl-5 pr-12 text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-lime"
          />
          <button
            aria-label="Ara"
            className="absolute right-1.5 grid size-8 place-items-center rounded-full text-muted-foreground"
          >
            <Search className="size-4" />
          </button>
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
              href="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              <UserIcon className="size-4" />
              Profilim
            </Link>
            <Link
              href="/orders"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              <ShoppingBag className="size-4" />
              Siparişlerim
            </Link>
            <Link
              href="/settings"
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

          <div className="flex items-center justify-end gap-1 border-t border-border bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground">
            <ChevronDown className="size-3 -rotate-90" />
            Mini-Pazar hesabı
          </div>
        </div>
      )}
    </div>
  );
}
