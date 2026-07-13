import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Compass,
  FolderTree,
  Package,
  ShoppingCart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Dashboard-scoped 404. Lives under app/dash so it inherits the sidebar +
// header layout. Other parts of the app fall through to /app/not-found.tsx.
type QuickLink = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const quickLinks: QuickLink[] = [
  {
    href: "/dash/products",
    label: "Ürünler",
    description: "Ürünlerini yönet",
    icon: Package,
  },
  {
    href: "/dash/categories",
    label: "Kategoriler",
    description: "Kategorileri düzenle",
    icon: FolderTree,
  },
  {
    href: "/dash/orders",
    label: "Siparişler",
    description: "Siparişleri takip et",
    icon: ShoppingCart,
  },
];

export default function DashNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-2xl flex-col items-center gap-10 text-center">
        {/* Visual hero — oversized 404 with a floating compass icon */}
        <div className="relative flex items-center justify-center">
          <span
            aria-hidden
            className="select-none font-heading text-[120px] font-bold leading-none text-brand/10 sm:text-[160px]"
          >
            404
          </span>
          <span className="absolute grid size-20 place-items-center rounded-full bg-background shadow-sm ring-1 ring-border">
            <Compass className="size-9 text-brand" />
          </span>
        </div>

        {/* Heading + body */}
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
            Sayfa bulunamadı
          </h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground sm:text-base">
            Aradığın sayfa mevcut değil ya da taşınmış olabilir. Aşağıdaki
            bölümlerden birine geçerek devam edebilirsin.
          </p>
        </div>

        {/* Primary CTA — back to dashboard root */}
        <Link
          href="/dash"
          className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-sm transition-colors hover:bg-brand/90"
        >
          <ArrowLeft className="size-4" />
          Dashboard&apos;a dön
        </Link>

        {/* Quick links — main dashboard sections the user is most likely to want */}
        <div className="w-full">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Hızlı erişim
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {quickLinks.map(
              ({ href, label, description, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-brand/30 hover:shadow-sm"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {label}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {description}
                    </p>
                  </div>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" />
                </Link>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
