"use client"

import { Ticket, Gift, Smartphone, Package } from "lucide-react"
import { motion } from "motion/react"
import { Section } from "@/components/section"
import { useSiteSettingsStore } from "@/lib/store/site-settings-store"

const FALLBACK_SITE_NAME = "Mağaza"

const cards = [
  { id: "gift", title: "Hediye çeki", Icon: Ticket },
  { id: "card", title: "Hediye kartı\nverin", Icon: Gift },
  { id: "tabby", title: "Tabby faturanızı\nödeyin", Icon: Smartphone },
  { id: "pickup", title: "Sipariş ver\nmağazadan al", Icon: Package },
]

export function BestInTown() {
  // Pulled from the dashboard so the first card adapts to the shop's brand.
  // We keep the static copy ("Hediye çeki") generic by default and only
  // prefix the siteName when it's been configured to a real label.
  const siteName =
    useSiteSettingsStore((state) => state.settings?.siteName?.trim()) ||
    FALLBACK_SITE_NAME

  const renderedCards = cards.map((card) => ({
    ...card,
    title:
      card.id === "gift" && siteName !== FALLBACK_SITE_NAME
        ? `${siteName}\n${card.title}`
        : card.title,
  }))

  return (
    <Section className="py-8">
      <div className="relative overflow-hidden rounded-[2rem] bg-lime pb-0 pt-12 text-lime-foreground sm:pt-16">
        {/* Curved top edge - white "lens" cuts the lime top */}
        <svg
          viewBox="0 0 100 14"
          preserveAspectRatio="none"
          className="pointer-events-none absolute -top-px left-0 h-7 w-full text-background"
          aria-hidden
        >
          <path
            d="M0 0 L100 0 L100 14 Q50 28 0 14 Z"
            fill="currentColor"
          />
        </svg>

        <div className="relative px-6 pt-2 text-center">
          <h2 className="font-heading text-3xl font-semibold leading-tight text-brand text-balance sm:text-[44px] sm:leading-[1.1]">
            Size her zaman
            <br />
            şehrin en iyisini sunuyoruz
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-brand/80">
            2007'den beri ürün geliştirme, destek ve
            <br className="hidden sm:block" />
            güncellemelerde mükemmelliği sorunsuz alışveriş deneyimi için sunuyoruz.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-px bg-brand/15 lg:grid-cols-4">
          {renderedCards.map(({ title, Icon }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex aspect-[1/1.1] flex-col items-start justify-between gap-10 bg-brand px-6 py-8 text-lime"
            >
              <h3 className="font-heading whitespace-pre-line text-xl font-semibold leading-tight">
                {title}
              </h3>
              <Icon className="size-16 stroke-1 text-lime/50" />
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  )
}
