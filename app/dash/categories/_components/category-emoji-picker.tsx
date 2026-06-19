"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Search, Sparkles, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type {
  EmojiListResponse,
  EnrichedEmoji,
} from "@/app/api/emojis/route";
import { Button } from "@/components/ui/button";

const SUGGESTION_LIMIT = 5;
const FULL_LIMIT = 48;

export type CategoryEmojiPickerProps = {
  query: string;
  selectedEmoji: string | null;
  onSelect: (emoji: string, url: string) => void;
};

export function CategoryEmojiPicker({
  query,
  selectedEmoji,
  onSelect,
}: CategoryEmojiPickerProps) {
  const [expanded, setExpanded] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    setExpanded(false);
    const handle = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(handle);
  }, [query]);

  const limit = expanded ? FULL_LIMIT : SUGGESTION_LIMIT;
  const trimmed = debouncedQuery.trim();

  const emojisQuery = useQuery<EmojiListResponse>({
    queryKey: ["emojis", "search", debouncedQuery, limit],
    queryFn: async () => {
      const url = new URL("/api/emojis", window.location.origin);
      url.searchParams.set("q", debouncedQuery);
      url.searchParams.set("limit", String(limit));
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Emoji araması başarısız oldu.");
      }
      return response.json();
    },
    enabled: trimmed.length > 0,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  });

  const allEmojis: EnrichedEmoji[] = emojisQuery.data?.emojis ?? [];
  const totalAvailable = allEmojis.length;
  const visible = allEmojis;
  const translatedQuery = emojisQuery.data?.translatedQuery;

  const selectedOption = selectedEmoji
    ? visible.find((emoji) => emoji.character === selectedEmoji) ??
      allEmojis.find((emoji) => emoji.character === selectedEmoji) ??
      null
    : null;

  const showSuggestions =
    trimmed.length > 0 && (emojisQuery.isLoading || totalAvailable > 0);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-background">
          {selectedOption ? (
            <motion.div
              key={selectedOption.character}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
              className="grid size-full place-items-center"
            >
              <Image
                src={selectedOption.url}
                alt={selectedOption.turkishName}
                width={48}
                height={48}
                unoptimized
                className="size-9"
              />
            </motion.div>
          ) : (
            <Sparkles className="size-5 text-muted-foreground" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-foreground">
            {selectedOption
              ? selectedOption.turkishName
              : trimmed
                ? "Emoji seçilmedi"
                : "Henüz arama yapılmadı"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {selectedOption
              ? `${selectedOption.subGroupLabel} · URL kaydedilecek`
              : trimmed
                ? "Listeden bir emoji seçin"
                : "Kategori adını yazın, uygun emojiler burada görünecek"}
          </p>
        </div>
      </div>

      {showSuggestions ? (
        <EmojiResults
          emojis={visible}
          isLoading={emojisQuery.isLoading}
          isError={emojisQuery.isError}
          query={trimmed}
          translatedQuery={translatedQuery}
          selectedEmoji={selectedEmoji}
          onSelect={onSelect}
        />
      ) : trimmed.length === 0 ? (
        <EmptyHint />
      ) : emojisQuery.isError ? (
        <ErrorHint />
      ) : (
        <NoResults query={trimmed} />
      )}

      <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
        <span className="text-[11px] text-muted-foreground">
          {trimmed
            ? expanded
              ? `İlk ${FULL_LIMIT} sonuç gösteriliyor`
              : `İlk ${SUGGESTION_LIMIT} öneri gösteriliyor`
            : "Sonuçları görmek için arama yapın"}
        </span>
        <Button
          type="button"
          size="sm"
          variant={expanded ? "secondary" : "default"}
          onClick={() => setExpanded((prev) => !prev)}
          disabled={!trimmed || emojisQuery.isLoading}
          className="h-8 rounded-full px-4 text-xs"
        >
          <Search className="size-3.5" />
          {expanded ? "Önerilere dön" : "Ara"}
        </Button>
      </div>
    </div>
  );
}

function EmojiResults({
  emojis,
  isLoading,
  isError,
  query,
  translatedQuery,
  selectedEmoji,
  onSelect,
}: {
  emojis: EnrichedEmoji[];
  isLoading: boolean;
  isError: boolean;
  query: string;
  translatedQuery?: string;
  selectedEmoji: string | null;
  onSelect: (emoji: string, url: string) => void;
}) {
  if (isError) return <ErrorHint />;
  if (isLoading) return <EmojiGridSkeleton />;
  if (emojis.length === 0) return <NoResults query={query} />;
  return (
    <>
      {translatedQuery && translatedQuery.toLowerCase() !== query.toLowerCase() && (
        <p className="text-[11px] text-muted-foreground">
          &quot;{query}&quot; için İngilizce karşılığı:{" "}
          <span className="font-medium text-foreground">{translatedQuery}</span>
        </p>
      )}
      <div className="grid max-h-72 grid-cols-5 gap-2 overflow-y-auto rounded-lg border border-border bg-background p-2 sm:grid-cols-6">
        {emojis.map((emoji) => (
          <EmojiTile
            key={emoji.character}
            emoji={emoji}
            isSelected={emoji.character === selectedEmoji}
            onSelect={() => onSelect(emoji.character, emoji.url)}
          />
        ))}
      </div>
    </>
  );
}

function EmptyHint() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-background px-4 py-8 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
        <Sparkles className="size-4" />
      </span>
      <p className="text-xs font-medium text-foreground">
        Emoji seçimi için hazır
      </p>
      <p className="max-w-xs text-[11px] text-muted-foreground">
        Yukarıdaki kategori adı alanına yazmaya başlayın. Türkçe terim
        otomatik olarak İngilizceye çevrilir ve uygun emojiler listelenir.
      </p>
    </div>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center">
      <Search className="size-4 text-muted-foreground" />
      <p className="text-xs font-medium text-foreground">Sonuç bulunamadı</p>
      <p className="text-[11px] text-muted-foreground">
        &quot;{query}&quot; için eşleşen emoji yok. Aramayı genişletmek için
        &quot;Ara&quot; butonunu kullanın.
      </p>
    </div>
  );
}

function ErrorHint() {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-destructive/40 bg-destructive/5 px-4 py-6 text-center">
      <p className="text-xs font-medium text-destructive">
        Emoji listesi alınamadı
      </p>
      <p className="text-[11px] text-muted-foreground">
        Lütfen daha sonra tekrar deneyin.
      </p>
    </div>
  );
}

function EmojiGridSkeleton() {
  return (
    <div className="grid max-h-72 grid-cols-5 gap-2 overflow-hidden rounded-lg border border-border bg-background p-2 sm:grid-cols-6">
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className="aspect-square animate-pulse rounded-lg bg-muted"
        />
      ))}
    </div>
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
      title={emoji.turkishName}
      className={`group relative flex aspect-square items-center justify-center rounded-lg border p-1.5 transition ${
        isSelected
          ? "border-foreground bg-foreground/5 shadow-sm"
          : "border-border bg-background hover:border-foreground/40 hover:bg-muted/60"
      }`}
    >
      <Image
        src={emoji.url}
        alt={emoji.turkishName}
        width={48}
        height={48}
        unoptimized
        className="size-8"
      />
      <span className="absolute inset-x-1 bottom-0.5 truncate text-center text-[9px] font-medium text-muted-foreground">
        {emoji.turkishName}
      </span>
      {isSelected && (
        <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-foreground text-[9px] font-bold text-background shadow-sm">
          <X className="size-2.5" />
        </span>
      )}
    </motion.button>
  );
}
