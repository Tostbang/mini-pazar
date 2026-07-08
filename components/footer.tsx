import Link from "next/link";
import { Mail, Phone, ShoppingBasket } from "lucide-react";
import { baseUrl } from "@/lib/fetch";
import { DEFAULT_PUBLIC_SETTINGS, PublicSiteSettings } from "@/lib/site-settings";
import { fetchPublicSettings } from "@/lib/site-settings-server";
// import {
//   DEFAULT_PUBLIC_SETTINGS,
//   fetchPublicSettings,
//   type PublicSiteSettings,
// } from "@/lib/site-settings";

type AboutResponse = {
  code?: string | null;
  message?: string | null;
  errors?: string[] | null;
  about?: { title?: string | null } | null;
};

async function fetchHasAbout(): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/api/List/GetAbout`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) return false;
    const data = (await response.json()) as AboutResponse;
    return Boolean(data?.about);
  } catch {
    return false;
  }
}

export function Footer({
  hasAbout,
  settings,
}: {
  hasAbout: boolean;
  settings: PublicSiteSettings;
}) {
  const name =
    settings.siteName?.trim() ||
    DEFAULT_PUBLIC_SETTINGS.siteName ||
    "Mağaza";
  const tagline = settings.siteTagline?.trim() ?? "";
  const footerText = settings.footerText?.trim() ?? "";
  const phone = settings.contactPhone?.trim() ?? "";
  const email = settings.contactEmail?.trim() ?? "";
  const logoUrl = settings.logoUrl?.trim() ?? "";

  // Yalnızca gerçek rotalara bağlı linkleri göster — geri kalan tüm
  // "Yakında" / placeholder bağlantılar kaldırıldı. "Hakkımızda" yalnızca
  // sunucu tarafında `/api/List/GetAbout` dolu döndüğünde görünür.
  const linkColumns: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: "Şirket",
      links: hasAbout ? [{ label: "Hakkımızda", href: "/about" }] : [],
    },
    {
      title: "Hesabım",
      links: [{ label: "Siparişlerim", href: "/account/orders" }],
    },
  ];

  const copyrightLine =
    footerText ||
    `© ${new Date().getFullYear()} ${name}. Tüm hakları saklıdır.`;

  return (
    <footer className="px-4 pb-10 pt-6 sm:px-6 bg-background pb-16  max-w-[1320px] mx-auto">
      <div className="rounded-[2rem] bg-brand px-6 py-12 text-brand-foreground sm:px-10">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2"
              aria-label={name}
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={name}
                  className="h-8 max-w-[160px] object-contain"
                />
              ) : (
                <>
                  <span className="grid size-8 place-items-center rounded-lg bg-lime text-lime-foreground">
                    <ShoppingBasket className="size-5" />
                  </span>
                  <span className="font-heading text-2xl font-semibold">
                    {name}
                  </span>
                </>
              )}
            </Link>
            {tagline ? (
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-foreground/70">
                {tagline}
              </p>
            ) : null}
            {phone || email ? (
              <ul className="mt-4 space-y-1.5 text-sm text-brand-foreground/70">
                {phone ? (
                  <li>
                    <a
                      href={`tel:${phone.replace(/\s+/g, "")}`}
                      className="inline-flex items-center gap-2 transition-colors hover:text-lime"
                    >
                      <Phone className="size-4" />
                      <span>{phone}</span>
                    </a>
                  </li>
                ) : null}
                {email ? (
                  <li>
                    <a
                      href={`mailto:${email}`}
                      className="inline-flex items-center gap-2 transition-colors hover:text-lime"
                    >
                      <Mail className="size-4" />
                      <span>{email}</span>
                    </a>
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>
          {linkColumns.map((col) => (
            <div key={col.title}>
              <h4 className="font-heading text-base font-semibold">
                {col.title}
              </h4>
              {col.links.length > 0 ? (
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-sm text-brand-foreground/70 transition-colors hover:text-lime"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-10 whitespace-pre-line border-t border-white/10 pt-6 text-sm text-brand-foreground/60">
          {copyrightLine}
        </div>
      </div>
    </footer>
  );
}

// Async server-component wrapper. Use from layouts or server pages so the
// `hasAbout` flag and public settings are computed on the server once per
// revalidate window. Both fetches are deduped by Next.js's fetch cache
// (same URL + revalidate) with the calls in `(site)/layout.tsx`.
export async function AsyncFooter() {
  const [hasAbout, settings] = await Promise.all([
    fetchHasAbout(),
    fetchPublicSettings(),
  ]);
  return <Footer hasAbout={hasAbout} settings={settings} />;
}
