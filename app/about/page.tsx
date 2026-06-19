import { MDXRemote } from "next-mdx-remote/rsc";
import Image from "next/image";
import { BookOpen, Sparkles } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { mdxComponents } from "@/lib/mdx-components";

export const dynamic = "force-dynamic";

const API_BASE_URL =
  "https://marketapi20260604105905-ajfqchdfakgbhggm.canadacentral-01.azurewebsites.net";

type AboutListResponse = {
  code?: string | null;
  message?: string | null;
  errors?: string[] | null;
  abouts?: AboutItem[] | null;
};

type AboutItem = {
  aboutId: number;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
};

async function fetchAbouts(): Promise<AboutItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/List/GetAllAbout`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) return [];
    const data = (await response.json()) as AboutListResponse;
    return Array.isArray(data?.abouts) ? data.abouts : [];
  } catch {
    return [];
  }
}

export default async function PublicAboutPage() {
  const abouts = await fetchAbouts();

  return (
    <main className="min-h-screen bg-background pb-16">
      <Header />
      <div className="mx-auto mt-6 max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <header className="rounded-3xl bg-foreground px-6 py-10 text-background shadow-lg sm:px-10 sm:py-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-background/80">
            <Sparkles className="size-3.5" />
            Mini Pazar
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
            Hakkımızda
          </h1>
          <p className="mt-3 max-w-2xl text-base text-background/80 sm:text-lg">
            Marketimizin hikâyesini, değerlerimizi ve nasıl çalıştığımızı
            anlattığımız bölüm. Her içerik mağaza yöneticisi tarafından
            güncellenir.
          </p>
        </header>

        {abouts.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
              <BookOpen className="size-6" />
            </span>
            <p className="text-sm font-semibold text-foreground">
              Henüz içerik eklenmemiş
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Mağaza yöneticisi henüz bu sayfa için içerik paylaşmadı. Daha
              sonra tekrar kontrol edebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="mt-10 space-y-12">
            {abouts.map((about) => (
              <AboutSection key={about.aboutId} about={about} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}

function AboutSection({ about }: { about: AboutItem }) {
  const title = about.title?.trim() || "";
  const description = about.description?.trim() ?? "";
  const imageUrl = about.imageUrl?.trim() || null;

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      {imageUrl ? (
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={title || "Hakkımızda görseli"}
            fill
            sizes="(min-width: 1024px) 1200px, 100vw"
            unoptimized
            className="object-cover"
            priority={false}
          />
        </div>
      ) : null}

      <div className="px-6 py-8 sm:px-10 sm:py-12">
        {title ? (
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
        ) : null}

        <div className="mt-6">
          {description ? (
            <MDXRemote source={description} components={mdxComponents} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Bu bölüm için henüz açıklama eklenmemiş.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
