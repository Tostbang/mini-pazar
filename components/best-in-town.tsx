"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageOff, MapPin } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { RemoteSvg } from "@/components/remote-svg";
import { Section } from "@/components/section";
import { useGetHomeCards, type CityAdvantageCard } from "@/lib/home-cards";
import { resolveImageUrl } from "@/lib/image-url";

/**
 * Treat URLs ending in .svg as vector assets so we can inline them and let
 * a parent `text-*` class drive the color via `currentColor`. Anything
 * else (png/jpg/webp) keeps going through next/image.
 */
function isSvgUrl(url: string): boolean {
  const path = url.split("?")[0].split("#")[0].toLowerCase();
  return path.endsWith(".svg");
}

const FALLBACK_TITLE = "Size her zaman\nşehrin en iyisini sunuyoruz";
const FALLBACK_DESCRIPTION =
  "2007'den beri ürün geliştirme, destek ve\ngüncellemelerde mükemmelliği sorunsuz alışveriş deneyimi için sunuyoruz.";

export function BestInTown() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const query = useGetHomeCards();
  const section = mounted ? query.data?.cityAdvantagesSection : undefined;
  const enabled = section?.enabled ?? true;

  const cards = useMemo(
    () => (section?.cards ?? []).filter((c) => Boolean(c?.title)),
    [section?.cards],
  );

  if (!enabled) return null;
  if (cards.length === 0) return null;

  const title = section?.title?.trim() || FALLBACK_TITLE;
  const description = section?.description?.trim() || FALLBACK_DESCRIPTION;

  return (
    <Section className="py-8">
      <div className="relative overflow-hidden rounded-[2rem] bg-lime pb-0 pt-12 text-lime-foreground sm:pt-16">
        {/* Curved top edge — a "lens" of background color that bites into the
            lime, separating this section from the one above. */}
        
        <div className="relative px-6 pt-2 text-center">
          <h2 className="whitespace-pre-line font-heading text-3xl font-semibold leading-tight text-brand text-balance sm:text-[44px] sm:leading-[1.1]">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl whitespace-pre-line text-pretty leading-relaxed text-brand/80">
            {description}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-px bg-brand/15 lg:grid-cols-4">
          {cards.map((card, index) => (
            <AdvantageCard key={`${card.title}-${index}`} card={card} index={index} />
          ))}
        </div>
      </div>
    </Section>
  );
}

function AdvantageCard({
  card,
  index,
}: {
  card: CityAdvantageCard;
  index: number;
}) {
  const imageUrl = resolveImageUrl(card.imageUrl);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="flex aspect-[1/1.1] flex-col items-start justify-between gap-10 bg-brand px-6 py-8 text-lime"
    >
      <h3 className="font-heading whitespace-pre-line text-xl font-semibold leading-tight">
        {card.title ?? ""}
      </h3>
      {imageUrl ? (
        isSvgUrl(imageUrl) ? (
          <div className="relative size-16 overflow-hidden rounded-xl bg-lime/10 text-lime">
            <RemoteSvg
              src={imageUrl}
              className="absolute inset-0 p-2"
              ariaLabel={card.title ?? undefined}
            />
          </div>
        ) : (
          <div className="relative size-16 overflow-hidden rounded-xl bg-lime/10 text-lime">
            <Image
              src={imageUrl}
              alt={card.title ?? "Avantaj görseli"}
              fill
              sizes="64px"
              unoptimized
              className="object-contain p-2 text-lime"
            />
          </div>
        )
      ) : (
        <div className="grid size-16 place-items-center rounded-xl bg-lime/10 text-lime/60">
          {card.imageUrl ? (
            <ImageOff className="size-7" />
          ) : (
            <MapPin className="size-7" />
          )}
        </div>
      )}
    </motion.div>
  );
}
