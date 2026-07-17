"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Türkçe karşılıkları yan menüdeki başlıklarla (app-sidebar.tsx) hizalı tut.
// Bilinmeyen segmentler olduğu gibi URL'de görünür — yeni bir dashboard rotası
// eklenirse buraya da Türkçe etiket eklenmeli.
const segmentLabels: Record<string, string> = {
  dash: "Panel",
  profile: "Profil",
  products: "Ürünler",
  store: "Mağaza",
  orders: "Siparişler",
  customers: "Müşteriler",
  categories: "Kategoriler",
  about: "Hakkımızda",
  sss: "SSS",
  "home-cards": "Anasayfa Kartları",
  "support-messages": "Destek Mesajları",
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = segmentLabels[segment] ?? segment;
    const isLast = index === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm">
      <ol className="flex items-center gap-1.5">
        {crumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="size-3.5 text-muted-foreground" />
            )}
            {crumb.isLast ? (
              <span
                className={cn(
                  "font-medium text-foreground",
                )}
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
