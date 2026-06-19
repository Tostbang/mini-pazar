"use client"

import Image from "next/image"
import { Sun, Sparkles, Award, Truck } from "lucide-react"
import { motion } from "motion/react"
import { Section } from "@/components/section"

const offers = [
  {
    label: "Tasarruf",
    big: "₺29",
    top: "bg-[#fde2e6]",
    bottom: "from-[#5a1530] to-[#3a0a1d]",
    title: "text-[#9b1c43]",
    Icon: Sun,
    image: "/products/flour.png",
  },
  {
    label: "İndirim",
    big: "%30",
    top: "bg-[#fde9d2]",
    bottom: "from-[#8a3a13] to-[#5a240a]",
    title: "text-[#b25418]",
    Icon: Sparkles,
    image: "/products/peanut-butter.png",
  },
  {
    label: "Varan",
    big: "%50",
    top: "bg-[#d8e9f5]",
    bottom: "from-[#143a66] to-[#0a2342]",
    title: "text-[#1d4f86]",
    Icon: Award,
    image: "/products/peanut-butter.png",
  },
  {
    label: "Bedava",
    big: "KARGO",
    top: "bg-[#e8d8f0]",
    bottom: "from-[#4a1d80] to-[#2a0a4a]",
    title: "text-[#5a1d80]",
    Icon: Truck,
    image: "/products/frozen-pack.png",
  },
]

export function OfferCards() {
  return (
    <Section>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {offers.map((o, i) => (
          <motion.div
            key={o.big}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -6 }}
            className="overflow-hidden rounded-3xl"
          >
            <div className={`relative ${o.top} px-5 pb-6 pt-5`}>
              <o.Icon
                strokeWidth={1.5}
                className={`absolute right-4 top-4 size-7 ${o.title} opacity-70`}
              />
              <p className={`font-heading text-lg font-semibold ${o.title}`}>
                {o.label}
              </p>
              <p className={`font-heading text-[40px] font-bold leading-none ${o.title}`}>
                {o.big}
              </p>
              <p className="mt-3 text-sm leading-snug text-foreground/70">
                Her türlü market ve
                <br />
                dondurulmuş üründe indirim
              </p>
            </div>
            <div
              className={`relative flex h-40 items-center justify-center bg-gradient-to-b ${o.bottom}`}
            >
              <Image
                src={o.image || "/placeholder.svg"}
                alt={o.label}
                width={130}
                height={130}
                className="object-contain drop-shadow-xl"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  )
}
