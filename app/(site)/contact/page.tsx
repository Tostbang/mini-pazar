import { fetchPublicSettings } from "@/lib/site-settings-server";
import { ContactSection } from "./_components/contact-section";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await fetchPublicSettings();

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="mx-auto mt-6 max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <header className="rounded-3xl bg-brand px-6 py-10 text-background shadow-lg sm:px-10 sm:py-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-background/80">
            Mini Pazar
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
            İletişim
          </h1>
          <p className="mt-3 max-w-2xl text-base text-background/80 sm:text-lg">
            Sorularınız, önerileriniz veya şikayetleriniz için bize ulaşın.
            Mesajlarınız doğrudan ekibimize iletilir.
          </p>
        </header>

        <div className="mt-10">
          <ContactSection settings={settings} />
        </div>
      </div>
    </main>
  );
}
