"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronRight,
  Info,
  Mail,
  Menu,
  ShoppingBasket,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useGetCategories } from "@/app/(site)/category/_services/queries";
import { useSiteSettingsStore } from "@/lib/store/site-settings-store";

// header.tsx ile aynı fallback — store henüz populate olmamışken UI
// boş kalmasın diye.
const FALLBACK_SITE_NAME = "Mini Pazar";

/**
 * Sol üst köşedeki hamburger butonu + onu açan drawer.
 *
 * Buton `header.tsx` içinde `<Menu />` ikonu ile duruyordu ama
 * `onClick` handler'ı yoktu — tıklamak hiçbir şey yapmıyordu. Bu
 * bileşen o butonu Sheet trigger'ı olarak sarıp kategorileri ve
 * statik sayfa linklerini soldan açılan bir drawer'da gösterir.
 *
 * İçerik:
 *   - Kategoriler: `/api/List/GetAllCategory` endpoint'inden canlı.
 *   - Hakkımızda: `/about` (footer ile aynı koşul — yalnızca mağaza
 *     "Hakkımızda" içeriği yayınlamışsa görünür).
 *   - İletişim: `/contact`.
 *
 * Hesap/Çıkış gibi kullanıcı aksiyonları header'daki user dropdown'unda
 * zaten mevcut; burada tekrar edilmez.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const categoriesQuery = useGetCategories();

  // Logo + site adı store'dan gelir; header.tsx ile birebir aynı
  // kaynaktan okuyoruz ki drawer'daki marka kimliği sayfanın geri
  // kalanıyla tutarlı kalsın. `useSiteSettingsStore` zaten tek
  // subscriber (SiteSettingsProvider) tarafından besleniyor — biz
  // burada ek request atmıyoruz.
  const settings = useSiteSettingsStore((state) => state.settings);
  const siteName = settings?.siteName?.trim() || FALLBACK_SITE_NAME;
  const logoUrl = settings?.logoUrl?.trim() || "";

  // Sorgu sessionStorage'dan hydrate olabildiği için server'da isLoading
  // true dönerken client'ta false dönebilir — bu da SSR/CSR mismatch'e
  // yol açar. Mount sonrasına kadar skeleton bırakıp sonra gerçek
  // listeyi basıyoruz (CategoryPills ile aynı pattern).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const categories = (categoriesQuery.data?.categories ?? []).filter(
    (category): category is NonNullable<typeof category> => Boolean(category),
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        // Orijinal header.tsx'teki butonun görseli ve aria-label'ı
        // birebir korundu — sadece trigger olarak sarıldı.
        aria-label="Menüyü aç"
        className="grid size-9 shrink-0 place-items-center rounded-full transition-colors hover:bg-white/10"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        // Sheet primitive left side için default `border-r` ekliyor;
        // drawer viewport kenarına sıfır oturması için eziyoruz.
        className="flex flex-col gap-0 border-r-0 p-0"
        // Header'ın brand arka planı üstünde, drawer beyaz kart
        // olarak açılsın ki kategoriler okunabilir kalsın.
      >
        <SheetHeader className="gap-3 border-b border-border bg-brand px-5 py-5 text-brand-foreground sm:px-6">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2"
          >
            {logoUrl ? (
              // Plain <img> because logo URLs come from the dashboard's
              // upload pipeline and we cannot guarantee a Next/Image
              // loader is configured for the absolute origin. Aynı
              // gerekçe header.tsx'te de var.
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
                <SheetTitle className="font-intro text-2xl font-semibold tracking-tight text-brand-foreground">
                  {siteName}
                </SheetTitle>
              </>
            )}
          </Link>
          <SheetDescription className="text-sm text-brand-foreground/70">
            Kategorilere göz atın veya sayfaları keşfedin.
          </SheetDescription>
        </SheetHeader>

        <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
          <SectionLabel>Kategoriler</SectionLabel>
          {!mounted || categoriesQuery.isLoading ? (
            <CategoryListSkeleton />
          ) : categories.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              Henüz kategori eklenmemiş.
            </p>
          ) : (
            <ul className="mt-1 flex flex-col">
              {categories.map((category) => {
                const name = category.categoryName?.trim() || "Kategori";
                return (
                  <li key={category.categoryId}>
                    <Link
                      href={`/category/${category.categoryId}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <span className="truncate">{name}</span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <SectionLabel className="mt-6">Sayfalar</SectionLabel>
          <ul className="mt-1 flex flex-col">
            <li>
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Mail className="size-4 shrink-0 text-muted-foreground" />
                <span>İletişim</span>
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Info className="size-4 shrink-0 text-muted-foreground" />
                <span>Hakkımızda</span>
              </Link>
            </li>
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground ${className ?? ""}`}
    >
      {children}
    </p>
  );
}

function CategoryListSkeleton() {
  return (
    <ul className="mt-1 flex flex-col gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <li
          key={index}
          className="h-9 w-full animate-pulse rounded-xl bg-muted/60"
        />
      ))}
    </ul>
  );
}
