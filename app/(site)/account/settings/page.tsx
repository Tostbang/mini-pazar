import Link from "next/link";
import { ArrowLeft, Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="rounded-3xl bg-card p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] sm:p-8">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand"
      >
        <ArrowLeft className="size-4" />
        Siparişlerime dön
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-muted text-brand">
          <SettingsIcon className="size-6" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-semibold text-brand sm:text-3xl">
            Ayarlar
          </h1>
          <p className="text-sm text-muted-foreground">
            Hesap ve bildirim tercihlerinizi yönetin.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center">
        <p className="font-heading text-lg font-semibold text-brand">
          Ayarlar yakında
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Bu sayfa üzerinde çalışılıyor. Şimdilik siparişlerinizi
          inceleyebilirsiniz.
        </p>
      </div>
    </div>
  );
}