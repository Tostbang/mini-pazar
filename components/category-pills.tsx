"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { Section } from "@/components/section";

const emojiUrl = (emoji: string) =>
  `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${[...emoji]
    .map((char) => char.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join("-")}.png`;

const categories = [
  {
    name: "Sebze",
    sub: "Yerel market",
    emoji: "🥬",
  },
  {
    name: "Atıştırmalık & Ekmek",
    sub: "Mağaza teslimatı",
    emoji: "🥐",
  },
  {
    name: "Meyve",
    sub: "Ücretsiz kargo",
    emoji: "🍉",
  },
  {
    name: "Tavuk",
    sub: "Dondurulmuş yemek",
    emoji: "🍗",
  },
  {
    name: "Süt & Süt Ürünleri",
    sub: "İşlenmiş gıda",
    emoji: "🥛",
  },
];

export function CategoryPills() {
  return (
    <Section>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map(({ name, sub, emoji }, i) => (
          <motion.button
            key={name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4 }}
            className="group relative flex  flex-col justify-between overflow-hidden rounded-md bg-card p-4 text-left transition-shadow hover:shadow-md"
          >
            <div className="relative z-10 ">
              <span className="block font-heading text-[15px] font-semibold leading-tight text-foreground">
                {name}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {sub}
              </span>
            </div>
            <div className=" size-[62px] absolute bottom-2 right-2 transition-transform duration-300 group-hover:scale-110">
              <Image
                src={emojiUrl(emoji)}
                alt={name}
                width={80}
                height={80}
                className="h-full w-full object-contain"
              />
            </div>
          </motion.button>
        ))}

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          whileHover={{ y: -4 }}
          className="flex flex-col items-center justify-center gap-2 rounded-lg bg-lime py-6 text-lime-foreground shadow-sm"
        >
          <span className="grid size-10 place-items-center rounded-full bg-card text-foreground">
            <ArrowRight className="size-5" />
          </span>
          <span className="font-heading text-sm font-semibold">Tümü</span>
        </motion.button>
      </div>
    </Section>
  );
}
