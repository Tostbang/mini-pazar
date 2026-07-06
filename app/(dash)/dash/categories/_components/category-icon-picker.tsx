"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/format";

export type CategoryIcon = {
  character: string;
  turkishName: string;
  englishName: string;
  group: string;
  subGroup: string;
  subGroupLabel: string;
  terms: string[];
};

type CategoryIconListResponse = {
  emojis?: CategoryIcon[];
};

interface CategoryIconPickerProps {
  query: string;
  selectedIcon: string | null;
  onSelect: (character: string) => void;
}

export function CategoryIconPicker({
  query,
  selectedIcon,
  onSelect,
}: CategoryIconPickerProps) {
  const iconsQuery = useQuery<CategoryIconListResponse>({
    queryKey: ["icons", "all"],
    queryFn: async () => {
      const response = await fetch("/api/emojis");
      if (!response.ok) {
        throw new Error("Icon listesi alınamadı.");
      }
      return (await response.json()) as CategoryIconListResponse;
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  const allIcons = iconsQuery.data?.emojis ?? [];

  // Filter icons by the parent-controlled query (the category name input).
  // When the query is empty, show the full grid so the user can still pick.
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return allIcons;
    return allIcons.filter(
      (icon) =>
        icon.turkishName.toLowerCase().includes(term) ||
        icon.englishName.toLowerCase().includes(term) ||
        icon.terms.some((t) => t.toLowerCase().includes(term)),
    );
  }, [allIcons, query]);

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      {iconsQuery.isLoading ? (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {Array.from({ length: 18 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : iconsQuery.isError ? (
        <div className="rounded-lg border border-dashed border-destructive/40 bg-destructive/5 px-3 py-6 text-center text-xs text-destructive">
          Icon listesi yüklenemedi. Lütfen tekrar deneyin.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-6 text-center text-xs text-muted-foreground">
          Eşleşen icon bulunamadı.
        </div>
      ) : (
        <div className="grid max-h-64 grid-cols-5 gap-2 overflow-y-auto sm:grid-cols-6">
          {filtered.map((icon) => {
            const isSelected = icon.character === selectedIcon;
            return (
              <button
                key={icon.character}
                type="button"
                onClick={() => onSelect(icon.character)}
                aria-label={icon.turkishName}
                aria-pressed={isSelected}
                className={cn(
                  "group relative flex aspect-square items-center justify-center rounded-lg border bg-background p-1.5 transition",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50 hover:bg-muted/60",
                )}
              >
                <span
                  role="img"
                  aria-hidden="true"
                  className="text-2xl leading-none"
                >
                  {icon.character}
                </span>
                {isSelected && (
                  <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}