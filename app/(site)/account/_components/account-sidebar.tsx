"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Heart,
  MapPin,
  Package,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: typeof User;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/account/profile",
    label: "Profil",
    description: "Kişisel bilgilerinizi yönetin",
    icon: User,
  },
  {
    href: "/account/orders",
    label: "Siparişlerim",
    description: "Geçmiş ve güncel siparişleriniz",
    icon: Package,
  },
  {
    href: "/account/favorites",
    label: "Favorilerim",
    description: "Beğendiğiniz ürünler",
    icon: Heart,
  },
  {
    href: "/account/address",
    label: "Adres",
    description: "Teslimat adres bilgileriniz",
    icon: MapPin,
  },
];

export function AccountSidebar() {
  const pathname = usePathname() ?? "";

  const isActive = (href: string) => {
    if (href === "/account/orders") {
      return pathname === href || pathname.startsWith(`${href}/`);
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      aria-label="Hesap menüsü"
      className="rounded-3xl bg-card p-4 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] sm:p-6"
    >
      <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Hesabım
      </p>
      <ul className="mt-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-start gap-3 rounded-2xl px-3 py-3 transition-colors",
                  active
                    ? "bg-brand text-brand-foreground"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl transition-colors",
                    active
                      ? "bg-lime text-lime-foreground"
                      : "bg-muted text-brand group-hover:bg-card",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block font-heading text-base font-semibold",
                      active ? "text-brand-foreground" : "text-brand",
                    )}
                  >
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block truncate text-xs",
                      active
                        ? "text-brand-foreground/80"
                        : "text-muted-foreground",
                    )}
                  >
                    {item.description}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}