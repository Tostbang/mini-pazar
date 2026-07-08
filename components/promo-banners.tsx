"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CreditCard, GiftIcon, ImageOff } from "lucide-react";
import { motion } from "motion/react";
import { Section } from "@/components/section";
import {
  useGetHomeCards,
  type FeaturedStoreCard,
} from "@/lib/home-cards";
import { resolveImageUrl } from "@/lib/image-url";
import Line from "@/public/banner-images/squish-line.svg";
import Line2 from "@/public/banner-images/squish-line-2.svg";
import waveLines from "@/public/banner-images/wave-line.svg";

const ICON_MAP = {
  Gift: GiftIcon,
  CreditCard,
} as const;

function pickIcon(name: string | null | undefined) {
  if (!name) return GiftIcon;
  return ICON_MAP[name as keyof typeof ICON_MAP] ?? GiftIcon;
}

export function PromoBanners() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const query = useGetHomeCards();
  const allCards = query.data?.featuredStoreCards ?? [];
  const visibleCards = mounted
    ? allCards.filter((c) => c?.enabled !== false)
    : [];

  if (!mounted) return null;
  if (visibleCards.length === 0) return null;

  return (
    <Section className="grid gap-4 md:grid-cols-2">
      {visibleCards.slice(0, 2).map((card, index) => (
        <FeaturedCard
          key={`${card.title ?? "card"}-${index}`}
          card={card}
          delay={index * 0.08}
          variant={index === 0 ? "first" : "second"}
        />
      ))}
    </Section>
  );
}

function FeaturedCard({
  card,
  delay,
  variant,
}: {
  card: FeaturedStoreCard;
  delay: number;
  variant: "first" | "second";
}) {
  const backgroundColor = card.backgroundColor?.trim() || "#083e74";
  const Icon = pickIcon(card.labelIcon);
  const imageUrl = resolveImageUrl(card.imageUrl);
  // Decorative pattern lines that sit behind the copy. The original design
  // used `squish-line.svg` on the second card and `squish-line-2.svg` on the
  // first to add visual texture; we keep that mapping by index.
  const DecorLine = variant === "second" ? Line : Line2;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative overflow-hidden rounded-[30px] p-7 text-white"
      style={{ backgroundColor }}
    >
      <Image
        src={DecorLine}
        alt=""
        aria-hidden
        width={300}
        height={300}
        className={
          variant === "second"
            ? "pointer-events-none absolute w-36 opacity-20 left-1/2 bottom-0 z-0"
            : "pointer-events-none absolute w-[300px] left-[45%] -bottom-8 z-0"
        }
      />
      {card.label ? (
        <span
          className="relative z-10 inline-flex items-center gap-1.5 rounded-[4px] bg-white/80 px-3 py-1 text-[13px] font-semibold"
          style={{ color: backgroundColor }}
        >
          <Icon className="size-4" />
          {card.label}
        </span>
      ) : null}
      <div className="relative z-10 flex items-center">
        <p className="mt-4 w-2/3 whitespace-pre-line font-heading text-2xl font-semibold leading-tight sm:text-[28px] text-white/80">
          {card.title ?? ""}
        </p>
        {imageUrl ? (
          <div className="w-1/3 flex justify-center">
            <div className="w-36">
              <Image
                src={imageUrl}
                alt={card.title ?? "Kampanya görseli"}
                width={200}
                height={200}
                unoptimized
                className="w-full h-full max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        ) : (
          <div className="w-1/3 flex justify-center">
            <div className="grid size-24 place-items-center rounded-2xl bg-white/10 text-white/50">
              <ImageOff className="size-8" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function DeliveryBanner() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const query = useGetHomeCards();
  const card = mounted ? query.data?.stayHomeCard : undefined;
  const enabled = card?.enabled ?? true;

  if (!enabled) return null;

  const title = card?.title?.trim() || "Evde Kalın, Tüm İhtiyaçlarınızı Marketimizden Alın!";
  const description =
    card?.description?.trim() ||
    "App Store veya Google Play'den uygulamayı indirin";
  const backgroundColor = card?.backgroundColor?.trim() || "#6c1143";
  const imageUrl = resolveImageUrl(card?.imageUrl);
  const showDownloadButtons = card?.appDwonloadButton ?? true;

  return (
    <Section>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex h-auto min-h-[60vh] flex-col items-start justify-between gap-6 overflow-hidden rounded-[2.5rem] p-8 text-white sm:flex-row sm:items-center sm:p-12"
        style={{ backgroundColor }}
      >
        {/* Decorative pattern lines that gave this banner its visual identity
            in the previous design. All three are decorative — kept behind the
            copy with low opacity so they add texture without competing. */}
        <Image
          src={Line2}
          alt=""
          aria-hidden
          width={300}
          height={300}
          className="pointer-events-none absolute w-[300px] left-[45%] -bottom-8 z-0"
        />
        <Image
          src={Line}
          alt=""
          aria-hidden
          width={300}
          height={300}
          className="pointer-events-none absolute w-36 opacity-20 left-2 rotate-30 top-5 z-0"
        />
        <Image
          src={waveLines}
          alt=""
          aria-hidden
          width={300}
          height={300}
          className="pointer-events-none absolute w-52 opacity-20 right-0 top-0 z-0"
        />
        <div className="relative z-10 max-w-xl">
          <h3 className="whitespace-pre-line font-heading text-3xl font-semibold leading-tight sm:text-[44px] text-white/90">
            {title}
          </h3>
          <p className="mt-4 whitespace-pre-line text-sm font-medium text-white/70">
            {description}
          </p>
          {showDownloadButtons ? (
            <div className="mt-7 flex flex-wrap gap-4">
              <button className="flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 transition-transform hover:scale-105">
                <Image
                  src="/banner-images/Google play.svg"
                  alt="Google Play"
                  width={24}
                  height={24}
                />
                <div className="text-left">
                  <p className="text-[10px] uppercase leading-none opacity-70">
                    İndirin
                  </p>
                  <p className="text-md font-base leading-none">Google Play</p>
                </div>
              </button>
              <button className="flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 transition-transform hover:scale-105">
                <Image
                  src="/banner-images/Apple logo.svg"
                  alt="App Store"
                  width={24}
                  height={24}
                />
                <div className="text-left">
                  <p className="text-[10px] uppercase leading-none opacity-70">
                    İndirin
                  </p>
                  <p className="text-md font-base leading-none">App Store</p>
                </div>
              </button>
            </div>
          ) : null}
        </div>

        {imageUrl ? (
          <div className="relative w-full sm:absolute sm:right-10 sm:top-0 sm:h-full sm:w-[40%] pt-12">
            <div className="h-full">
              <Image
                src={imageUrl}
                alt={title || "Görsel"}
                width={2000}
                height={2000}
                unoptimized
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        ) : null}
      </motion.div>
    </Section>
  );
}