"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, FolderTree } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { Section } from "@/components/section";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCategories, type CategoryListItem } from "@/app/(site)/category/_services/queries";

const emojiUrl = (emoji: string) =>
  `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${[...emoji]
    .map((char) => char.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join("-")}.png`;

export function CategoryPills() {
  const categoriesQuery = useGetCategories();

  // The shared QueryClient rehydrates from sessionStorage on creation
  // (see lib/query-persist.ts). On the client that means
  // `categoriesQuery.isLoading` is `false` immediately, while on the
  // server it is `true` — so a straight `isLoading` branch would render
  // the skeleton on the server and populated pills on the client and
  // React would throw a hydration mismatch. Defer the real render until
  // after mount so the first paint matches the SSR'd skeleton; once
  // mounted the cached data appears without a flicker.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const categories = (categoriesQuery.data?.categories ?? []).filter(
    (category): category is CategoryListItem => Boolean(category),
  );

  return (
    <Section>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {!mounted || categoriesQuery.isLoading ? (
          <CategoryPillsSkeleton />
        ) : (
          <>
            {categories.slice(0, 5).map((category, i) => (
              <CategoryPill
                key={category.categoryId}
                category={category}
                index={i}
              />
            ))}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              whileHover={{ y: -4 }}
            >
              <Link
                href="/"
                className="flex h-full flex-col items-center justify-center gap-2 rounded-lg bg-lime py-6 text-lime-foreground shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="grid size-10 place-items-center rounded-full bg-card text-foreground">
                  <ArrowRight className="size-5" />
                </span>
                <span className="font-heading text-sm font-semibold text-brand">Tümü</span>
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </Section>
  );
}

function CategoryPill({
  category,
  index,
}: {
  category: CategoryListItem;
  index: number;
}) {
  const name = category.categoryName?.trim() || "Kategori";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
    >
      <Link
        href={`/category/${category.categoryId}`}
        className="group relative flex h-full flex-col justify-between overflow-hidden rounded-md bg-card p-4 text-left transition-shadow hover:shadow-md"
      >
        <div className="relative z-10">
          <span className="block font-heading text-[15px] font-semibold leading-tight text-foreground">
            {name}
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            Ürünleri gör
          </span>
        </div>
        <CategoryIcon
          value={category.imageUrl}
          alt={name}
        />
      </Link>
    </motion.div>
  );
}

function CategoryIcon({
  value,
  alt,
}: {
  value?: string | null;
  alt: string;
}) {
  if (!value) {
    return (
      <div className="absolute bottom-2 right-2 grid size-[62px] place-items-center text-muted-foreground">
        <FolderTree className="size-8" />
      </div>
    );
  }

  // Emoji karakterler Twemoji ile render edilir; URL'ler için Image kullanılır.
  if (isEmojiCharacter(value)) {
    return (
      <div className="size-[62px] absolute bottom-2 right-2 transition-transform duration-300 group-hover:scale-110">
        <Image
          src={emojiUrl(value)}
          alt={alt}
          width={80}
          height={80}
          unoptimized
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="size-[62px] absolute bottom-2 right-2 overflow-hidden transition-transform duration-300 group-hover:scale-110">
      <Image
        src={value}
        alt={alt}
        width={80}
        height={80}
        unoptimized
        className="h-full w-full object-contain"
      />
    </div>
  );
}

// Emoji karakterler kısa (1-2 grapheme) ve path/whitespace karakteri içermez.
function isEmojiCharacter(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.length > 8) return false;
  if (/\s/.test(trimmed)) return false;
  if (/[\/\\?#]/.test(trimmed)) return false;
  return true;
}

function CategoryPillsSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-[104px] w-full rounded-md"
        />
      ))}
    </>
  );
}
