"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { motion } from "motion/react"
import { ProductCard } from "@/components/product-card"
import { products } from "@/lib/products"
import { Section } from "@/components/section"

const tabs = ["Dondurulmuş gıda", "Sebze", "Atıştırmalık", "Tavuk", "Et & Köfte", "Süt & Süt Ürünleri", "Çikolata", "Meyve"]

const tabProducts: Record<string, string[]> = {
  "Dondurulmuş gıda": ["frozen-deer", "frozen-fish", "bonduelle-mix", "frozen-meat", "chicken-penne"],
  Sebze: ["cabbage", "carrot", "cucumber", "beetroot", "avocado"],
  Atıştırmalık: ["lays-chips", "peanut-butter", "corn", "szam-amm", "plant-hunter"],
  Tavuk: ["chicken-penne", "chicken", "beef", "fish", "frozen-deer"],
  "Et & Köfte": ["frozen-meat", "beef", "chicken-penne", "frozen-deer", "fish"],
  "Süt & Süt Ürünleri": ["peanut-butter", "corn", "cold-drinks", "szam-amm", "bonduelle-mix"],
  Çikolata: ["lays-chips", "cold-drinks", "peanut-butter", "corn", "szam-amm"],
  Meyve: ["avocado", "beetroot", "carrot", "cabbage", "cucumber"],
}

export function BestSelling() {
  const [active, setActive] = useState("Dondurulmuş gıda")

  return (
    <Section>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-intro text-2xl font-extrabold sm:text-3xl">Haftanın en çok satanları</h2>
        <Link href="#" className="flex items-center gap-1.5 text-sm font-bold text-orange-600 hover:text-orange-700">
          Daha fazla <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2.5">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active === tab ? "text-brand-foreground" : "bg-card text-foreground hover:bg-muted"
            }`}
          >
            {active === tab && (
              <motion.span
                layoutId="active-tab"
                className="absolute inset-0 rounded-full bg-brand"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative">{tab}</span>
          </button>
        ))}
      </div>

      <motion.div
        key={active}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
      >
        {tabProducts[active].map((id) => (
          <ProductCard key={id} product={products[id]} />
        ))}
      </motion.div>
    </Section>
  )
}
