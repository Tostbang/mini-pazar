"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Search, Sparkles, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  emojiTranslations,
  normalizeText,
} from "@/lib/emoji-translations";
import type {
  EmojiListResponse,
  EnrichedEmoji,
} from "@/app/api/emojis/route";
import { Section } from "@/components/section";

const TÜMÜ = "Tümü" as const;
type Category = string;
type DisplayCategory = typeof TÜMÜ | Category;

const DISPLAYED_CATEGORIES: { slug: string; label: string }[] = [
  { slug: "food-fruit", label: emojiTranslations.categories["food-fruit"] },
  { slug: "food-vegetable", label: emojiTranslations.categories["food-vegetable"] },
  { slug: "food-prepared", label: emojiTranslations.categories["food-prepared"] },
  { slug: "food-marine", label: emojiTranslations.categories["food-marine"] },
  { slug: "food-sweet", label: emojiTranslations.categories["food-sweet"] },
  { slug: "food-asian", label: emojiTranslations.categories["food-asian"] },
  { slug: "drink", label: emojiTranslations.categories["drink"] },
  { slug: "dishware", label: emojiTranslations.categories["dishware"] },
  { slug: "fresh", label: emojiTranslations.categories["fresh"] },
  { slug: "shopping", label: emojiTranslations.categories["shopping"] },
  { slug: "money", label: emojiTranslations.categories["money"] },
  { slug: "delivery", label: emojiTranslations.categories["delivery"] },
  { slug: "animal-mammal", label: emojiTranslations.categories["animal-mammal"] },
];

function scoreEmoji(emoji: EnrichedEmoji, normalizedQuery: string) {
  if (!normalizedQuery) return 0;
  const tr = normalizeText(emoji.turkishName);
  const en = normalizeText(emoji.englishName);
  const terms = emoji.terms.map(normalizeText);

  let score = 0;
  if (tr === normalizedQuery) score += 120;
  if (en === normalizedQuery) score += 110;
  if (tr.startsWith(normalizedQuery)) score += 60;
  if (en.startsWith(normalizedQuery)) score += 50;
  if (tr.includes(normalizedQuery)) score += 40;
  if (en.includes(normalizedQuery)) score += 30;
  for (const term of terms) {
    if (term === normalizedQuery) score += 100;
    if (term.startsWith(normalizedQuery)) score += 50;
    if (term.includes(normalizedQuery)) score += 30;
  }
  return score;
}

function matchesCategory(emoji: EnrichedEmoji, category: Category): boolean {
  return emoji.subGroup === category || emoji.group === category;
}

function getResults(
  emojis: EnrichedEmoji[],
  query: string,
  category: DisplayCategory,
): EnrichedEmoji[] {
  const filtered = emojis.filter(
    (emoji) => category === TÜMÜ || matchesCategory(emoji, category),
  );
  const normalized = normalizeText(query.trim());
  if (!normalized) {
    return filtered;
  }
  return filtered
    .map((emoji) => ({ emoji, score: scoreEmoji(emoji, normalized) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .map(({ emoji }) => emoji);
}

function groupBySubgroup(items: EnrichedEmoji[]) {
  const groups = new Map<string, EnrichedEmoji[]>();
  for (const item of items) {
    const key = item.subGroupLabel;
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }
  return Array.from(groups.entries());
}

export function EmojiFinder() {
  const [text, setText] = useState("");
  const [activeCategory, setActiveCategory] = useState<DisplayCategory>(TÜMÜ);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  const emojisQuery = useQuery<EmojiListResponse>({
    queryKey: ["emojis", "all"],
    queryFn: async () => {
      const response = await fetch("/api/emojis");
      if (!response.ok) {
        throw new Error("Emoji listesi alınamadı.");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  const allEmojis = emojisQuery.data?.emojis ?? [];

  const results = useMemo(
    () => getResults(allEmojis, text, activeCategory),
    [allEmojis, text, activeCategory],
  );

  useEffect(() => {
    setSelectedEmoji(null);
  }, [text, activeCategory]);

  const selectedOption =
    results.find((emoji) => emoji.character === selectedEmoji) ?? results[0] ??
    null;

  const isSearching = text.trim().length > 0;
  const showAll = !isSearching && activeCategory === TÜMÜ;
  const grouped = showAll ? groupBySubgroup(results) : [];

  return (
    <Section className="pt-4">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="font-heading text-lg font-semibold text-foreground sm:text-xl">
              İstediğin ürünü yaz, uygun emojiyi seç
            </p>
            <p className="text-sm text-muted-foreground">
              Meyve, sebze, et, süt ürünleri ve daha fazlası — hepsi tek yerde.
            </p>
          </div>

          <label className="relative flex-1 sm:max-w-md">
            <span className="sr-only">Emoji araması</span>
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Örn. elma, süt, tavuk, indirim..."
              className="h-12 w-full rounded-full border border-border bg-background pl-11 pr-11 text-sm text-foreground placeholder:text-muted-foreground shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            {text && (
              <button
                type="button"
                onClick={() => setText("")}
                aria-label="Aramayı temizle"
                className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <CategoryChip
            label={TÜMÜ}
            active={activeCategory === TÜMÜ}
            onClick={() => setActiveCategory(TÜMÜ)}
          />
          {DISPLAYED_CATEGORIES.map((category) => (
            <CategoryChip
              key={category.slug}
              label={category.label}
              active={activeCategory === category.slug}
              onClick={() => setActiveCategory(category.slug)}
            />
          ))}
        </div>

        {emojisQuery.isLoading ? (
          <FinderSkeleton />
        ) : emojisQuery.isError ? (
          <div className="mt-5 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 px-4 py-10 text-center">
            <p className="font-heading text-sm font-semibold text-destructive">
              Emoji listesi yüklenemedi
            </p>
            <p className="text-xs text-muted-foreground">
              Lütfen bağlantınızı kontrol edip tekrar deneyin.
            </p>
          </div>
        ) : results.length > 0 ? (
          showAll ? (
            <div className="mt-5 space-y-5">
              {grouped.map(([subgroup, items]) => (
                <div key={subgroup}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {subgroup}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">
                      {items.length} seçenek
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                    {items.map((emoji) => (
                      <EmojiTile
                        key={emoji.character}
                        emoji={emoji}
                        isSelected={emoji.character === selectedEmoji}
                        onSelect={() => setSelectedEmoji(emoji.character)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {results.map((emoji) => (
                <EmojiTile
                  key={emoji.character}
                  emoji={emoji}
                  isSelected={emoji.character === selectedEmoji}
                  onSelect={() => setSelectedEmoji(emoji.character)}
                />
              ))}
            </div>
          )
        ) : (
          <div className="mt-5 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-background text-muted-foreground shadow-sm">
              <Search className="size-5" />
            </span>
            <p className="font-heading text-sm font-semibold text-foreground">
              Sonuç bulunamadı
            </p>
            <p className="text-xs text-muted-foreground">
              &quot;{text}&quot; için eşleşen emoji yok. Farklı bir kelime deneyin.
            </p>
          </div>
        )}

        {selectedOption && (
          <div className="mt-5 flex flex-col gap-4 rounded-2xl bg-muted/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                key={selectedOption.character}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
                className="grid size-16 shrink-0 place-items-center rounded-2xl bg-background shadow-sm"
              >
                <Image
                  src={selectedOption.url}
                  alt={selectedOption.turkishName}
                  width={72}
                  height={72}
                  unoptimized
                  className="size-12"
                />
              </motion.div>
              <div className="min-w-0">
                <p className="font-heading text-lg font-semibold text-foreground sm:text-xl">
                  {selectedOption.turkishName}
                </p>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {selectedOption.subGroupLabel} ·{" "}
                  {selectedOption.terms.slice(0, 3).join(" · ")}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 sm:self-auto"
            >
              <Sparkles className="size-4" />
              Seçimi kullan
            </button>
          </div>
        )}
      </div>
    </Section>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition sm:text-sm ${
        active
          ? "border-brand bg-brand text-brand-foreground shadow-sm"
          : "border-border bg-background text-muted-foreground hover:border-brand/50 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function EmojiTile({
  emoji,
  isSelected,
  onSelect,
}: {
  emoji: EnrichedEmoji;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.94 }}
      aria-label={emoji.turkishName}
      aria-pressed={isSelected}
      className={`group relative flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 transition ${
        isSelected
          ? "border-brand bg-brand/5 shadow-sm"
          : "border-border bg-background hover:border-brand/50 hover:bg-muted/60"
      }`}
    >
      <span className="grid size-12 place-items-center rounded-xl bg-muted/60 sm:size-14">
        <Image
          src={emoji.url}
          alt={emoji.turkishName}
          width={56}
          height={56}
          unoptimized
          className="size-8 sm:size-10"
        />
      </span>
      <span className="line-clamp-1 w-full text-center text-[11px] font-medium text-foreground sm:text-xs">
        {emoji.turkishName}
      </span>
      {isSelected && (
        <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-brand text-[10px] font-bold text-brand-foreground shadow-sm">
          ✓
        </span>
      )}
    </motion.button>
  );
}

function FinderSkeleton() {
  return (
    <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
      {Array.from({ length: 24 }).map((_, index) => (
        <div
          key={index}
          className="flex aspect-square animate-pulse items-center justify-center rounded-2xl border border-border bg-muted"
        />
      ))}
    </div>
  );
}
