"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleHelp, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useQueryOP } from "@/lib/fetch";
import type { paths } from "@/lib/types/api";
import { Section } from "@/components/section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SectionTitle from "./SectionTitle";

type PublicSupportResponse =
  paths["/api/Support/GetActiveSupport"]["get"]["responses"]["200"]["content"]["application/json"];

type SupportItem = NonNullable<PublicSupportResponse["items"]>[number];

type GroupedItems = {
  category: string;
  items: SupportItem[];
};

const UNCATEGORIZED = "Genel";

function useActiveSupports() {
  // Override the global `refetchOnMount: false` set in `lib/query-client.ts`.
  // The query also runs on the storefront, where we want fresh data on every
  // visit — including the first navigation after a non-technical shop owner
  // has added or edited an FAQ from the dashboard. Without this override the
  // cached empty response (from the first visit, before any FAQs existed)
  // stays in memory for the full 5-minute staleTime window.
  return useQueryOP("get", "/api/Support/GetActiveSupport", {
    refetchOnMount: true,
  });
}

/**
 * Vitrin tarafında görüntülenen SSS bölümü. Aktif kayıtları `displayOrder`
 * sırasıyla çeker; kategorisi olanları gruplayıp Accordion ile listeler.
 * Aktif kayıt yoksa bölüm hiç render edilmez.
 */
export function FaqSection() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data, isLoading } = useActiveSupports();

  const groups = useMemo(() => groupItems(data?.items ?? []), [data?.items]);

  if (!mounted || isLoading) {
    return <FaqSkeleton />;
  }

  if (groups.length === 0) {
    return null;
  }

  return (
    <Section className="py-10 sm:py-12">
      <div className="mb-6 flex flex-col gap-2">
        <SectionTitle>Sıkça Sorulan Sorular</SectionTitle>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Aklınıza takılanlar için en sık sorulan soruların yanıtlarını
          burada bulabilirsiniz. Başka bir sorunuz olursa bizimle iletişime
          geçmekten çekinmeyin.
        </p>
      </div>

      <div className="">
        {/* <CategoryNav groups={groups} /> */}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-8"
        >
          {groups.map((group) => (
            <CategoryGroup key={group.category} group={group} />
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

function CategoryNav({ groups }: { groups: GroupedItems[] }) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <CircleHelp className="size-4" />
          Kategoriler
        </h3>
        <ul className="flex flex-col gap-1">
          {groups.map((group) => (
            <li key={group.category}>
              <a
                href={`#faq-${slugify(group.category)}`}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              >
                <span className="font-medium">{group.category}</span>
                <span className="text-xs text-muted-foreground">
                  {group.items.length}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function CategoryGroup({ group }: { group: GroupedItems }) {
  return (
    <section
      id={`faq-${slugify(group.category)}`}
      className="flex flex-col gap-3 scroll-mt-24"
    >
      <h3 className="font-heading text-lg font-semibold text-foreground sm:text-xl">
        {group.category}
      </h3>
      <Accordion className="rounded-2xl border border-border bg-card">
        {group.items.map((item) => (
          <AccordionItem
            key={item.supportId}
            value={`item-${item.supportId}`}
            className="px-4"
          >
            <AccordionTrigger className="text-sm font-semibold text-foreground sm:text-base">
              {item.question ?? ""}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
              {renderAnswer(item.answer ?? "")}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

/**
 * Çok satırlı cevapları paragraflara böler; boş satırları paragraf sınırı
 * olarak kullanır, aksi halde tüm metin tek paragraf olarak gösterilir.
 */
function renderAnswer(answer: string) {
  const paragraphs = answer
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return null;
  if (paragraphs.length === 1) return <p>{paragraphs[0]}</p>;

  return paragraphs.map((paragraph, index) => (
    <p key={index}>{paragraph}</p>
  ));
}

function FaqSkeleton() {
  return (
    <Section className="py-10 sm:py-12">
      <div className="mb-6 flex flex-col gap-2">
        <div className="h-7 w-64 animate-pulse rounded-md bg-muted sm:h-8" />
        <div className="h-3 w-96 max-w-full animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="hidden h-48 animate-pulse rounded-2xl bg-muted lg:block" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-14 animate-pulse rounded-2xl bg-muted"
            />
          ))}
        </div>
      </div>
      <span className="sr-only">
        <Loader2 className="size-4 animate-spin" />
        Yükleniyor
      </span>
    </Section>
  );
}

function groupItems(items: SupportItem[]): GroupedItems[] {
  const buckets = new Map<string, SupportItem[]>();

  for (const item of items) {
    const category = (item.category ?? "").trim() || UNCATEGORIZED;
    const list = buckets.get(category) ?? [];
    list.push(item);
    buckets.set(category, list);
  }

  return Array.from(buckets.entries()).map(([category, list]) => ({
    category,
    items: list,
  }));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
