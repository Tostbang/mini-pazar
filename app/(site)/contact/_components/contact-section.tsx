"use client";

import { Clock, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { ContactForm } from "./contact-form";
import { DEFAULT_PUBLIC_SETTINGS, type PublicSiteSettings } from "@/lib/site-settings";

/**
 * İletişim sayfasının istemci bölümü. Sunucudan gelen `settings` prop'unu
 * kullanarak şirket bilgilerini ve formu tek seferde renderlar. Formun
 * kendisi `ContactForm` adlı alt bileşende izole edilmiştir.
 */
export function ContactSection({ settings }: { settings?: PublicSiteSettings }) {
  const s = settings ?? DEFAULT_PUBLIC_SETTINGS;
  const phone = (s.contactPhone ?? "").trim();
  const email = (s.contactEmail ?? "").trim();
  const address = (s.address ?? "").trim();
  const shopName = (s.siteName ?? "").trim() || "Mağazamız";
  const description = (s.siteTagline ?? "").trim();
  const businessType = (s.businessType ?? "").trim();

  const hasAnyInfo = Boolean(phone || email || address || description);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      <CompanyInfo
        shopName={shopName}
        businessType={businessType}
        description={description}
        phone={phone}
        email={email}
        address={address}
        hasAnyInfo={hasAnyInfo}
      />
      <ContactForm />
    </div>
  );
}

function CompanyInfo({
  shopName,
  businessType,
  description,
  phone,
  email,
  address,
  hasAnyInfo,
}: {
  shopName: string;
  businessType: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  hasAnyInfo: boolean;
}) {
  return (
    <aside className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {shopName}
        </h2>
        {businessType ? (
          <p className="mt-1 text-sm font-medium text-primary">{businessType}</p>
        ) : null}
      </div>

      {description ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}

      {hasAnyInfo ? (
        <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-background">
          {phone ? (
            <InfoRow
              icon={Phone}
              label="Telefon"
              value={phone}
              href={`tel:${phone.replace(/\s+/g, "")}`}
            />
          ) : null}
          {email ? (
            <InfoRow
              icon={Mail}
              label="E-posta"
              value={email}
              href={`mailto:${email}`}
            />
          ) : null}
          {address ? (
            <InfoRow icon={MapPin} label="Adres" value={address} multiline />
          ) : null}
          <InfoRow
            icon={Clock}
            label="Çalışma Saatleri"
            value="Hafta içi 09:00 - 19:00 · Cumartesi 10:00 - 17:00"
          />
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-background/60 px-4 py-5 text-sm text-muted-foreground">
          Mağaza henüz iletişim bilgisi eklemedi. Aşağıdaki formdan bize
          ulaşabilirsiniz.
        </div>
      )}
    </aside>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
  multiline,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
  multiline?: boolean;
}) {
  const content = (
    <div className="flex items-start gap-3 px-4 py-3.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-primary">
        <Icon className="size-4" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span
          className={
            multiline
              ? "whitespace-pre-line text-sm font-medium text-foreground"
              : "truncate text-sm font-medium text-foreground"
          }
        >
          {value}
        </span>
      </div>
    </div>
  );

  if (href) {
    return (
      <li>
        <a
          href={href}
          className="block transition-colors hover:bg-muted/60"
        >
          {content}
        </a>
      </li>
    );
  }
  return <li>{content}</li>;
}

export function ContactSectionEmpty() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <MessageSquare className="size-6" />
      </span>
      <p className="text-sm font-semibold text-foreground">
        İletişim bilgisi henüz eklenmemiş
      </p>
      <p className="max-w-sm text-xs text-muted-foreground">
        Mağaza yöneticisi bu sayfa için henüz içerik paylaşmadı. Aşağıdaki
        formdan bize yazabilirsiniz.
      </p>
    </div>
  );
}